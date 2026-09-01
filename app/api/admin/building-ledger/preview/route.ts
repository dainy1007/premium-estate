import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const kakaoKey = process.env.KAKAO_REST_API_KEY;
const buildingKey = process.env.BUILDING_LEDGER_SERVICE_KEY;

type KakaoDoc={address?:{b_code?:string;main_address_no?:string;sub_address_no?:string;mountain_yn?:string}};
type LedgerItem=Record<string,unknown>;
type LocationKey={sigunguCd:string;bjdongCd:string;platGbCd:string;bun:string;ji:string};

const text=(value:unknown)=>String(value??"").trim();
const formatApprovalDate=(value:unknown)=>{const raw=text(value).replace(/\D/g,"");return raw.length===8?`${raw.slice(0,4)}.${raw.slice(4,6)}.${raw.slice(6,8)}`:text(value);};
function normalizedServiceKey(value:string){const raw=value.trim();if(!raw)return raw;try{return raw.includes("%")?decodeURIComponent(raw):raw;}catch{return raw;}}
function baseAddress(address:string){return address.replace(/(?:^|[\s,\/·+&])([A-Za-z0-9가-힣-]+)\s*호(?=$|[\s,\/·+&])/gu," ").replace(/(?:^|[\s,])([A-Za-z0-9가-힣-]+)\s*동(?=$|[\s,])/gu," ").replace(/번지/gu,"").replace(/[\/·+&]/g," ").replace(/\s*,\s*/g," ").replace(/\s+/g," ").trim()||address;}

async function resolveAddress(address:string):Promise<LocationKey>{
 if(!kakaoKey)throw new Error("KAKAO_REST_API_KEY_NOT_CONFIGURED");
 const response=await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(baseAddress(address))}`,{headers:{Authorization:`KakaoAK ${kakaoKey}`},cache:"no-store"});
 if(!response.ok)throw new Error(`KAKAO_ADDRESS_${response.status}`);
 const data=await response.json() as {documents?:KakaoDoc[]};
 const addr=data.documents?.[0]?.address;
 if(!addr?.b_code)throw new Error("ADDRESS_NOT_RESOLVED");
 return{sigunguCd:addr.b_code.slice(0,5),bjdongCd:addr.b_code.slice(5,10),platGbCd:addr.mountain_yn==="Y"?"1":"0",bun:(addr.main_address_no||"0").padStart(4,"0"),ji:(addr.sub_address_no||"0").padStart(4,"0")};
}

async function fetchLedger(address:string){
 if(!buildingKey)throw new Error("BUILDING_LEDGER_SERVICE_KEY_NOT_CONFIGURED");
 const loc=await resolveAddress(address);
 const qs=new URLSearchParams({serviceKey:normalizedServiceKey(buildingKey),...loc,numOfRows:"200",pageNo:"1",_type:"json"});
 const response=await fetch(`https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?${qs}`,{cache:"no-store"});
 const raw=await response.text();
 if(!response.ok)throw new Error(`BUILDING_LEDGER_${response.status}`);
 let data:any;
 try{data=JSON.parse(raw);}catch{throw new Error("BUILDING_LEDGER_INVALID_RESPONSE");}
 const code=text(data?.response?.header?.resultCode);
 if(code&&code!=="00")throw new Error(text(data?.response?.header?.resultMsg)||`BUILDING_LEDGER_API_${code}`);
 const items=data?.response?.body?.items?.item;
 const list:LedgerItem[]=Array.isArray(items)?items:items?[items]:[];
 if(!list.length)throw new Error("BUILDING_LEDGER_NO_RESULT");
 const item=list.find(v=>text(v.mainAtchGbCdNm).includes("주건축물"))||list[0];
 const parkingTotal=Number(item.indrMechUtcnt||0)+Number(item.oudrMechUtcnt||0)+Number(item.indrAutoUtcnt||0)+Number(item.oudrAutoUtcnt||0);
 return{
  buildingName:text(item.bldNm),buildingUse:text(item.mainPurpsCdNm),structure:text(item.strctCdNm),approvalDate:formatApprovalDate(item.useAprDay),
  totalFloor:text(item.grndFlrCnt),undergroundFloor:text(item.ugrndFlrCnt),landArea:text(item.platArea),floorArea:text(item.archArea),totalArea:text(item.totArea),
  coverageRatio:text(item.bcRat),floorAreaRatio:text(item.vlRat),parkingCount:text(item.totPkngCnt)||String(parkingTotal||""),elevatorCount:text(item.rideUseElvtCnt),
  householdCount:text(item.hhldCnt),unitCount:text(item.hoCnt)||text(item.fmlyCnt),roadAddress:text(item.newPlatPlc),jibunAddress:text(item.platPlc)
 };
}

export async function POST(req:NextRequest){
 const body=await req.json().catch(()=>({}));
 const address=text(body.address);
 if(!address)return NextResponse.json({ok:false,error:"주소를 입력해주세요."},{status:400});
 try{
  const ledger=await fetchLedger(address);
  const summary=[ledger.buildingUse,ledger.approvalDate,ledger.totalFloor?`지상 ${ledger.totalFloor}층`:"",ledger.parkingCount?`주차 ${ledger.parkingCount}대`:""].filter(Boolean).join(" · ");
  return NextResponse.json({ok:true,summary,ledger});
 }catch(error){
  const message=error instanceof Error?error.message:String(error);
  return NextResponse.json({ok:false,error:message},{status:422});
 }
}
