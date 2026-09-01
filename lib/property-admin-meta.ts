export const COMMON_OPTIONS=["CCTV","도어락","신발장","인터폰","싱크대","가스레인지"] as const;
export const VARIABLE_OPTIONS=["에어컨","세탁기","냉장고","TV","장롱","붙박이장","옷장","수납장","인터넷","와이파이","천장형 건조대","건조대","인덕션"] as const;
export const ALL_OPTIONS=[...COMMON_OPTIONS,...VARIABLE_OPTIONS] as const;
export const MAINTENANCE_ITEMS=["수도세","인터넷","유선방송","공동전기세","복도청소비","정화조처리비","기타 공용관리비"] as const;

export const DESCRIPTION_PRESETS=[
 "깔끔하게 관리되어 쾌적하게 거주하기 좋아요.","채광이 좋고 실내가 밝아 답답함이 없어요.","공간 활용이 좋아 1인 거주에 적합하고 실속적이에요.","주방과 생활공간이 분리된 구조예요.","수납공간이 잘 갖춰져 있어 깔끔하게 생활할 수 있어요.","조용한 주거환경으로 편안하게 생활하기 좋아요.","주차 공간이 넉넉해 주차하기 편해요.","버스정류장과 가까워 대중교통 이용이 편리해요.","편의점 등 생활편의시설 이용이 편리한 위치예요.","디지스트 학생 및 직원 거주에 추천해요.","디지스트 통학·출퇴근하기 좋은 위치예요.","대구테크노폴리스 생활권 이용이 편리해요.","즉시 입주 가능해 빠른 입주를 원하는 분께 추천합니다.","가성비 좋은 월세 조건으로 부담 없이 거주하기 좋아요."
] as const;

