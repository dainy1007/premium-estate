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
type LocationKey={sigunguCd:string;bjdongCd:string;platGbCd:string;bun:string;ji:string};

const text=(v:unknown)=>String(v??"").trim();
const formatApprovalDate=(v:unknown)=>{const raw=text(v).replace(/\D/g,"");if(raw.length!==8)return text(v);return `${raw.slice(0,4)}.${raw.slice(4,6)}.${raw.slice(6,8)}`;};
const normalizeUnit=(v:unknown)=>text(v).replace(/\s+/g,"").replace(/(동|호)$/u,"").toLowerCase();
const normalizeUnitLoose=(v:unknown)=>{
  const raw=normalizeUnit(v).replace(/[^0-9a-z가-힣]/giu,"");
  if(/^\d+$/.test(raw))return String(Number(raw));
  return raw;
};
const isCollectiveType=(type:string)=>/아파트|오피스텔|집합상가|상가|다세대|연립|빌라/u.test(type);

class BuildingLedgerError extends Error {
  status:number; upstream:string;
  constructor(message:string,status=422,upstream=""){super(message);this.name="BuildingLedgerError";this.status=status;this.upstream=upstream;}
}

function normalizedServiceKey(value:string){const raw=value.trim();if(!raw)return raw;try{return raw.includes("%")?decodeURIComponent(raw):raw;}catch{return raw;}}
function upstreamMessage(raw:string){return raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,700);}

function parseUnitAddress(address:string){
  const hoMatch=address.match(/(?:^|[\s,])([A-Za-z0-9가-힣-]+)\s*호(?=$|[\s,])/u);
  const dongMatch=address.match(/(?:^|[\s,])([A-Za-z0-9가-힣-]+)\s*동(?=$|[\s,])/u);
  const ho=hoMatch?.[1]?.trim()||"",dong=dongMatch?.[1]?.trim()||"";
  let baseAddress=address;
  if(hoMatch?.[0])baseAddress=baseAddress.replace(hoMatch[0]," ");
  if(dongMatch?.[0])baseAddress=baseAddress.replace(dongMatch[0]," ");
  baseAddress=baseAddress.replace(/\s*,\s*/g," ").replace(/\s+/g," ").trim();
  return {baseAddress:baseAddress||address,dong,ho};
}

async function resolveAddress(address:string):Promise<LocationKey>{
  if(!kakaoKey)throw new BuildingLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED",503);
  const r=await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,{headers:{Authorization:`KakaoAK ${kakaoKey}`},cache:"no-store"});
  if(!r.ok)throw new BuildingLedgerError(`KAKAO_ADDRESS_${r.status}`,r.status);
  const data=await r.json() as {documents?:KakaoDoc[]};const addr=data.documents?.[0]?.address;
  if(!addr?.b_code)throw new BuildingLedgerError("ADDRESS_NOT_RESOLVED",422);
  return {sigunguCd:addr.b_code.slice(0,5),bjdongCd:addr.b_code.slice(5,10),platGbCd:addr.mountain_yn==="Y"?"1":"0",bun:(addr.main_address_no||"0").padStart(4,"0"),ji:(addr.sub_address_no||"0").padStart(4,"0")};
}

async function fetchHub(endpointName:string,loc:LocationKey,pageNo=1,numOfRows=1000){
  if(!buildingKey)throw new BuildingLedgerError("BUILDING_LEDGER_SERVICE_KEY_NOT_CONFIGURED",503);
  const qs=new URLSearchParams({serviceKey:normalizedServiceKey(buildingKey),...loc,numOfRows:String(numOfRows),pageNo:String(pageNo),_type:"json"});
  const endpoint=`https://apis.data.go.kr/1613000/BldRgstHubService/${endpointName}?${qs.toString()}`;
  const r=await fetch(endpoint,{cache:"no-store"});const raw=await r.text();
  if(!r.ok)throw new BuildingLedgerError(`BUILDING_LEDGER_${r.status}`,r.status,upstreamMessage(raw)||r.statusText||"NO_RESPONSE_BODY");
  let data:any;try{data=JSON.parse(raw);}catch{throw new BuildingLedgerError("BUILDING_LEDGER_INVALID_RESPONSE",502,upstreamMessage(raw)||"NON_JSON_RESPONSE");}
  const resultCode=text(data?.response?.header?.resultCode);
  if(resultCode&&resultCode!=="00")throw new BuildingLedgerError(`BUILDING_LEDGER_API_${resultCode}`,422,text(data?.response?.header?.resultMsg)||"UNKNOWN");
  const body=data?.response?.body,items=body?.items?.item;const list:Array<LedgerItem>=Array.isArray(items)?items:items?[items]:[];
  return {list,totalCount:Number(body?.totalCount||list.length)};
}
async function fetchAllHubItems(endpointName:string,loc:LocationKey){const pageSize=1000;const first=await fetchHub(endpointName,loc,1,pageSize);const all=[...first.list];const pages=Math.min(20,Math.ceil(first.totalCount/pageSize));for(let page=2;page<=pages;page++){const next=await fetchHub(endpointName,loc,page,pageSize);all.push(...next.list);}return all;}

