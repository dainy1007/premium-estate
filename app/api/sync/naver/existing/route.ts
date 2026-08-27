import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta, emptyAdminMeta } from "@/lib/property-admin-meta";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.NAVER_SYNC_SECRET;

type NaverListing = {
  article_no:string;
  contract_area?:string;
  exclusive_area?:string;
  rooms?:string|number;
  bathrooms?:string|number;
  elevator?:string;
  parking?:string;
  parking_count?:string|number;
  move_in?:string;
  heating?:string;
  direction?:string;
  building_use?:string;
  approval_date?:string;
};

function normalized(value:unknown){return String(value??"").trim();}
function cleanUnknown(value:unknown){const v=normalized(value);return !v||v==="-"||v==="-/-"||v==="없음"?"":v;}
function optionalNumber(value:unknown){const v=normalized(value);if(!v)return undefined;const match=v.match(/\d+/);return match?Number(match[0]):undefined;}
function cleanArea(value:unknown){const v=cleanUnknown(value);if(!v)return "";const match=v.match(/\d+(?:\.\d+)?/);return match?match[0]:v;}

function mergeMeta(description:string,listing:NaverListing){
  const current=description.includes("<!--PROPERTY_ADMIN_META:")?parseAdminMeta(description):emptyAdminMeta();
  const count=optionalNumber(listing.parking_count);
  const parkingRaw=cleanUnknown(listing.parking);
  const parking=parkingRaw?(count&&!parkingRaw.includes(String(count))?`${parkingRaw} / 총 ${count}대`:parkingRaw):(count?`총 ${count}대`:"");
  const incoming={
    elevator:cleanUnknown(listing.elevator),
    parking,
    moveIn:cleanUnknown(listing.move_in),
    heating:cleanUnknown(listing.heating),
    direction:cleanUnknown(listing.direction),
    buildingUse:cleanUnknown(listing.building_use),
    approvalDate:cleanUnknown(listing.approval_date),
  };
  const infoOverrides={...current.infoOverrides};
  for(const key of Object.keys(incoming) as Array<keyof typeof incoming>){
    if(!infoOverrides[key]&&incoming[key])infoOverrides[key]=incoming[key];
  }
  return {...current,infoOverrides};
}

export async function POST(request:NextRequest){
  if(!supabaseUrl||!serviceRoleKey)return NextResponse.json({ok:false,error:"Supabase server configuration is missing."},{status:500});
  if(!syncSecret)return NextResponse.json({ok:false,error:"NAVER_SYNC_SECRET is not configured."},{status:503});
  if((request.headers.get("authorization")??"")!==`Bearer ${syncSecret}`)return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});

  let body:{listings?:NaverListing[]};
  try{body=await request.json();}catch{return NextResponse.json({ok:false,error:"Invalid JSON."},{status:400});}
  const listings=Array.isArray(body.listings)?body.listings:[];
  const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});

  let updated=0,skipped=0,errors=0;
  const results:Array<Record<string,unknown>>=[];

  for(const listing of listings){
    const articleNo=normalized(listing.article_no);
    if(!/^\d{9,12}$/.test(articleNo)){skipped++;results.push({article_no:articleNo,status:"skipped",reason:"invalid_article_no"});continue;}

    const marker=`naver:${articleNo}`;
    const {data:existing,error:findError}=await supabase.from("properties").select("id,description,rooms,bathrooms,contract_area,exclusive_area").eq("admin_memo",marker).maybeSingle();
    if(findError){errors++;results.push({article_no:articleNo,status:"error",error:findError.message});continue;}
    if(!existing?.id){skipped++;results.push({article_no:articleNo,status:"skipped",reason:"not_existing"});continue;}

    const meta=mergeMeta(existing.description||"",listing);
    const updatePayload:Record<string,unknown>={description:buildDescriptionWithAdminMeta(existing.description||"",meta)};
    const rooms=optionalNumber(listing.rooms),bathrooms=optionalNumber(listing.bathrooms);
    const contractArea=cleanArea(listing.contract_area),exclusiveArea=cleanArea(listing.exclusive_area);

    if(rooms!==undefined&&(existing.rooms===null||existing.rooms===undefined||Number(existing.rooms)===0))updatePayload.rooms=rooms;
    if(bathrooms!==undefined&&(existing.bathrooms===null||existing.bathrooms===undefined||Number(existing.bathrooms)===0))updatePayload.bathrooms=bathrooms;
    if(contractArea&&!normalized(existing.contract_area))updatePayload.contract_area=contractArea;
    if(exclusiveArea&&!normalized(existing.exclusive_area))updatePayload.exclusive_area=exclusiveArea;

    const {error}=await supabase.from("properties").update(updatePayload).eq("id",existing.id);
    if(error){errors++;results.push({article_no:articleNo,status:"error",error:error.message});continue;}
    updated++;results.push({article_no:articleNo,status:"updated",property_id:existing.id,existing_only:true});
  }

  return NextResponse.json({ok:errors===0,updated,skipped,errors,results});
}