const ONE_ROOM_PRESETS=[
 "깔끔하게 관리되어 쾌적하게 거주하기 좋아요.","채광이 좋아 실내가 밝고 답답함이 적어요.","1인 거주에 알맞은 실속 있는 원룸 구조예요.","가구 배치가 편리해 공간을 효율적으로 활용하기 좋아요.","수납공간이 잘 갖춰져 있어 깔끔하게 생활하기 좋아요.","주방 공간을 실용적으로 사용할 수 있어요.","창이 있어 환기와 실내 공기 관리가 편리해요.","조용한 주거환경을 원하는 분께 추천해요.","주차 공간을 편리하게 이용할 수 있어요.","버스정류장이 가까워 대중교통 이용이 편리해요.","편의점·마트·음식점 등 생활편의시설 이용이 편리해요.","디지스트 학생·직원 통학 및 출퇴근에 좋은 위치예요.","대구테크노폴리스 생활권 이용이 편리해요.","즉시 입주 가능해 빠른 입주를 원하는 분께 좋아요.","월세 부담을 줄이고 실속 있게 거주하려는 분께 추천해요.","베란다가 있어 세탁과 빨래 건조에 편리해요.","옵션이 잘 갖춰져 있어 이사 부담을 줄이기 좋아요.","혼자 편안하고 독립적으로 생활하기 좋은 공간이에요.","관리 상태가 좋아 바로 생활하기 편리해요.","직장인이나 학생이 생활하기 편리한 실용적인 매물이에요."
] as const;
const MINI_TWO_ROOM_PRESETS=[
 "깔끔하게 관리되어 쾌적하게 거주하기 좋아요.","원룸보다 여유로운 공간을 원하는 분께 추천해요.","침실과 생활공간을 나누어 사용할 수 있어 실용적이에요.","주방과 생활공간이 분리되어 음식 냄새 관리에 편리해요.","혼자 거주하면서 공간을 넉넉하게 사용하기 좋아요.","채광이 좋아 실내가 밝고 쾌적해요.","창이 잘 나 있어 환기하기 편리해요.","수납공간이 잘 갖춰져 있어 정리하기 좋아요.","베란다가 있어 세탁과 빨래 건조에 편리해요.","가구 배치가 편리해 공간 활용도가 좋아요.","주차 공간을 편리하게 이용할 수 있어요.","조용한 주거환경으로 편안하게 생활하기 좋아요.","버스정류장이 가까워 대중교통 이용이 편리해요.","편의점·마트·음식점 등 생활편의시설 이용이 편리해요.","디지스트 학생·직원 통학 및 출퇴근에 좋은 위치예요.","대구테크노폴리스 생활권 이용이 편리해요.","즉시 입주 가능해 빠른 입주를 원하는 분께 좋아요.","옵션이 잘 갖춰져 있어 이사 부담을 줄이기 좋아요.","1인 거주 또는 두 공간을 분리해 쓰고 싶은 분께 적합해요.","실속 있는 월세 조건의 미니투룸을 찾는 분께 추천해요."
] as const;
const TWO_ROOM_PRESETS=[
 "깔끔하게 관리되어 쾌적하게 거주하기 좋아요.","방과 생활공간을 분리해 여유롭게 사용할 수 있어요.","침실과 작업실·드레스룸 등 용도별 공간 활용이 가능해요.","2인 거주나 넉넉한 1인 거주에 적합한 구조예요.","주방과 거실 공간을 편리하게 사용할 수 있어요.","채광이 좋아 실내가 밝고 쾌적해요.","창이 잘 나 있어 환기하기 편리해요.","수납공간이 잘 갖춰져 있어 정리하기 좋아요.","베란다가 있어 세탁과 빨래 건조에 편리해요.","가구 배치가 편리해 공간 활용도가 좋아요.","주차 공간을 편리하게 이용할 수 있어요.","조용한 주거환경으로 편안하게 생활하기 좋아요.","버스정류장이 가까워 대중교통 이용이 편리해요.","편의점·마트·음식점 등 생활편의시설 이용이 편리해요.","디지스트 학생·직원 통학 및 출퇴근에 좋은 위치예요.","대구테크노폴리스 생활권 이용이 편리해요.","즉시 입주 가능해 빠른 입주를 원하는 분께 좋아요.","신혼부부나 두 개의 독립 공간이 필요한 분께 추천해요.","옵션이 잘 갖춰져 있어 이사 부담을 줄이기 좋아요.","넉넉한 공간과 실용성을 함께 원하는 분께 추천해요."
] as const;
const THREE_ROOM_PRESETS=[...TWO_ROOM_PRESETS,"가족 단위 거주에 활용하기 좋은 넉넉한 구조예요.","방이 여러 개라 침실·아이방·서재 등으로 활용하기 좋아요."] as const;
const APARTMENT_OFFICETEL_PRESETS=["관리 상태가 좋아 쾌적하게 거주하기 좋아요.","엘리베이터 이용이 편리한 건물이에요.","주차시설 이용이 편리해 차량을 보유한 분께 좋아요.","공동현관 및 보안시설이 갖춰져 있어 안심하고 생활하기 좋아요.","채광과 조망이 좋아 실내가 밝고 쾌적해요.","편의점·마트 등 생활편의시설 이용이 편리해요.","대중교통 이용이 편리한 위치예요.","즉시 입주 또는 입주시기 협의가 가능한 매물이에요.","대구테크노폴리스 생활권 이용이 편리해요."] as const;
const HOUSE_PRESETS=["독립적인 주거생활을 원하는 분께 추천해요.","실내 공간이 넉넉해 가족 단위 거주에 좋아요.","주차 공간을 편리하게 이용할 수 있어요.","조용한 주거환경에서 여유롭게 생활하기 좋아요.","마당·테라스 등 외부공간 활용을 기대할 수 있는 주택이에요.","전원생활이나 세컨하우스를 찾는 분께 추천해요.","생활공간을 넓게 활용하고 싶은 분께 적합해요.","입주시기와 임대조건은 협의 가능합니다."] as const;

