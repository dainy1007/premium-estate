import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

export const runtime = "nodejs";

const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoKey=process.env.KAKAO_REST_API_KEY;
const buildingKey=process.env.BUILDING_LEDGER_SERVICE_KEY;

type KakaoDoc={address?:{b_code?:string;main_address_no?:string;sub_address_no?:string;mountain_yn?:"Y"|"N"|string};road_address?:unknown};
type LedgerItem=Record<string,unknown>;
const text=(v:unknown)=>String(v??"").trim();

class BuildingLedgerError extends Error {
  status:number;
  upstream:string;
  constructor(message:string,status=422,upstream=""){
    super(message);
    this.name="BuildingLedgerError";
    this.status=status;
    this.upstream=upstream;
  }
}

function normalizedServiceKey(value:string){
  const raw=value.trim();
  if(!raw)return raw;
  try{return raw.includes("%")?decodeURIComponent(raw):raw;}catch{return raw;}
}

function upstreamMessage(raw:string){
  const cleaned=raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  return cleaned.slice(0,700);
}

async function resolveAddress(address:string){
  if(!kakaoKey)throw new BuildingLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED",503);
  const url=`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  const r=await fetch(url,{headers:{Authorization:`KakaoAK ${kakaoKey}`},cache:"no-store"});
  if(!r.ok)throw new BuildingLedgerError(`KAKAO_ADDRESS_${r.status}`,r.status);
  const data=await r.json() as {documents?:KakaoDoc[]};
  const doc=data.documents?.[0];
  const addr=doc?.address;
  if(!addr?.b_code)throw new BuildingLedgerError("ADDRESS_NOT_RESOLVED",422);
  const bcode=addr.b_code;
  return {
    sigunguCd:bcode.slice(0,5),
    bjdongCd:bcode.slice(5,10),
    platGbCd:addr.mountain_yn==="Y"?"1":"0",
    bun:(addr.main_address_no||"0").padStart(4,"0"),
    ji:(addr.sub_address_no||"0").padStart(4,"0")
  };
}

async function fetchLedger(address:string){
  if(!buildingKey)throw new BuildingLedgerError("BUILDING_LEDGER_SERVICE_KEY_NOT_CONFIGURED",503);
  const loc=await resolveAddress(address);
  const qs=new URLSearchParams({
    serviceKey:normalizedServiceKey(buildingKey),
    sigunguCd:loc.sigunguCd,
    bjdongCd:loc.bjdongCd,
    platGbCd:loc.platGbCd,
    bun:loc.bun,
    ji:loc.ji,
    numOfRows:"50",
    pageNo:"1",
    _type:"json"
  });
  const endpoint=`https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?${qs.toString()}`;
  const r=await fetch(endpoint,{cache:"no-store"});
  const raw=await r.text();
  if(!r.ok){
    const detail=upstreamMessage(raw)||r.statusText||"NO_RESPONSE_BODY";
    console.error("BUILDING_LEDGER_HTTP",r.status,detail,{...loc});
    throw new BuildingLedgerError(`BUILDING_LEDGER_${r.status}`,r.status,detail);
  }
  let data:any;
  try{data=JSON.parse(raw);}catch{
    const detail=upstreamMessage(raw)||"NON_JSON_RESPONSE";
    console.error("BUILDING_LEDGER_NON_JSON",detail,{...loc});
    throw new BuildingLedgerError("BUILDING_LEDGER_INVALID_RESPONSE",502,detail);
  }
  const header=data?.response?.header;
  const resultCode=text(header?.resultCode);
  if(resultCode&&resultCode!=="00"){
    const msg=text(header?.resultMsg)||"UNKNOWN";
    console.error("BUILDING_LEDGER_API_ERROR",resultCode,msg,{...loc});
    throw new BuildingLedgerError(`BUILDING_LEDGER_API_${resultCode}`,422,msg);
  }
  const body=data?.response?.body;
  const items=body?.items?.item;
  const list:Array<LedgerItem>=Array.isArray(items)?items:items?[items]:[];
  if(!list.length)throw new BuildingLedgerError("BUILDING_LEDGER_NO_RESULT",404);
  const item=list.find(v=>text(v.mainAtchGbCdNm).includes("주건축물"))||list[0];
  const parkingTotal=Number(item.indrMechUtcnt||0)+Number(item.oudrMechUtcnt||0)+Number(item.indrAutoUtcnt||0)+Number(item.oudrAutoUtcnt||0);
  return {
    raw:item,
    buildingUse:text(item.mainPurpsCdNm),
    approvalDate:text(item.useAprDay),
    totalFloor:text(item.grndFlrCnt),
    undergroundFloor:text(item.ugrndFlrCnt),
    totalArea:text(item.totArea),
    buildingArea:text(item.archArea),
    parkingCount:text(item.totPkngCnt)||String(parkingTotal||""),
    elevatorCount:text(item.rideUseElvtCnt),
  };
}

export async function POST(req:NextRequest){
  if(!supabaseUrl||!serviceRoleKey)return NextResponse.json({ok:false,error:"SERVER_CONFIG"},{status:503});
  const body=await req.json().catch(()=>({}));
  const propertyId=Number(body.property_id); const address=text(body.address);
  if(!Number.isInteger(propertyId)||propertyId<=0||!address)return NextResponse.json({ok:false,error:"INVALID_INPUT"},{status:400});
  try{
    const ledger=await fetchLedger(address);
    const db=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:p,error:findError}=await db.from("properties").select("id,description,area,floor").eq("id",propertyId).single();
    if(findError||!p)return NextResponse.json({ok:false,error:"PROPERTY_NOT_FOUND"},{status:404});
    const meta=parseAdminMeta(p.description||"");
    const next={...meta,infoOverrides:{...meta.infoOverrides}};
    if(!next.infoOverrides.buildingUse&&ledger.buildingUse)next.infoOverrides.buildingUse=ledger.buildingUse;
    if(!next.infoOverrides.approvalDate&&ledger.approvalDate)next.infoOverrides.approvalDate=ledger.approvalDate;
    if(!next.infoOverrides.parking&&ledger.parkingCount)next.infoOverrides.parking=`총 ${ledger.parkingCount}대`;
    if(!next.infoOverrides.elevator&&ledger.elevatorCount)next.infoOverrides.elevator=`${ledger.elevatorCount}대`;
    const update:Record<string,unknown>={description:buildDescriptionWithAdminMeta(p.description||"",next)};
    if(!text(p.area)&&ledger.totalArea)update.area=ledger.totalArea;
    if(!text(p.floor)&&ledger.totalFloor)update.floor=`-/${ledger.totalFloor}층`;
    const {error:updateError}=await db.from("properties").update(update).eq("id",propertyId);
    if(updateError)throw new Error(updateError.message);
    return NextResponse.json({ok:true,property_id:propertyId,ledger:{buildingUse:ledger.buildingUse,approvalDate:ledger.approvalDate,totalFloor:ledger.totalFloor,totalArea:ledger.totalArea,buildingArea:ledger.buildingArea,parkingCount:ledger.parkingCount,elevatorCount:ledger.elevatorCount}});
  }catch(e){
    if(e instanceof BuildingLedgerError){
      return NextResponse.json({ok:false,error:e.message,detail:e.upstream||undefined},{status:e.status>=400&&e.status<600?e.status:422});
    }
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:String(e)},{status:422});
  }
}
