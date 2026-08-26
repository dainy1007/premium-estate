export const COMMON_OPTIONS=["CCTV","도어락","신발장","인터폰","싱크대","가스레인지"] as const;
export const VARIABLE_OPTIONS=["에어컨","세탁기","냉장고","TV","장롱","붙박이장","옷장","수납장","인터넷","와이파이","천장형 건조대","건조대","인덕션"] as const;
export const ALL_OPTIONS=[...COMMON_OPTIONS,...VARIABLE_OPTIONS] as const;
export const MAINTENANCE_ITEMS=["수도세","인터넷","유선방송","공동전기세","복도청소비","정화조처리비","기타 공용관리비"] as const;
export const DESCRIPTION_PRESETS=[
  "현풍에 지금 나와 있는 깔끔한 원룸입니다.",
  "유가읍에 위치한 깔끔한 원룸입니다.",
  "디지스트 인근으로 학생·직원분께 추천드립니다.",
  "조용한 주거지역에 위치해 생활하기 좋습니다.",
  "1층이 주차장으로 되어 있어 주차가 편리합니다.",
  "주차공간이 넉넉해 차량 이용이 편리합니다.",
  "1층 주차장과 인근 주차공간을 이용하기 편리합니다.",
  "편의점·마트를 도보로 이용하기 편리한 위치입니다.",
  "편의점·마트가 가까워 생활하기 편리합니다.",
  "음식점 등 주변 생활편의시설과 상권을 이용하기 좋습니다.",
  "버스정류장이 가까워 대중교통 이용이 편리합니다.",
  "풀옵션으로 편리하게 생활할 수 있는 원룸입니다.",
  "침대가 갖춰져 있어 별도 침대 준비 부담이 적습니다.",
  "전자레인지가 갖춰져 있어 간단한 조리가 편리합니다.",
  "햇빛이 잘 들어오고 밝은 분위기의 원룸입니다.",
  "넓은 창이 있어 채광과 환기가 좋습니다.",
  "주방공간이 넓어 편리하게 사용할 수 있습니다.",
  "수납공간이 마련되어 있어 생활용품과 의류 정리가 편리합니다.",
  "세탁공간과 빨래 건조에 활용할 수 있는 건조대가 있습니다.",
  "보증금·월세 조건은 협의 가능합니다.",
  "즉시 입주 가능한 매물입니다.",
  "원룸보다 공간 활용이 좋은 미니투룸 구조입니다.",
  "침실과 생활공간을 분리해서 사용할 수 있는 투룸입니다.",
  "직장인·학생 룸쉐어로 활용하기 좋은 구조입니다.",
  "탁 트인 공원 뷰가 돋보이는 통유리 상가입니다.",
  "남향으로 채광이 좋은 상가입니다.",
  "오픈형 화이트 톤 천장으로 깔끔한 분위기입니다.",
  "기존 운동시설로 운영되어 내부가 깔끔하게 관리되어 있습니다.",
  "보증금·월차임·무상임대 조건은 협의 가능합니다.",
  "엘리베이터와 가까워 접근성이 좋습니다.",
  "현풍 중앙공원 맞은편에 위치해 가시성과 접근성이 좋습니다.",
] as const;
export const ELIGIBLE_RESIDENTIAL=/원룸|미니투룸|투룸|쓰리룸|다가구|다세대|연립|빌라|상가주택/;

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
  infoOverrides:PropertyInfoOverrides;
};

const META_RE=/\n?<!--PROPERTY_ADMIN_META:([\s\S]*?)-->/g;
const LEGACY_OPTIONS_RE=/\n?<!--PROPERTY_OPTIONS:([\s\S]*?)-->/g;
const STRUCTURED_INFO_LINE_RE=/^\s*(?:매물\s*정보|거래조건|금액|주소|관리비(?:\s*항목)?|매물\s*종류|엘리베이터|면적|공급\/전용\s*면적|방|화장실|방\/욕실|층수|주차|총주차대수|입주가능일|입주\s*가능일|난방|방향|건축물\s*용도|사용승인일)\s*(?::|：)?\s*.*$/gm;

export function emptyInfoOverrides():PropertyInfoOverrides{return{elevator:"",parking:"",moveIn:"",heating:"",direction:"",buildingUse:"",approvalDate:""};}
export function emptyAdminMeta():AdminMeta{return{options:[],maintenanceFee:"",maintenanceItems:[],waterFeeSeparate:false,descriptionPresets:[],infoOverrides:emptyInfoOverrides()};}

export function stripAdminMeta(description:string){
  const hasAdminMeta=description.includes("<!--PROPERTY_ADMIN_META:");
  let clean=description.replace(META_RE,"").replace(LEGACY_OPTIONS_RE,"");
  // 관리자에서 한 번이라도 저장한 매물은 관리자 입력값을 단일 기준으로 사용한다.
  // 과거 설명 안에 남아 있던 '주차 : ...', '관리비 : ...' 같은 구조화 정보가
  // 상세페이지 필드를 다시 덮어쓰지 않도록 표시용 설명에서 제거한다.
  if(hasAdminMeta){
    clean=clean.replace(STRUCTURED_INFO_LINE_RE,"");
    clean=clean.replace(/\n{3,}/g,"\n\n");
  }
  return clean.trimEnd();
}

export function parseAdminMeta(description:string):AdminMeta{
  const meta=emptyAdminMeta();
  const match=[...description.matchAll(META_RE)].at(-1);
  if(match){try{const parsed=JSON.parse(decodeURIComponent(match[1]));return{...meta,...parsed,options:Array.isArray(parsed.options)?parsed.options:[],maintenanceItems:Array.isArray(parsed.maintenanceItems)?parsed.maintenanceItems:[],descriptionPresets:Array.isArray(parsed.descriptionPresets)?parsed.descriptionPresets:[],infoOverrides:{...emptyInfoOverrides(),...(parsed.infoOverrides||{})}};}catch{/* fall through */}}
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
