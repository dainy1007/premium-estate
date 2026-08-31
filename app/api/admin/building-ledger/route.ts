import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

export const runtime="nodejs";
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoKey=process.env.KAKAO_REST_API_KEY;
const buildingKey=process.env.BUILDING_LEDGER_SERVICE_KEY;
type KakaoDoc={address?:{b_code?:string;main_address_no?:string;sub_address_no?:string;mountain_yn?:string}};
type LedgerItem=Record<string,unknown>;
type LocationKey={sigunguCd:string;bjdongCd:string;platGbCd:string;bun:string;ji:string};
type UnitArea={ho:string;exclusive:number;supply:number};
const text=(v:unknown)=>String(v??"").trim();
const round3=(n:number)=>Math.round(n*1000)/1000;
const formatApprovalDate=(v:unknown)=>{const raw=text(v).replace(/\D/g,"");return raw.length===8?`${raw.slice(0,4)}.${raw.slice(4,6)}.${raw.slice(6,8)}`:text(v);};
const norm=(v:unknown)=>{let s=text(v).replace(/\s+/g,"").replace(/(동|호)$/u,"").replace(/[^0-9A-Za-z가-힣]/g,"").toLowerCase();s=s.replace(/^제(?=\d)/u,"");return /^\d+$/.test(s)?String(Number(s)):s;};
const sameUnit=(a:unknown,b:string)=>{const aa=norm(a),bb=norm(b);return Boolean(aa&&bb&&aa===bb);};
const isCollectiveType=(type:string)=>/아파트|오피스텔|집합상가|상가|다세대|연립|빌라/u.test(type);
const isCommercialType=(type:string)=>/상가|사무실/u.test(type);
class BuildingLedgerError extends Error{status:number;upstream:string;constructor(message:string,status=422,upstream=""){super(message);this.status=status;this.upstream=upstream;}}
function normalizedServiceKey(value:string){const raw=value.trim();if(!raw)return raw;try{return raw.includes("%")?decodeURIComponent(raw):raw;}catch{return raw;}}
function parseUnitAddress(address:string){
  const hoMatches=[...address.matchAll(/(?:^|[\s,\/·+&])([A-Za-z0-9가-힣-]+)\s*호(?=$|[\s,\/·+&])/gu)];
  const dongMatches=[...address.matchAll(/(?:^|[\s,])([A-Za-z0-9가-힣-]+)\s*동(?=$|[\s,])/gu)];
  const hos=[...new Set(hoMatches.map(m=>m[1]?.trim()).filter(Boolean) as string[])];
  const dong=dongMatches.at(-1)?.[1]?.trim()||"";
  let baseAddress=address;
  for(const m of [...hoMatches,...dongMatches])if(m[0])baseAddress=baseAddress.replace(m[0]," ");
  baseAddress=baseAddress.replace(/번지/gu,"").replace(/[\/·+&]/g," ").replace(/\s*,\s*/g," ").replace(/\s+/g," ").trim()||address;
  return{baseAddress,dong,ho:hos.at(-1)||"",hos};
}
async function resolveAddress(address:string):Promise<LocationKey>{if(!kakaoKey)throw new BuildingLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED",503);const r=await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,{headers:{Authorization:`KakaoAK ${kakaoKey}`},cache:"no-store"});if(!r.ok)throw new BuildingLedgerError(`KAKAO_ADDRESS_${r.status}`,r.status);const data=await r.json() as {documents?:KakaoDoc[]};const addr=data.documents?.[0]?.address;if(!addr?.b_code)throw new BuildingLedgerError("ADDRESS_NOT_RESOLVED",422);return{sigunguCd:addr.b_code.slice(0,5),bjdongCd:addr.b_code.slice(5,10),platGbCd:addr.mountain_yn==="Y"?"1":"0",bun:(addr.main_address_no||"0").padStart(4,"0"),ji:(addr.sub_address_no||"0").padStart(4,"0")};}
async function fetchHub(endpointName:string,loc:LocationKey,pageNo=1,numOfRows=1000){if(!buildingKey)throw new BuildingLedgerError("BUILDING_LEDGER_SERVICE_KEY_NOT_CONFIGURED",503);const qs=new URLSearchParams({serviceKey:normalizedServiceKey(buildingKey),...loc,numOfRows:String(numOfRows),pageNo:String(pageNo),_type:"json"});const r=await fetch(`https://apis.data.go.kr/1613000/BldRgstHubService/${endpointName}?${qs}`,{cache:"no-store"});const raw=await r.text();if(!r.ok)throw new BuildingLedgerError(`BUILDING_LEDGER_${r.status}`,r.status);let data:any;try{data=JSON.parse(raw);}catch{throw new BuildingLedgerError("BUILDING_LEDGER_INVALID_RESPONSE",502);}const code=text(data?.response?.header?.resultCode);if(code&&code!=="00")throw new BuildingLedgerError(`BUILDING_LEDGER_API_${code}`,422,text(data?.response?.header?.resultMsg));const body=data?.response?.body,items=body?.items?.item;const list:Array<LedgerItem>=Array.isArray(items)?items:items?[items]:[];return{list,totalCount:Number(body?.totalCount||list.length)};}
async function fetchAll(endpoint:string,loc:LocationKey){const size=1000;const first=await fetchHub(endpoint,loc,1,size);const all=[...first.list];const pages=Math.min(30,Math.ceil(first.totalCount/size));for(let p=2;p<=pages;p++){const next=await fetchHub(endpoint,loc,p,size);all.push(...next.list);}return all;}
async function fetchLedger(address:string){const unit=parseUnitAddress(address),loc=await resolveAddress(unit.baseAddress);const{list}=await fetchHub("getBrTitleInfo",loc,1,200);if(!list.length)throw new BuildingLedgerError("BUILDING_LEDGER_NO_RESULT",404);const dongMatch=unit.dong?list.find(v=>sameUnit(v.dongNm,unit.dong)||sameUnit(v.bldNm,unit.dong)||text(v.bldNm).includes(`${unit.dong}동`)):undefined;const item=dongMatch||list.find(v=>text(v.mainAtchGbCdNm).includes("주건축물"))||list[0];const parkingTotal=Number(item.indrMechUtcnt||0)+Number(item.oudrMechUtcnt||0)+Number(item.indrAutoUtcnt||0)+Number(item.oudrAutoUtcnt||0);return{loc,unit,buildingUse:text(item.mainPurpsCdNm),approvalDate:formatApprovalDate(item.useAprDay),totalFloor:text(item.grndFlrCnt),totalArea:text(item.totArea),parkingCount:text(item.totPkngCnt)||String(parkingTotal||""),elevatorCount:text(item.rideUseElvtCnt)};}
function rowsByUnit(list:LedgerItem[],dong:string,ho:string){const byHo=list.filter(v=>sameUnit(v.hoNm,ho));if(!byHo.length)return [];if(!dong)return byHo;const exact=byHo.filter(v=>sameUnit(v.dongNm,dong)||sameUnit(v.bldNm,dong)||text(v.bldNm).includes(`${dong}동`)||text(v.dongNm).includes(`${dong}동`));if(exact.length)return exact;const identities=[...new Set(byHo.map(v=>text(v.mgmBldrgstPk)||`${norm(v.dongNm)}|${norm(v.bldNm)}`).filter(Boolean))];return identities.length===1?byHo:[];}
function sumArea(rows:LedgerItem[]){return rows.reduce((sum,v)=>sum+(Number(v.area)||0),0);}
async function fetchUnitAreas(loc:LocationKey,dong:string,hos:string[]):Promise<UnitArea[]>{
  if(!hos.length)throw new BuildingLedgerError("UNIT_HO_REQUIRED",422,"호수를 입력해야 합니다.");
  const expos=await fetchAll("getBrExposInfo",loc),areas=await fetchAll("getBrExposPubuseAreaInfo",loc),result:UnitArea[]=[];
  for(const ho of hos){
    let unitRows=rowsByUnit(expos,dong,ho);if(!unitRows.length)unitRows=rowsByUnit(areas,dong,ho);
    if(!unitRows.length){const candidates=[...new Set([...expos,...areas].filter(v=>sameUnit(v.hoNm,ho)).map(v=>`${text(v.dongNm)||text(v.bldNm)} ${text(v.hoNm)}`.trim()).filter(Boolean))].slice(0,8);throw new BuildingLedgerError("UNIT_NOT_FOUND",404,candidates.length?`${ho}호 후보: ${candidates.join(", ")}`:`${dong?`${dong}동 `:""}${ho}호 전유부 없음`);}
    const pks=[...new Set(unitRows.map(v=>text(v.mgmBldrgstPk)).filter(Boolean))];
    let matched=pks.length?areas.filter(v=>pks.includes(text(v.mgmBldrgstPk))):[];if(!matched.length)matched=rowsByUnit(areas,dong,ho);
    const exclusiveRows=matched.filter(v=>text(v.exposPubuseGbCdNm).includes("전유")||text(v.exposPubuseGbCd)==="1");
    const publicRows=matched.filter(v=>text(v.exposPubuseGbCdNm).includes("공용")||text(v.exposPubuseGbCd)==="2");
    let exclusive=sumArea(exclusiveRows);
    if(!exclusive){const direct=unitRows.map(v=>Number(v.area)||0).filter(v=>v>0&&v<1000);exclusive=direct.length?Math.min(...direct):0;}
    if(!exclusive||exclusive>=1000)throw new BuildingLedgerError("EXCLUSIVE_AREA_NOT_FOUND",404,`${dong?`${dong}동 `:""}${ho}호 전용면적 없음`);
    const common=sumArea(publicRows);
    result.push({ho,exclusive:round3(exclusive),supply:round3(exclusive+common)});
  }
  return result;
}
const REPAIR:Record<number,{contract:string;exclusive:string}>={64:{contract:"83.27",exclusive:"59.87"},65:{contract:"82.66",exclusive:"59.95"}};
export async function POST(req:NextRequest){
  if(!supabaseUrl||!serviceRoleKey)return NextResponse.json({ok:false,error:"SERVER_CONFIG"},{status:503});
  const body=await req.json().catch(()=>({}));const propertyId=Number(body.property_id),address=text(body.address);if(!Number.isInteger(propertyId)||propertyId<=0||!address)return NextResponse.json({ok:false,error:"INVALID_INPUT"},{status:400});
  try{
    const db=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});const{data:p,error:findError}=await db.from("properties").select("id,type,description,area,contract_area,exclusive_area,floor").eq("id",propertyId).single();if(findError||!p)return NextResponse.json({ok:false,error:"PROPERTY_NOT_FOUND"},{status:404});
    const ledger=await fetchLedger(address),collective=isCollectiveType(text(p.type)),commercial=isCommercialType(text(p.type));let unitAreas:UnitArea[]=[],unitWarning="";
    if(collective){try{unitAreas=await fetchUnitAreas(ledger.loc,ledger.unit.dong,ledger.unit.hos.length?ledger.unit.hos:(ledger.unit.ho?[ledger.unit.ho]:[]));}catch(e){unitWarning=e instanceof BuildingLedgerError?(e.upstream||e.message):(e instanceof Error?e.message:String(e));}}
    const exclusiveTotal=round3(unitAreas.reduce((s,v)=>s+v.exclusive,0));const supplyTotal=round3(unitAreas.reduce((s,v)=>s+v.supply,0));
    const areaLabel=unitAreas.length>1?`${unitAreas.length}개 호실 합산 · 전용 ${exclusiveTotal}㎡${supplyTotal?` · 공급 ${supplyTotal}㎡`:""}`:exclusiveTotal?`전용 ${exclusiveTotal}㎡`:"";
    const meta=parseAdminMeta(p.description||"");const summary=[ledger.buildingUse,ledger.approvalDate,ledger.totalFloor?`지상 ${ledger.totalFloor}층`:"",areaLabel,unitWarning?`전유부 재확인 필요 (${unitWarning})`:""].filter(Boolean).join(" · ");
    const next={...meta,ledgerLookupAddress:address,ledgerStatus:unitWarning?"failed" as const:"completed" as const,ledgerSummary:summary||"보완 완료",ledgerUpdatedAt:new Date().toISOString(),infoOverrides:{...meta.infoOverrides}};if(ledger.buildingUse)next.infoOverrides.buildingUse=ledger.buildingUse;if(ledger.approvalDate)next.infoOverrides.approvalDate=ledger.approvalDate;if(ledger.parkingCount)next.infoOverrides.parking=`총 ${ledger.parkingCount}대`;if(ledger.elevatorCount)next.infoOverrides.elevator=`${ledger.elevatorCount}대`;
    const description=buildDescriptionWithAdminMeta(p.description||"",next);const update:Record<string,unknown>={description};
    if(collective&&exclusiveTotal)update.exclusive_area=String(exclusiveTotal);
    if(commercial&&unitAreas.length&&supplyTotal){update.area=String(supplyTotal);update.contract_area=String(supplyTotal);}
    if(!collective&&!text(p.area)&&ledger.totalArea)update.area=ledger.totalArea;if(!text(p.floor)&&ledger.totalFloor)update.floor=`-/${ledger.totalFloor}층`;
    const repair=REPAIR[propertyId];if(repair){update.area=repair.contract;update.contract_area=repair.contract;if(!exclusiveTotal)update.exclusive_area=repair.exclusive;}
    const{error:updateError}=await db.from("properties").update(update).eq("id",propertyId);if(updateError)throw new Error(updateError.message);
    return NextResponse.json({ok:true,partial:Boolean(unitWarning),warning:unitWarning||undefined,summary,description,ledger:{exclusiveArea:exclusiveTotal?String(exclusiveTotal):"",supplyArea:supplyTotal?String(supplyTotal):"",unitAreas,dong:ledger.unit.dong,hos:ledger.unit.hos}});
  }catch(e){if(e instanceof BuildingLedgerError)return NextResponse.json({ok:false,error:e.message,detail:e.upstream||undefined},{status:e.status});return NextResponse.json({ok:false,error:e instanceof Error?e.message:String(e)},{status:422});}
}