const COMMERCIAL_BASE_PRESETS=[
 "상가를 고를 때 중요한 건 업종과 자리의 궁합이에요. 현장에서 상권과 동선을 함께 살펴드려요.",
 "처음 상가를 알아보시는 분도 업종과 예산을 말씀해 주시면 조건에 맞춰 안내해드려요.",
 "신규 창업은 물론 매장 이전을 계획하시는 분도 비교해보시면 좋은 상가예요.",
 "사무실·서비스업·소매점 등 여러 업종을 열어두고 검토해볼 수 있어요.",
 "매장 규모와 동선을 직접 확인하면서 업종에 맞는 공간인지 살펴보시면 좋아요.",
 "상권의 분위기와 주변 업종을 함께 비교해 영업 방향을 잡아보기 좋은 매물이에요.",
 "보증금과 월세는 물론 계약조건까지 함께 확인해 부담을 줄일 수 있는 방향을 찾아드려요.",
 "임대조건은 업종과 계약기간에 따라 협의 가능한 부분이 있는지 확인해드려요.",
 "비슷한 조건의 주변 상가와 함께 비교해보시면 입지와 임대조건을 판단하기 좋아요.",
 "매장 운영에 필요한 조건을 말씀해 주시면 입지부터 공간 활용까지 함께 확인해드려요.",
 "고객 방문이 중요한 업종이라면 실제 접근 동선과 주변 환경을 현장에서 확인해보시면 좋아요.",
 "단순히 면적만 보지 않고 업종에 필요한 동선과 공간 구성이 가능한지 함께 살펴드려요.",
 "주변 상권과 경쟁업종을 함께 확인하면서 내 업종에 맞는 자리인지 판단해보실 수 있어요.",
 "상가마다 장점이 다른 만큼 업종과 예산에 맞춰 현실적인 조건으로 비교해드려요.",
 "장기적으로 운영할 매장을 찾으신다면 임대조건과 상권을 함께 비교해볼 만한 매물이에요.",
 "창업 준비 단계부터 이전을 고민하는 사업자분까지 편하게 문의하실 수 있어요.",
 "업종에 따라 필요한 시설과 조건이 다른 만큼 현장에서 꼼꼼하게 확인해드려요.",
 "권리금이나 기존 시설 인수 조건이 있는 경우 계약 전 정확하게 확인해드려요.",
 "렌트프리 등 추가 임대조건은 가능한 매물에 한해 임대인과 협의해볼 수 있어요.",
 "추천 업종은 건축물 용도와 인허가 가능 여부를 확인한 뒤 결정하시는 것이 안전해요.",
 "음식점·카페 등 시설이 필요한 업종은 배기·급배수·전력 등 실제 사용 가능 여부를 함께 확인하는 것이 좋아요.",
 "마음에 드는 상가는 사진보다 현장 분위기가 중요해요. 주변 상권까지 함께 보실 수 있도록 안내해드려요."
] as const;

