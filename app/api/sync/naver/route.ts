import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildSeoTitle } from "@/lib/property-seo";
import { detectPropertyDisplayType, sanitizePropertyArea } from "@/lib/property-normalize";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.NAVER_SYNC_SECRET;
const allowedRealtors = (process.env.NAVER_SYNC_ALLOWED_REALTORS ?? "").split(",").map((v) => v.trim()).filter(Boolean);

type NaverListing = { article_no:string; region?:string; address?:string; road_address?:string; property_type?:string; trade_type?:string; price?:string; area?:string; floor?:string; realtor?:string; move_in?:string; description?:string; };

function unauthorized(message="Unauthorized"){return NextResponse.json({ok:false,error:message},{status:401});}
function normalized(value:unknown){return String(value??"").trim();}

function deriveGeography(listing:NaverListing){
 const address=normalized(listing.road_address)||normalized(listing.address); const region=normalized(listing.region); const parts=address.split(/\s+/).filter(Boolean);
 const province=parts.find((p)=>/(?:도|특별시|광역시|특별자치시|특별자치도)$/.test(p))||"";
 const cityCounty=parts.find((p,i)=>i>0&&/(?:시|군|구)$/.test(p))||""; const town=parts.find((p)=>/(?:읍|면|동)$/.test(p))||region;
 return {address,shortRegion:town||cityCounty||region,descriptionRegion:[province,cityCounty,town].filter(Boolean).join(" ")||address||region};
}

function getListingType(listing:NaverListing){const {address,shortRegion}=deriveGeography(listing);return detectPropertyDisplayType({type:normalized(listing.property_type),address,location:shortRegion,description:normalized(listing.description)});}

const OPTION_ICONS:Record<string,string>={
 "에어컨":"❄️","세탁기":"🧺","TV":"📺","티비":"📺","신발장":"👟","냉장고":"🧊","가스레인지":"🔥","싱크대":"🚰","CCTV":"📹","도어락":"🔐","현관보안":"🔐","인터폰":"📞","인터넷":"🌐","유선":"📺","천장형 건조대":"👕","건조대":"👕"
};

function addOptionIcons(description:string){
 const lines=description.split(/\r?\n/); let inOptions=false;
 return lines.map((line)=>{
   const t=line.trim();
   if(/^옵션\s*:??\s*$/.test(t)){inOptions=true;return "옵션";}
   if(inOptions&&t&&/^(?:매물\s*특징|매물\s*정보|상세\s*정보|교통|입지|추천)/.test(t)){inOptions=false;}
   if(!inOptions||!t)return line;
   const prefix=/^[•·\-]/.test(t)?"• ":""; const body=t.replace(/^[•·\-]\s*/,"");
   const parts=body.split(/\s*[·,/]\s*/).filter(Boolean).map((part)=>{
     const clean=part.replace(/^[^가-힣A-Za-z0-9]+/,"").trim();
     const key=Object.keys(OPTION_ICONS).find((k)=>clean.toLowerCase()===k.toLowerCase());
     return key?`${OPTION_ICONS[key]} ${clean}`:part.trim();
   });
   return `${prefix}${parts.join(" · ")}`;
 }).join("\n");
}

function preserveSourceFeatures(description:string){
 // 원본 상세설명 우선: 특징을 새로 만들지 않고, 명백히 잘려 저장된 문장만 복원합니다.
 const lines=description.split(/\r?\n/); const out:string[]=[];
 for(let i=0;i<lines.length;i++){
   const t=lines[i].trim(); const next=(lines[i+1]??"").trim();
   if(/^[•·\-]\s*(?:디지스트|DGIST)\s*학생입니다\.?$/i.test(t)&&/^[•·\-]\s*직원(?:과|및)/.test(next)){
     out.push("• 디지스트 학생 및 직원, 인근 직장인이 생활하기 편리한 위치입니다."); i+=1; continue;
   }
   // 편의점/마트처럼 원문 맥락이 사라진 단독 명사 문장은 임의 확장하지 않고 제거합니다.
   if(/^[•·\-]\s*(?:편의점|마트)입니다\.?$/.test(t)) continue;
   out.push(lines[i]);
 }
 return out.join("\n");
}