async function fetchLedger(address:string){
  const unit=parseUnitAddress(address),loc=await resolveAddress(unit.baseAddress);const {list}=await fetchHub("getBrTitleInfo",loc,1,50);
  if(!list.length)throw new BuildingLedgerError("BUILDING_LEDGER_NO_RESULT",404);
  const item=list.find(v=>text(v.mainAtchGbCdNm).includes("주건축물"))||list[0];
  const parkingTotal=Number(item.indrMechUtcnt||0)+Number(item.oudrMechUtcnt||0)+Number(item.indrAutoUtcnt||0)+Number(item.oudrAutoUtcnt||0);
  return {raw:item,loc,unit,buildingUse:text(item.mainPurpsCdNm),approvalDate:formatApprovalDate(item.useAprDay),totalFloor:text(item.grndFlrCnt),undergroundFloor:text(item.ugrndFlrCnt),totalArea:text(item.totArea),buildingArea:text(item.archArea),parkingCount:text(item.totPkngCnt)||String(parkingTotal||""),elevatorCount:text(item.rideUseElvtCnt)};
}

function sameUnit(a:unknown,b:string){const aa=normalizeUnitLoose(a),bb=normalizeUnitLoose(b);return Boolean(aa&&bb&&(aa===bb||aa.endsWith(bb)||bb.endsWith(aa)));}
function pickUnitRows(list:LedgerItem[],dong:string,ho:string){
  const hoRows=list.filter(v=>sameUnit(v.hoNm,ho));
  if(!hoRows.length)return [];
  if(!dong)return hoRows;
  const exactDong=hoRows.filter(v=>sameUnit(v.dongNm,dong));
  if(exactDong.length)return exactDong;
  const buildingNameMatch=hoRows.filter(v=>sameUnit(v.bldNm,dong)||text(v.bldNm).includes(`${dong}동`)||text(v.dongNm).includes(dong));
  if(buildingNameMatch.length)return buildingNameMatch;
  const dongGroups=[...new Set(hoRows.map(v=>normalizeUnitLoose(v.dongNm)||normalizeUnitLoose(v.bldNm)).filter(Boolean))];
  if(dongGroups.length===1)return hoRows;
  return [];
}

async function fetchExclusiveUnitArea(loc:LocationKey,dong:string,ho:string){
  if(!ho)throw new BuildingLedgerError("UNIT_HO_REQUIRED",422,"집합건축물은 조회주소에 호수를 입력해야 합니다.");
  const list=await fetchAllHubItems("getBrExposPubuseAreaInfo",loc);
  if(!list.length)throw new BuildingLedgerError("UNIT_AREA_NO_RESULT",404,"전유공용면적 조회 결과가 없습니다.");
  const matches=pickUnitRows(list,dong,ho);
  if(!matches.length)throw new BuildingLedgerError("UNIT_NOT_FOUND",404,`${dong?`${dong}동 `:""}${ho}호 전유부를 찾지 못했습니다.`);
  const exclusive=matches.filter(v=>text(v.exposPubuseGbCdNm).includes("전유")||text(v.exposPubuseGbCd)==="1");
  if(!exclusive.length)throw new BuildingLedgerError("EXCLUSIVE_AREA_NOT_FOUND",404,`${dong?`${dong}동 `:""}${ho}호 전용면적을 찾지 못했습니다.`);
  const groupKey=(v:LedgerItem)=>text(v.mgmBldrgstPk)||text(v.mgmUpperBldrgstPk)||"default";
  const grouped=new Map<string,LedgerItem[]>();for(const row of exclusive){const k=groupKey(row);grouped.set(k,[...(grouped.get(k)||[]),row]);}
  const areas=[...grouped.values()].map(rows=>rows.reduce((sum,v)=>sum+(Number(v.area)||0),0)).filter(v=>v>0);
  if(!areas.length)throw new BuildingLedgerError("EXCLUSIVE_AREA_INVALID",422,"전용면적 값이 비어 있습니다.");
  const area=Math.min(...areas);
  return String(Math.round(area*1000)/1000);
}

