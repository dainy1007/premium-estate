import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoKey = process.env.KAKAO_REST_API_KEY;
const vworldKey = process.env.VWORLD_API_KEY;
const vworldDomain = process.env.VWORLD_DOMAIN || process.env.NEXT_PUBLIC_SITE_URL || "https://www.baekjohd.com";

type KakaoDoc = { address?: { address_name?: string; b_code?: string; main_address_no?: string; sub_address_no?: string; mountain_yn?: string } };
type ParcelInfo = { pnu:string; address:string; landCategory:string; area:string; registerType:string; ownershipType:string; coOwnerCount:string; scaleName:string; lastUpdated:string };

class LandLedgerError extends Error {
  status:number; detail:string;
  constructor(message:string,status=422,detail=""){super(message);this.status=status;this.detail=detail;}
}

const text=(v:unknown)=>String(v??"").trim();
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
function decodeXml(value:string){return value.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&");}
function tag(xml:string,name:string){const m=xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`,"i"));return m?decodeXml(m[1].trim()):"";}
function safeErrorMessage(error:unknown){return error instanceof Error?(error.message||error.name):String(error||"unknown error");}

async function fetchWithRetry(url:string,init:RequestInit,label:string){
  let lastError:unknown;
  for(let attempt=1;attempt<=2;attempt++){
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(url,{...init,signal:controller.signal});
      if((response.status===429||response.status>=500)&&attempt<2){await response.text().catch(()=>"");await sleep(500*attempt);continue;}
      return response;
    }catch(error){lastError=error;if(attempt<2)await sleep(500*attempt);}
    finally{clearTimeout(timeout);}
  }
  throw new LandLedgerError(`${label}_NETWORK_ERROR`,502,`${label} 외부 API 연결 실패: ${safeErrorMessage(lastError)}`);
}

async function resolveParcel(address:string){
  if(!kakaoKey)throw new LandLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED",503,"카카오 주소 API 키가 없습니다.");
  const response=await fetchWithRetry(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,{headers:{Authorization:`KakaoAK ${kakaoKey}`},cache:"no-store"},"KAKAO_ADDRESS");
  if(!response.ok)throw new LandLedgerError(`KAKAO_ADDRESS_${response.status}`,response.status,"주소를 지번/PNU로 변환하지 못했습니다.");
  const data=await response.json() as {documents?:KakaoDoc[]}; const doc=data.documents?.[0]?.address;
  if(!doc?.b_code||!doc.main_address_no)throw new LandLedgerError("LAND_ADDRESS_NOT_RESOLVED",422,"정확한 지번 주소를 확인해주세요.");
  const main=doc.main_address_no.padStart(4,"0"),sub=(doc.sub_address_no||"0").padStart(4,"0"),mountain=doc.mountain_yn==="Y"?"2":"1";
  return {pnu:`${doc.b_code}${mountain}${main}${sub}`,address:doc.address_name||address};
}

function vworldErrorDetail(raw:string,status:number){
  const msg=tag(raw,"message")||tag(raw,"resultMsg")||tag(raw,"error")||tag(raw,"text");
  if(/INVALID[_ ]?KEY|인증키|key/i.test(raw))return "VWorld 개발키 인증에 실패했습니다. 발급키와 국가중점 API 권한을 확인해주세요.";
  if(/INVALID[_ ]?DOMAIN|domain/i.test(raw))return `VWorld 등록 도메인이 일치하지 않습니다. 등록 URL을 ${vworldDomain} 으로 확인해주세요.`;
  return msg||`VWorld 토지정보 조회 실패 (HTTP ${status})`;
}

async function fetchParcelInfo(address:string):Promise<ParcelInfo>{
  const resolved=await resolveParcel(address);
  if(!vworldKey)throw new LandLedgerError("VWORLD_API_KEY_NOT_CONFIGURED",503,"VWorld 개발키가 서버에 등록되지 않았습니다.");
  const params=new URLSearchParams({format:"xml",key:vworldKey,pnu:resolved.pnu});
  if(vworldDomain)params.set("domain",vworldDomain);
  const url=`https://api.vworld.kr/ned/data/ladfrlList?${params.toString()}`;
  const response=await fetchWithRetry(url,{headers:{Accept:"application/xml,text/xml,*/*","User-Agent":"BaekjoHD-LandLedger/2.0"},cache:"no-store"},"VWORLD_LAND");
  const raw=await response.text();
  if(!response.ok)throw new LandLedgerError(`VWORLD_LAND_${response.status}`,response.status,vworldErrorDetail(raw,response.status));
  if(/INVALID[_ ]?KEY|INVALID[_ ]?DOMAIN|SERVICE_KEY_IS_NOT_REGISTERED_ERROR|ERROR/i.test(raw) && !/<ladfrlVOList>/i.test(raw))throw new LandLedgerError("VWORLD_LAND_AUTH_OR_API_ERROR",422,vworldErrorDetail(raw,response.status));
  const match=raw.match(/<ladfrlVOList>([\s\S]*?)<\/ladfrlVOList>/i);
  if(!match)throw new LandLedgerError("LAND_LEDGER_NO_RESULT",404,vworldErrorDetail(raw,response.status)||"해당 지번의 토지임야정보를 찾지 못했습니다.");
  const block=match[1];
  const parcel={pnu:resolved.pnu,address:tag(block,"ldCodeNm")||resolved.address,landCategory:tag(block,"lndcgrCodeNm")||tag(block,"lndcgrCode"),area:tag(block,"lndpclAr"),registerType:tag(block,"regstrSeCodeNm")||tag(block,"regstrSeCode"),ownershipType:tag(block,"posesnSeCodeNm")||tag(block,"posesnSeCode"),coOwnerCount:tag(block,"cnrsPsnCo"),scaleName:tag(block,"ladFrtlScNm")||tag(block,"ladFrtlSc"),lastUpdated:tag(block,"lastUpdtDt")};
  if(!parcel.landCategory&&!parcel.area)throw new LandLedgerError("LAND_LEDGER_DETAIL_EMPTY",422,"VWorld 응답에 지목/공부면적 상세정보가 없습니다.");
  return parcel;
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
    const summary=`토지대장 확인 완료 · ${detailParts.join(" · ")}`;
    const meta=parseAdminMeta(property.description||"");
    const nextMeta={...meta,ledgerStatus:"completed" as const,ledgerSummary:summary,ledgerUpdatedAt:new Date().toISOString(),ledgerLookupAddress:address};
    const description=buildDescriptionWithAdminMeta(property.description||"",nextMeta); const updates:Record<string,unknown>={description};
    if(!text(property.area)&&areaText)updates.area=areaText;
    const {error:updateError}=await supabase.from("properties").update(updates).eq("id",propertyId);
    if(updateError)throw new LandLedgerError("LAND_LEDGER_APPLY_FAILED",500,updateError.message);
    return NextResponse.json({ok:true,partial:false,summary,warning:"",description,land:parcel,areaApplied:!text(property.area)&&Boolean(areaText)});
  }catch(error){
    const known=error instanceof LandLedgerError?error:new LandLedgerError(error instanceof Error?error.message:String(error),500);
    console.error("[land-ledger]",known.message,known.status,known.detail);
    return NextResponse.json({ok:false,error:known.message,detail:known.detail||"조회 중 오류가 발생했습니다."},{status:known.status});
  }
}