function getFieldValueByLabel(labelText:string){
 if(typeof document==="undefined")return "";
 const label=Array.from(document.querySelectorAll("label")).find(node=>node.textContent?.replace(/\s+/g," ").trim().startsWith(labelText));
 const field=label?.querySelector("input,textarea,select") as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null;
 return field?.value?.trim()||"";
}
function getPageTextValue(selector:string){
 if(typeof document==="undefined")return "";
 const field=document.querySelector(selector) as HTMLInputElement|HTMLTextAreaElement|null;
 return field?.value?.trim()||"";
}
function buildCommercialPresets(){
 const result:string[]=[...COMMERCIAL_BASE_PRESETS];
 if(typeof document==="undefined")return result;
 const floorText=getFieldValueByLabel("층수");
 const title=getFieldValueByLabel("매물명");
 const description=getFieldValueByLabel("매물 설명")||getFieldValueByLabel("매물설명")||getPageTextValue("textarea");
 const context=`${title} ${description}`;
 const floorMatch=floorText.match(/-?\d+/);
 const floor=floorMatch?Number(floorMatch[0]):null;
 if(floor===1){
  result.unshift("1층이라 고객이 편하게 드나들 수 있어 매장 접근성을 중요하게 보는 업종에 잘 맞아요.","1층 상가의 장점을 살려 소매점·카페·음식점·서비스업 등 다양한 업종을 검토해볼 수 있어요.","고객이 매장을 찾고 들어오기 편한 1층 위치라 방문형 업종에 관심 있다면 눈여겨볼 만해요.","1층은 매장 운영에서 활용도가 높은 층수예요. 실제 전면과 출입 동선도 함께 확인해보시면 좋아요.","신규 창업 시 접근성을 중요하게 보신다면 우선 살펴볼 만한 1층 상가예요.");
 }
 else if(typeof floor==="number"&&floor>=2){
  result.unshift(`${floor}층 상가로 예약·상담·교육처럼 목적 방문이 많은 업종을 검토하기 좋아요.`,"상층부 상가는 무조건 유동인구보다 목적 방문 고객을 확보하는 업종과의 궁합을 살펴보는 것이 좋아요.","사무실·뷰티·교육·상담·서비스업처럼 고객이 찾아오는 형태의 업종이라면 검토해볼 만해요.","1층 매장과는 다른 장점이 있는 상층부 상가로 업종 특성과 임대조건을 함께 비교해보시면 좋아요.","노출보다 내부 공간과 임대조건을 중요하게 보는 업종이라면 실속 있게 살펴볼 수 있어요.");
 }
 else if(typeof floor==="number"&&floor<=0){
  result.unshift("지하층은 업종에 따라 장단점이 분명해 출입 동선과 환기·시설 조건을 꼼꼼하게 확인해드려요.","외부 노출보다 목적 방문이 중심인 업종이라면 공간과 임대조건을 함께 비교해볼 만해요.");
 }
 if(/코너|사거리/.test(context))result.unshift("코너·사거리 인접 위치라 여러 방향에서 접근하는 동선을 확인해보기 좋아요.","코너 자리의 장점을 살릴 수 있는지 매장 전면과 간판 노출 위치를 현장에서 함께 확인해보세요.","한쪽 면만 접한 상가보다 시야가 열려 있는 코너 입지는 매장 인지도를 중요하게 보는 업종이 살펴볼 만해요.");
 if(/대로변|도로변|큰길/.test(context))result.unshift("도로변에 자리해 차량 이동 시 매장을 확인하기 좋은 위치예요.","도로에서의 가시성과 진입 동선을 중요하게 보신다면 현장에서 한번 살펴볼 만해요.","도로변 상가는 간판 위치와 차량 접근 동선에 따라 활용도가 달라져 실제 현장에서 함께 확인해드려요.");
 if(/공원/.test(context))result.unshift("공원 인근이라 산책·여가 동선과 어울리는 업종을 함께 검토해볼 수 있어요.","공원을 이용하는 생활 동선과 주변 주거수요를 함께 살펴보기 좋은 위치예요.","카페·디저트·생활서비스처럼 주변 생활 동선과 자연스럽게 연결되는 업종도 검토해볼 만해요.");
 if(/학교|초등|중학교|고등학교|학원/.test(context))result.unshift("학교·학원가 인근으로 학생과 학부모의 생활 동선을 고려한 업종을 검토하기 좋아요.","교육시설 주변 상권은 시간대별 분위기가 다른 만큼 실제 영업시간과 고객층을 함께 고려해보시면 좋아요.","학원·교육·간식·생활서비스 등 주변 수요와 연결되는 업종을 검토해볼 수 있어요.");
 if(/아파트|주거단지|원룸촌|주거밀집/.test(context))result.unshift("주거세대가 있는 상권이라 일상적으로 자주 이용하는 생활밀착형 업종과 잘 맞는지 살펴보기 좋아요.","주변 거주세대를 주요 고객층으로 생각하신다면 생활 동선과 경쟁업종을 함께 확인해보세요.","음식·카페·소매·생활서비스처럼 반복 방문이 기대되는 업종을 검토해볼 만한 주거생활권이에요.");
 if(/오피스|산업단지|공장|직장인/.test(context))result.unshift("주변 직장인과 사업체 수요를 고려해 식음료·서비스·사무 관련 업종을 검토해볼 수 있어요.","평일 직장인 수요가 중요한 업종이라면 출퇴근·점심시간 동선을 현장에서 함께 확인해보시면 좋아요.","사업체가 모여 있는 지역 특성을 활용할 수 있는 사무실·식당·편의서비스 업종도 살펴볼 만해요.");
 if(/주차/.test(context))result.unshift("차량 방문 고객이 많은 업종이라면 실제 주차 가능 대수와 이용 방법을 꼭 함께 확인해보세요.","주차 조건은 업종 선택에 중요한 요소라 현장에서 진입 동선과 실제 이용 여건을 확인해드려요.");
 if(/테크노폴리스/.test(context))result.unshift("대구테크노폴리스 생활권 안에서 주거·직장·상업 수요를 함께 살펴볼 수 있는 상가예요.","테크노폴리스는 위치에 따라 상권 성격이 달라 업종에 맞는 구간인지 주변 점포와 함께 비교해드려요.","테크노폴리스에서 창업이나 이전을 계획하신다면 비슷한 조건의 상가와 함께 비교해보시는 것을 추천드려요.");
 return [...new Set(result)];
}

