export const COMMON_OPTIONS=["CCTV","도어락","신발장","인터폰","싱크대","가스레인지"] as const;
export const VARIABLE_OPTIONS=["에어컨","세탁기","냉장고","TV","장롱","붙박이장","옷장","수납장","인터넷","와이파이","천장형 건조대","건조대","인덕션"] as const;
export const ALL_OPTIONS=[...COMMON_OPTIONS,...VARIABLE_OPTIONS] as const;
export const MAINTENANCE_ITEMS=["수도세","인터넷","유선방송","공동전기세","복도청소비","정화조처리비","기타 공용관리비"] as const;
export const DESCRIPTION_PRESETS=[
  "깔끔하게 관리되어 쾌적하게 거주하기 좋아요.",
  "채광이 좋고 실내가 밝아 답답함이 없어요.",
  "공간 활용이 좋아 1인 거주에 적합하고 실속적이에요.",
  "주방과 생활공간이 분리된 구조예요.",
  "수납공간이 잘 갖춰져 있어 깔끔하게 생활할 수 있어요.",
  "조용한 주거환경으로 편안하게 생활하기 좋아요.",
  "주차 공간이 넉넉해 주차하기 편해요.",
  "버스정류장과 가까워 대중교통 이용이 편리해요.",
  "편의점 등 생활편의시설 이용이 편리한 위치예요.",
  "디지스트 학생 및 직원 거주에 추천해요.",
  "디지스트 통학·출퇴근하기 좋은 위치예요.",
  "대구테크노폴리스 생활권 이용이 편리해요.",
  "즉시 입주 가능해 빠른 입주를 원하는 분께 추천합니다.",
  "가성비 좋은 월세 조건으로 부담 없이 거주하기 좋아요.",
] as const;
export const ELIGIBLE_RESIDENTIAL=/아파트|원룸|미니투룸|투룸|쓰리룸|단독주택|다가구|다세대|연립|빌라|오피스텔|상가주택/;

export type PropertyInfoOverrides={
  elevator:string;
  parking:string;
  moveIn:string;
  heating:string;
  direction:string;
  buildingUse:string;
  approvalDate:string;
};

export type AdminMeta={
  options:string[];
  maintenanceFee:string;
  maintenanceItems:string[];
  waterFeeSeparate:boolean;
  descriptionPresets:string[];
  ledgerLookupAddress:string;
  ledgerStatus:""|"completed";
  ledgerSummary:string;
  ledgerUpdatedAt:string;
  infoOverrides:PropertyInfoOverrides;
};

const META_RE=/\n?<!--PROPERTY_ADMIN_META:([\s\S]*?)-->/g;
const LEGACY_OPTIONS_RE=/\n?<!--PROPERTY_OPTIONS:([\s\S]*?)-->/g;
const STRUCTURED_INFO_LINE_RE=/^\s*(?:매물\s*정보|거래조건|금액|주소|관리비(?:\s*항목)?|매물\s*종류|엘리베이터|면적|공급\/전용\s*면적|방|화장실|방\/욕실|층수|주차|총주차대수|입주가능일|입주\s*가능일|난방|방향|건축물\s*용도|사용승인일)\s*(?::|：)?\s*.*$/gm;

export function emptyInfoOverrides():PropertyInfoOverrides{return{elevator:"",parking:"",moveIn:"",heating:"",direction:"",buildingUse:"",approvalDate:""};}
export function emptyAdminMeta():AdminMeta{return{options:[],maintenanceFee:"",maintenanceItems:[],waterFeeSeparate:false,descriptionPresets:[],ledgerLookupAddress:"",ledgerStatus:"",ledgerSummary:"",ledgerUpdatedAt:"",infoOverrides:emptyInfoOverrides()};}

export function stripAdminMeta(description:string){
  const hasAdminMeta=description.includes("<!--PROPERTY_ADMIN_META:");
  let clean=description.replace(META_RE,"").replace(LEGACY_OPTIONS_RE,"");
  if(hasAdminMeta){
    clean=clean.replace(STRUCTURED_INFO_LINE_RE,"");
    clean=clean.replace(/\n{3,}/g,"\n\n");
  }
  return clean.trimEnd();
}

export function parseAdminMeta(description:string):AdminMeta{
  const meta=emptyAdminMeta();
  const match=[...description.matchAll(META_RE)].at(-1);
  if(match){try{const parsed=JSON.parse(decodeURIComponent(match[1]));return{...meta,...parsed,ledgerLookupAddress:String(parsed.ledgerLookupAddress||""),ledgerStatus:parsed.ledgerStatus==="completed"?"completed":"",ledgerSummary:String(parsed.ledgerSummary||""),ledgerUpdatedAt:String(parsed.ledgerUpdatedAt||""),options:Array.isArray(parsed.options)?parsed.options:[],maintenanceItems:Array.isArray(parsed.maintenanceItems)?parsed.maintenanceItems:[],descriptionPresets:Array.isArray(parsed.descriptionPresets)?parsed.descriptionPresets:[],infoOverrides:{...emptyInfoOverrides(),...(parsed.infoOverrides||{})}};}catch{/* fall through */}}
  const legacy=[...description.matchAll(LEGACY_OPTIONS_RE)].at(-1);
  if(legacy)meta.options=legacy[1].split("|").map(v=>v.trim()).filter(Boolean);
  return meta;
}
export function buildDescriptionWithAdminMeta(description:string,meta:AdminMeta){
  const clean=stripAdminMeta(description);
  const encoded=encodeURIComponent(JSON.stringify(meta));
  return `${clean}${clean?"\n":""}<!--PROPERTY_ADMIN_META:${encoded}-->`;
}
export function inferOptions(description:string,type:string){
  if(!ELIGIBLE_RESIDENTIAL.test(type))return [];
  const stored=parseAdminMeta(description).options;if(stored.length)return stored;
  const result:string[]=[...COMMON_OPTIONS];
  for(const option of VARIABLE_OPTIONS){const pattern=option==="TV"?/(?:^|[\s·,\/])TV(?:$|[\s·,\/])/i:new RegExp(option.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));if(pattern.test(description))result.push(option);}
  return [...new Set(result)];
}
export function inferMaintenanceFee(description:string){return description.match(/관리비\s*[:：]\s*([^\n]+)/)?.[1]?.trim()||"";}
