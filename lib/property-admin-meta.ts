export const COMMON_OPTIONS=["CCTV","도어락","신발장","인터폰","싱크대","가스레인지"] as const;
export const VARIABLE_OPTIONS=["에어컨","세탁기","냉장고","TV","장롱","붙박이장","옷장","수납장","인터넷","와이파이","천장형 건조대","건조대","인덕션"] as const;
export const ALL_OPTIONS=[...COMMON_OPTIONS,...VARIABLE_OPTIONS] as const;
export const MAINTENANCE_ITEMS=["수도세","인터넷","유선방송","공동전기세","복도청소비","정화조처리비","기타 공용관리비"] as const;
export const DESCRIPTION_PRESETS=[
  "깔끔하게 관리된 매물입니다.",
  "조용한 주거환경을 선호하시는 분께 추천드립니다.",
  "주차가 편리한 위치입니다.",
  "대중교통 이용이 편리합니다.",
  "편의점·마트 등 생활편의시설 이용이 편리합니다.",
  "디지스트 학생·직원에게 추천드립니다.",
  "인근 직장인이 생활하기 편리한 위치입니다.",
  "생활권 이용이 편리한 위치입니다.",
  "채광이 좋은 매물입니다.",
  "통풍과 환기가 좋은 구조입니다.",
  "수납공간을 활용하기 좋습니다.",
  "베란다·세탁공간 활용이 편리합니다.",
  "즉시입주 가능합니다.",
  "직장인·학생 룸쉐어로도 활용 가능합니다.",
] as const;
export const ELIGIBLE_RESIDENTIAL=/원룸|미니투룸|투룸|쓰리룸|다가구|다세대|연립|빌라|상가주택/;

type AdminMeta={
  options:string[];
  maintenanceFee:string;
  maintenanceItems:string[];
  waterFeeSeparate:boolean;
  descriptionPresets:string[];
};

const META_RE=/\n?<!--PROPERTY_ADMIN_META:([\s\S]*?)-->/g;
const LEGACY_OPTIONS_RE=/\n?<!--PROPERTY_OPTIONS:([\s\S]*?)-->/g;

export function emptyAdminMeta():AdminMeta{return{options:[],maintenanceFee:"",maintenanceItems:[],waterFeeSeparate:false,descriptionPresets:[]};}
export function stripAdminMeta(description:string){return description.replace(META_RE,"").replace(LEGACY_OPTIONS_RE,"").trimEnd();}
export function parseAdminMeta(description:string):AdminMeta{
  const meta=emptyAdminMeta();
  const match=[...description.matchAll(META_RE)].at(-1);
  if(match){try{const parsed=JSON.parse(decodeURIComponent(match[1]));return{...meta,...parsed,options:Array.isArray(parsed.options)?parsed.options:[],maintenanceItems:Array.isArray(parsed.maintenanceItems)?parsed.maintenanceItems:[],descriptionPresets:Array.isArray(parsed.descriptionPresets)?parsed.descriptionPresets:[]};}catch{/* fall through */}}
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
  const stored=parseAdminMeta(description).options;if(stored.length)return stored;
  const result:string[]=[];if(ELIGIBLE_RESIDENTIAL.test(type))result.push(...COMMON_OPTIONS);
  for(const option of VARIABLE_OPTIONS){const pattern=option==="TV"?/(?:^|[\s·,\/])TV(?:$|[\s·,\/])/i:new RegExp(option.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));if(pattern.test(description))result.push(option);}
  return [...new Set(result)];
}
export function inferMaintenanceFee(description:string){return description.match(/관리비\s*[:：]\s*([^\n]+)/)?.[1]?.trim()||"";}
