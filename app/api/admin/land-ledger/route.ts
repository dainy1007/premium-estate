import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoKey = process.env.KAKAO_REST_API_KEY;
const vworldKey = process.env.VWORLD_API_KEY || process.env.BUILDING_LEDGER_SERVICE_KEY;
const vworldDomain = process.env.VWORLD_DOMAIN || process.env.NEXT_PUBLIC_SITE_URL || "";

type KakaoDoc = { address?: { address_name?: string; b_code?: string; main_address_no?: string; sub_address_no?: string; mountain_yn?: string } };
type ParcelInfo = { pnu:string; address:string; landCategory:string; area:string; registerType:string; ownershipType:string; coOwnerCount:string; scaleName:string; lastUpdated:string; partial?:boolean; warning?:string };

class LandLedgerError extends Error {
  status:number; detail:string;
  constructor(message:string,status=422,detail=""){super(message);this.status=status;this.detail=detail;}
}

const text=(v:unknown)=>String(v??"").trim();
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
function decodeXml(value:string){return value.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&");}
function tag(xml:string,name:string){const m=xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`,"i"));return m?decodeXml(m[1].trim()):"";}
function safeErrorMessage(error:unknown){return error instanceof Error?(error.message||error.name):String(error||"unknown error");}
function friendlyVworldDetail(status:number){return [429,500,502,503,504].includes(status)?"VWorld 토지정보 서버가 일시적으로 응답하지 않습니다. 주소/PNU 확인까지만 완료했습니다.":`VWorld 토지정보 조회에 실패했습니다. (HTTP ${status})`;}
function isTemporaryVworldError(error:unknown){return error instanceof LandLedgerError && (/^VWORLD_LAND_(?:NETWORK_ERROR|429|500|502|503|504)$/.test(error.message)||[429,500,502,503,504].includes(error.status));}

async function fetchWithRetry(url:string,init:RequestInit,label:string){
  let lastError:unknown;
  for(let attempt=1;attempt<=2;attempt++){
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),7000);
    try{
      const response=await fetch(url,{...init,signal:controller.signal});
      if((response.status===429||response.status>=500)&&attempt<2){await response.text().catch(()=>"");await sleep(350*attempt);continue;}
      return response;
    }catch(error){lastError=error;if(attempt<2)await sleep(350*attempt);}
    finally{clearTimeout(timeout);}
  }
  throw new LandLedgerError(`${label}_NETWORK_ERROR`,502,`${label} 외부 API 연결 실패: ${safeErrorMessage(lastError)}`);
}

async function resolveParcel(address:string){
  if(!kakaoKey)throw new LandLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED",503);
  const response=await fetchWithRetry(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,{headers:{Authorization:`KakaoAK ${kakaoKey}`},cache:"no-store"},"KAKAO_ADDRESS");
  if(!response.ok)throw new LandLedgerError(`KAKAO_ADDRESS_${response.status}`,response.status);
  const data=await response.json() as {documents?:KakaoDoc[]}; const doc=data.documents?.[0]?.address;
  if(!doc?.b_code||!doc.main_address_no)throw new LandLedgerError("LAND_ADDRESS_NOT_RESOLVED",422,"지번 주소를 확인해주세요.");
  const main=doc.main_address_no.padStart(4,"0"),sub=(doc.sub_address_no||"0").padStart(4,"0"),mountain=doc.mountain_yn==="Y"?"2":"1";
  return {pnu:`${doc.b_code}${mountain}${main}${sub}`,address:doc.address_name||address};
}

async function requestVworld(pnu:string){
  const base=new URLSearchParams({format:"xml",key:vworldKey||"",pnu});
  const urls:string[]=[];
  if(vworldDomain){const q=new URLSearchParams(base);q.set("domain",vworldDomain);urls.push(`https://api.vworld.kr/ned/data/ladfrlList?${q.toString()}`);}
  urls.push(`https://api.vworld.kr/ned/data/ladfrlList?${base.toString()}`);
  let lastError:unknown;
  for(const url of urls){
    try{
      const response=await fetchWithRetry(url,{headers:{Accept:"application/xml,text/xml,*/*","User-Agent":"BaekjoHD-LandLedger/1.2"},cache:"no-store"},"VWORLD_LAND");
      const raw=await response.text();
      if(response.ok)return {response,raw};
      if(![429,500,502,503,504].includes(response.status))return {response,raw};
      lastError=new LandLedgerError(`VWORLD_LAND_${response.status}`,response.status,friendlyVworldDetail(response.status));
    }catch(error){lastError=error;}
  }
  if(lastError instanceof LandLedgerError)throw lastError;
  throw new LandLedgerError("VWORLD_LAND_NETWORK_ERROR",502,friendlyVworldDetail(502));
}

async function fetchParcelInfo(address:string):Promise<ParcelInfo>{
  const resolved=await resolveParcel(address);
  if(!vworldKey)return {pnu:resolved.pnu,address:resolved.address,landCategory:"",area:"",registerType:"",ownershipType:"",coOwnerCount:"",scaleName:"",lastUpdated:"",partial:true,warning:"VWorld 인증키가 없어 주소/PNU만 확인했습니다."};
  try{
    const {response,raw}=await requestVworld(resolved.pnu);
    if(!response.ok)throw new LandLedgerError(`VWORLD_LAND_${response.status}`,response.status,friendlyVworldDetail(response.status));
    if(/INVALID_KEY|INVALID DOMAIN|SERVICE_KEY_IS_NOT_REGISTERED_ERROR/i.test(raw))throw new LandLedgerError("VWORLD_API_KEY_INVALID",503,"VWorld 인증키 또는 등록 도메인을 확인해주세요.");
    const error=tag(raw,"error")||tag(raw,"resultMsg"); const match=raw.match(/<ladfrlVOList>([\s\S]*?)<\/ladfrlVOList>/i);
    if(!match)throw new LandLedgerError("LAND_LEDGER_NO_RESULT",404,error||"해당 지번의 토지임야정보를 찾지 못했습니다.");
    const block=match[1];
    return {pnu:resolved.pnu,address:tag(block,"ldCodeNm")||resolved.address,landCategory:tag(block,"lndcgrCodeNm")||tag(block,"lndcgrCode"),area:tag(block,"lndpclAr"),registerType:tag(block,"regstrSeCodeNm")||tag(block,"regstrSeCode"),ownershipType:tag(block,"posesnSeCodeNm")||tag(block,"posesnSeCode"),coOwnerCount:tag(block,"cnrsPsnCo"),scaleName:tag(block,"ladFrtlScNm")||tag(block,"ladFrtlSc"),lastUpdated:tag(block,"lastUpdtDt")};
  }catch(error){
    if(isTemporaryVworldError(error))return {pnu:resolved.pnu,address:resolved.address,landCategory:"",area:"",registerType:"",ownershipType:"",coOwnerCount:"",scaleName:"",lastUpdated:"",partial:true,warning:"VWorld 일시 장애로 주소/PNU 확인까지만 완료했습니다. 상세 토지정보는 나중에 재조회하세요."};
    throw error;
  }
}

export async function POST(request:NextRequest){
  try{
    if(!supabaseUrl||!serviceRoleKey)return NextResponse.json({ok:false,error:"SUPABASE_SERVER_NOT_CONFIGURED",detail:"서버 설정을 확인해주세요."},{status:503});
    const body=await request.json().catch(()=>({})); const propertyId=Number(body?.property_id),address=text(body?.address);
    if(!propertyId||!address)return NextResponse.json({ok:false,error:"PROPERTY_ID_AND_ADDRESS_REQUIRED",detail:"매물과 조회주소를 확인해주세요."},{status:400});
    const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false}});
    const {data:property,error:propertyError}=await supabase.from("properties").select("id,type,address,location,area,description").eq("id",propertyId).single();
    if(propertyError||!property)return NextResponse.json({ok:false,error:"PROPERTY_NOT_FOUND",detail:"매물을 찾지 못했습니다."},{status:404});
    if(!/토지/u.test(text(property.type)))return NextResponse.json({ok:false,error:"NOT_LAND_PROPERTY",detail:"토지 매물만 토지대장을 조회합니다."},{status:422});

    const parcel=await fetchParcelInfo(address),areaText=parcel.area?`${parcel.area}㎡`:"";
    const detailParts=[parcel.landCategory?`지목 ${parcel.landCategory}`:"",areaText?`공부면적 ${areaText}`:"",parcel.ownershipType?`소유구분 ${parcel.ownershipType}`:"",`PNU ${parcel.pnu}`].filter(Boolean);
    const summary=parcel.partial?`토지 주소 확인 완료 · ${detailParts.join(" · ")} · 상세정보 재조회 필요`:`토지대장 확인 완료 · ${detailParts.join(" · ")}`;
    const meta=parseAdminMeta(property.description||"");
    const nextMeta={...meta,ledgerStatus:"completed" as const,ledgerSummary:summary,ledgerUpdatedAt:new Date().toISOString(),ledgerLookupAddress:address};
    const description=buildDescriptionWithAdminMeta(property.description||"",nextMeta); const updates:Record<string,unknown>={description};
    if(!parcel.partial&&!text(property.area)&&areaText)updates.area=areaText;
    const {error:updateError}=await supabase.from("properties").update(updates).eq("id",propertyId);
    if(updateError)throw new LandLedgerError("LAND_LEDGER_APPLY_FAILED",500,updateError.message);
    return NextResponse.json({ok:true,partial:Boolean(parcel.partial),summary,warning:parcel.warning||"",description,land:parcel,areaApplied:!parcel.partial&&!text(property.area)&&Boolean(areaText)});
  }catch(error){
    const known=error instanceof LandLedgerError?error:new LandLedgerError(error instanceof Error?error.message:String(error),500);
    const detail=/<html|<body|<h1/i.test(known.detail)?friendlyVworldDetail(known.status):known.detail;
    return NextResponse.json({ok:false,error:known.message,detail:detail||"조회 중 오류가 발생했습니다."},{status:known.status});
  }
}