const COMMERCIAL_PRESETS=new Proxy([] as string[],{
 get(_target,property){const current=buildCommercialPresets();const value=(current as unknown as Record<PropertyKey,unknown>)[property];return typeof value==="function"?(value as Function).bind(current):value;},
 has(_target,property){return property in buildCommercialPresets();},
 ownKeys(){return Reflect.ownKeys(buildCommercialPresets());},
 getOwnPropertyDescriptor(_target,property){return Object.getOwnPropertyDescriptor(buildCommercialPresets(),property)||{configurable:true,enumerable:true,writable:false,value:undefined};}
}) as readonly string[];

const WAREHOUSE_FACTORY_PRESETS=["차량 진입과 물류 이동 동선을 확인하기 좋은 위치예요.","대형차량 진입 가능 여부를 확인해 물류·보관 용도로 검토하기 좋아요.","층고와 출입구 높이를 활용하는 창고·공장 용도로 검토하기 좋아요.","주차 및 야적공간 활용 여부를 확인해 다양한 사업용도로 검토할 수 있어요.","산업단지·IC·주요 도로 접근성을 활용하기 좋은 입지예요.","전력·용도·허가사항을 확인해 제조·보관·물류 업종으로 검토하기 좋아요."] as const;
const LAND_PRESETS=["도로 접면과 진입여건을 확인하기 좋은 토지예요.","토지 형상과 면적 활용도를 검토해 실수요 또는 투자용으로 살펴보기 좋아요.","용도지역과 건축 가능 여부를 확인해 활용계획을 세우기 좋아요.","주변 도로와 생활권 접근성을 함께 검토하기 좋은 위치예요.","주변 개발환경과 인근 토지 이용현황을 함께 확인해볼 만해요.","실수요·투자 목적에 따라 활용 가능성을 검토하기 좋은 토지예요."] as const;
export function getDescriptionPresetsForType(type:string):readonly string[]{if(/상가/.test(type)&&!/상가주택/.test(type))return COMMERCIAL_PRESETS;if(/창고|공장/.test(type))return WAREHOUSE_FACTORY_PRESETS;if(/토지/.test(type))return LAND_PRESETS;if(/아파트|오피스텔/.test(type))return APARTMENT_OFFICETEL_PRESETS;if(/단독주택|다가구|상가주택/.test(type))return HOUSE_PRESETS;if(type==="미니투룸")return MINI_TWO_ROOM_PRESETS;if(type==="투룸")return TWO_ROOM_PRESETS;if(type==="쓰리룸")return THREE_ROOM_PRESETS;if(type==="원룸")return ONE_ROOM_PRESETS;return DESCRIPTION_PRESETS;}
export const ELIGIBLE_RESIDENTIAL=/아파트|원룸|미니투룸|투룸|쓰리룸|단독주택|다가구|다세대|연립|빌라|오피스텔|상가주택/;
export type PropertyInfoOverrides={elevator:string;parking:string;moveIn:string;heating:string;direction:string;buildingUse:string;approvalDate:string;};
export type AdminMeta={options:string[];maintenanceFee:string;maintenanceItems:string[];waterFeeSeparate:boolean;descriptionPresets:string[];ledgerLookupAddress:string;ledgerStatus:""|"completed";ledgerSummary:string;ledgerUpdatedAt:string;infoOverrides:PropertyInfoOverrides;};
const META_RE=/\n?<!--PROPERTY_ADMIN_META:([\s\S]*?)-->/g;const LEGACY_OPTIONS_RE=/\n?<!--PROPERTY_OPTIONS:([\s\S]*?)-->/g;const STRUCTURED_INFO_LINE_RE=/^\s*(?:매물\s*정보|거래조건|금액|주소|관리비(?:\s*항목)?|매물\s*종류|엘리베이터|면적|공급\/전용\s*면적|방|화장실|방\/욕실|층수|주차|총주차대수|입주가능일|입주\s*가능일|난방|방향|건축물\s*용도|사용승인일)\s*(?::|：)?\s*.*$/gm;
export function emptyInfoOverrides():PropertyInfoOverrides{return{elevator:"",parking:"",moveIn:"",heating:"",direction:"",buildingUse:"",approvalDate:""};}
export function emptyAdminMeta():AdminMeta{return{options:[],maintenanceFee:"",maintenanceItems:[],waterFeeSeparate:false,descriptionPresets:[],ledgerLookupAddress:"",ledgerStatus:"",ledgerSummary:"",ledgerUpdatedAt:"",infoOverrides:emptyInfoOverrides()};}
export function stripAdminMeta(description:string){const hasAdminMeta=description.includes("<!--PROPERTY_ADMIN_META:");let clean=description.replace(META_RE,"").replace(LEGACY_OPTIONS_RE,"");if(hasAdminMeta){clean=clean.replace(STRUCTURED_INFO_LINE_RE,"");clean=clean.replace(/\n{3,}/g,"\n\n");}return clean.trimEnd();}
export function parseAdminMeta(description:string):AdminMeta{const meta=emptyAdminMeta();const match=[...description.matchAll(META_RE)].at(-1);if(match){try{const parsed=JSON.parse(decodeURIComponent(match[1]));return{...meta,...parsed,ledgerLookupAddress:String(parsed.ledgerLookupAddress||""),ledgerStatus:parsed.ledgerStatus==="completed"?"completed":"",ledgerSummary:String(parsed.ledgerSummary||""),ledgerUpdatedAt:String(parsed.ledgerUpdatedAt||""),options:Array.isArray(parsed.options)?parsed.options:[],maintenanceItems:Array.isArray(parsed.maintenanceItems)?parsed.maintenanceItems:[],descriptionPresets:Array.isArray(parsed.descriptionPresets)?parsed.descriptionPresets:[],infoOverrides:{...emptyInfoOverrides(),...(parsed.infoOverrides||{})}};}catch{}}const legacy=[...description.matchAll(LEGACY_OPTIONS_RE)].at(-1);if(legacy)meta.options=legacy[1].split("|").map(v=>v.trim()).filter(Boolean);return meta;}
export function buildDescriptionWithAdminMeta(description:string,meta:AdminMeta){const clean=stripAdminMeta(description);const encoded=encodeURIComponent(JSON.stringify(meta));return `${clean}${clean?"\n":""}<!--PROPERTY_ADMIN_META:${encoded}-->`;}
export function inferOptions(description:string,type:string){if(!ELIGIBLE_RESIDENTIAL.test(type))return [];const stored=parseAdminMeta(description).options;if(stored.length)return stored;const result:string[]=[...COMMON_OPTIONS];for(const option of VARIABLE_OPTIONS){const pattern=option==="TV"?/(?:^|[\s·,\/])TV(?:$|[\s·,\/])/i:new RegExp(option.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));if(pattern.test(description))result.push(option);}return [...new Set(result)];}
export function inferMaintenanceFee(description:string){return description.match(/관리비\s*[:：]\s*([^\n]+)/)?.[1]?.trim()||"";}