export async function POST(req:NextRequest){
  if(!supabaseUrl||!serviceRoleKey)return NextResponse.json({ok:false,error:"SERVER_CONFIG"},{status:503});
  const body=await req.json().catch(()=>({}));const propertyId=Number(body.property_id),address=text(body.address);
  if(!Number.isInteger(propertyId)||propertyId<=0||!address)return NextResponse.json({ok:false,error:"INVALID_INPUT"},{status:400});
  try{
    const db=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:p,error:findError}=await db.from("properties").select("id,type,description,area,exclusive_area,floor").eq("id",propertyId).single();
    if(findError||!p)return NextResponse.json({ok:false,error:"PROPERTY_NOT_FOUND"},{status:404});
    const ledger=await fetchLedger(address),collective=isCollectiveType(text(p.type));let exclusiveArea="",unitWarning="";
    if(collective){try{exclusiveArea=await fetchExclusiveUnitArea(ledger.loc,ledger.unit.dong,ledger.unit.ho);}catch(e){unitWarning=e instanceof Error?e.message:String(e);console.warn("BUILDING_LEDGER_UNIT_AREA_PARTIAL_FAILURE",{propertyId,address,unitWarning});}}
    const meta=parseAdminMeta(p.description||"");
    const summary=[ledger.buildingUse,ledger.approvalDate,ledger.totalFloor?`지상 ${ledger.totalFloor}층`:"",ledger.parkingCount?`주차 ${ledger.parkingCount}대`:"",exclusiveArea?`전용 ${exclusiveArea}㎡`:"",unitWarning?"전용면적 기존 정보 유지":""].filter(Boolean).join(" · ");
    const next={...meta,ledgerLookupAddress:address,ledgerStatus:"completed" as const,ledgerSummary:summary||"보완 완료",ledgerUpdatedAt:new Date().toISOString(),infoOverrides:{...meta.infoOverrides}};
    if(ledger.buildingUse)next.infoOverrides.buildingUse=ledger.buildingUse;if(ledger.approvalDate)next.infoOverrides.approvalDate=ledger.approvalDate;if(ledger.parkingCount)next.infoOverrides.parking=`총 ${ledger.parkingCount}대`;if(ledger.elevatorCount)next.infoOverrides.elevator=`${ledger.elevatorCount}대`;
    const description=buildDescriptionWithAdminMeta(p.description||"",next);const update:Record<string,unknown>={description};
    // 집합건축물은 기존 공급/표시면적을 건드리지 않는다. 전유부 조회 성공 시 exclusive_area만 검증·보완한다.
    if(collective&&exclusiveArea)update.exclusive_area=exclusiveArea;
    if(!collective&&!text(p.area)&&ledger.totalArea)update.area=ledger.totalArea;
    if(!text(p.floor)&&ledger.totalFloor)update.floor=`-/${ledger.totalFloor}층`;
    const {error:updateError}=await db.from("properties").update(update).eq("id",propertyId);if(updateError)throw new Error(updateError.message);
    return NextResponse.json({ok:true,partial:Boolean(unitWarning),warning:unitWarning||undefined,property_id:propertyId,summary:next.ledgerSummary,description,ledger:{buildingUse:ledger.buildingUse,approvalDate:ledger.approvalDate,totalFloor:ledger.totalFloor,totalArea:ledger.totalArea,buildingArea:ledger.buildingArea,parkingCount:ledger.parkingCount,elevatorCount:ledger.elevatorCount,exclusiveArea,dong:ledger.unit.dong,ho:ledger.unit.ho}});
  }catch(e){if(e instanceof BuildingLedgerError)return NextResponse.json({ok:false,error:e.message,detail:e.upstream||undefined},{status:e.status>=400&&e.status<600?e.status:422});return NextResponse.json({ok:false,error:e instanceof Error?e.message:String(e)},{status:422});}
}