function sanitizeDescription(listing:NaverListing){
 let description=normalized(listing.description); if(!description)return "";
 const {descriptionRegion}=deriveGeography(listing); const propertyType=getListingType(listing); const tradeType=normalized(listing.trade_type);
 if(descriptionRegion&&propertyType&&propertyType!=="매물"&&tradeType){
   const opening=`${descriptionRegion}에 위치한 ${propertyType} ${tradeType} 매물입니다.`;
   description=description.replace(/^[^\n.]*에 위치한\s+(?:매물\s+)?[^\n.]*매물입니다\.?/,opening);
   if(!description.startsWith(opening))description=`${opening}\n${description}`;
 }
 description=description.replace(/(\d+(?:\.\d+)?)F㎡/g,"$1㎡").replace(/전용\s*(\d+(?:\.\d+)?)F\b/g,"전용 $1㎡").replace(/전용(\d+(?:\.\d+)?)㎡/g,"전용 $1㎡");
 return addOptionIcons(preserveSourceFeatures(description));
}

function makeTitle(listing:NaverListing){const {address,shortRegion}=deriveGeography(listing);return buildSeoTitle({location:shortRegion,address,type:getListingType(listing),deal_type:normalized(listing.trade_type),description:normalized(listing.description)})||`네이버 매물 ${listing.article_no}`;}

export async function POST(request:NextRequest){
 const missing=[!supabaseUrl?"NEXT_PUBLIC_SUPABASE_URL":"",!serviceRoleKey?"SUPABASE_SERVICE_ROLE_KEY":""].filter(Boolean);
 if(missing.length)return NextResponse.json({ok:false,error:"Supabase server configuration is missing.",missing,diagnostics:{hasSupabaseUrl:Boolean(supabaseUrl),hasServiceRoleKey:Boolean(serviceRoleKey),vercelEnv:process.env.VERCEL_ENV??"unknown"}},{status:500});
 if(!syncSecret)return NextResponse.json({ok:false,error:"NAVER_SYNC_SECRET is not configured."},{status:503});
 if((request.headers.get("authorization")??"")!==`Bearer ${syncSecret}`)return unauthorized();
 let body:{listings?:NaverListing[]}; try{body=await request.json();}catch{return NextResponse.json({ok:false,error:"Invalid JSON."},{status:400});}
 const listings=Array.isArray(body.listings)?body.listings:[]; if(!listings.length)return NextResponse.json({ok:true,inserted:0,updated:0,skipped:0});
 const supabase=createClient(supabaseUrl!,serviceRoleKey!,{auth:{persistSession:false,autoRefreshToken:false}});
 let inserted=0,updated=0,skipped=0; const results:Array<Record<string,unknown>>=[];
 for(const raw of listings){
   const articleNo=normalized(raw.article_no),realtor=normalized(raw.realtor);
   if(!/^\d{9,12}$/.test(articleNo)){skipped++;results.push({article_no:articleNo,status:"skipped",reason:"invalid_article_no"});continue;}
   if(!allowedRealtors.length){skipped++;results.push({article_no:articleNo,status:"skipped",reason:"allowed_realtors_not_configured"});continue;}
   if(!allowedRealtors.includes(realtor)){skipped++;results.push({article_no:articleNo,status:"skipped",reason:"not_our_listing",realtor});continue;}
   const marker=`naver:${articleNo}`; const {address,shortRegion,descriptionRegion}=deriveGeography(raw); const propertyType=getListingType(raw);
   const payload={title:makeTitle(raw),type:propertyType!=="매물"?propertyType:(normalized(raw.property_type)||null),deal_type:normalized(raw.trade_type)||null,location:descriptionRegion||shortRegion||address,address,price:normalized(raw.price),area:sanitizePropertyArea(raw.area),floor:normalized(raw.floor),description:sanitizeDescription(raw),admin_memo:marker,listing_status:"active",is_hidden:false};
   const {data:existing,error:findError}=await supabase.from("properties").select("id").eq("admin_memo",marker).maybeSingle();
   if(findError){results.push({article_no:articleNo,status:"error",error:findError.message});continue;}
   if(existing?.id){const {error}=await supabase.from("properties").update(payload).eq("id",existing.id);if(error)results.push({article_no:articleNo,status:"error",error:error.message});else{updated++;results.push({article_no:articleNo,status:"updated",property_id:existing.id});}}
   else{const {data,error}=await supabase.from("properties").insert({...payload,image_url:""}).select("id").single();if(error||!data)results.push({article_no:articleNo,status:"error",error:error?.message??"insert_failed"});else{inserted++;results.push({article_no:articleNo,status:"inserted",property_id:data.id});}}
 }
 return NextResponse.json({ok:true,inserted,updated,skipped,results});
}
