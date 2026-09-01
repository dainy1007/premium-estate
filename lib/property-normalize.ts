import type { Property } from "@/types/property";

function clean(value: unknown) { return String(value ?? "").replace(/\s+/g, " ").trim(); }

export function sanitizePropertyArea(value: unknown) {
  return clean(value).replace(/(\d+(?:\.\d+)?)F㎡/g, "$1㎡").replace(/전용\s*(\d+(?:\.\d+)?)F\b/g, "전용 $1㎡").replace(/전용(\d+(?:\.\d+)?)㎡/g, "전용 $1㎡");
}
function withSquareMeter(value: unknown) { const text=sanitizePropertyArea(value); if(!text)return ""; if(/㎡|평/.test(text))return text; if(/^[\d,.]+$/.test(text))return `${text}㎡`; return text; }
function buildDisplayArea(property: Property) { const contract=withSquareMeter(property.contract_area),exclusive=withSquareMeter(property.exclusive_area); if(contract&&exclusive)return `계약 ${contract} / 전용 ${exclusive}`; if(contract)return `계약 ${contract}`; if(exclusive)return `전용 ${exclusive}`; return withSquareMeter(property.area); }

export function deriveLocationFromAddress(value: unknown) {
  const address=clean(value); if(!address)return "";
  const parts=address.split(" ").filter(Boolean);
  if(parts.includes("달성군")&&!parts.some(part=>/^대구(?:광역)?시$/.test(part)))parts.unshift("대구시");
  if(parts.includes("창녕군")&&!parts.some(part=>/^(?:경남|경상남도)$/.test(part)))parts.unshift("경남");
  const townIndex=parts.findIndex(part=>/(?:읍|면|동)$/.test(part));
  const limit=townIndex>=0?townIndex+1:parts.length;
  return parts.slice(0,limit).filter(part=>/(?:특별시|광역시|특별자치시|도|시|군|구|읍|면|동)$/.test(part)||/^(?:경남|경북|전남|전북|충남|충북)$/.test(part)).join(" ");
}
const CANONICAL_TYPES=["아파트","원룸","미니투룸","투룸","쓰리룸","단독주택","다가구","상가주택","상가","오피스텔","창고","공장","토지"] as const;
function canonicalExplicitType(value: unknown) { const explicitType=clean(value); if(!explicitType)return ""; if(/상가\s*주택|상가주택/i.test(explicitType))return "상가주택"; if(/단독\s*주택|단독주택/i.test(explicitType))return "단독주택"; if(/미니\s*투룸|미니투룸/i.test(explicitType))return "미니투룸"; return CANONICAL_TYPES.find(type=>explicitType===type||explicitType.includes(type))||""; }
export function detectPropertyDisplayType(input:{type?:string|null;title?:string|null;address?:string|null;location?:string|null;description?:string|null;}) {
  const title=clean(input.title),address=clean(input.address),location=clean(input.location),description=clean(input.description),text=[address,location,title,description].join(" "); const explicitType=canonicalExplicitType(input.type); if(explicitType)return explicitType; if(/상가\s*주택|상가주택/i.test(title))return "상가주택"; if(/단독\s*주택|단독주택/i.test(title))return "단독주택"; if(/다가구/i.test(title))return "다가구"; if(/쓰리룸/i.test(title))return "쓰리룸"; if(/미니투룸/i.test(title))return "미니투룸"; if(/투룸/i.test(title))return "투룸"; if(/원룸/i.test(title))return "원룸"; if(/현풍읍.*중리\s*462-4|중리\s*462-4/i.test(text))return "상가주택"; if(/남해\s*오네뜨|남해오네뜨|대구테크노폴리스남해오네뜨1차/i.test(text))return "아파트"; if(/하나리움\s*퀸즈\s*파크|하나리움퀸즈파크|하나리움퀸즈/i.test(text))return "아파트"; if(/아파트/i.test(title))return "아파트"; if(/중리\s*505-2|테크노대로\s*73|줌시티/i.test(text))return "오피스텔"; if(/오피스텔/i.test(title))return "오피스텔"; if(/창고/i.test(title))return "창고"; if(/공장/i.test(title))return "공장"; if(/토지/i.test(title))return "토지"; if(/상가/i.test(title))return "상가"; return clean(input.type)||"매물";
}
function addSmallHomeConvenience(description:string,type:string,context:string){if(!/^(원룸|미니투룸|투룸)$/.test(type)||!description)return description;const items:string[]=[];if(/디지스트|DGIST/i.test(context))items.push("디지스트 학생·직원과 인근 직장인이 생활하기 편리한 위치입니다.");if(/유가읍|현풍읍|테크노폴리스|디지스트|DGIST/i.test(context))items.push("편의점·마트·음식점 등 주변 생활편의시설과 상권을 이용하기 좋습니다.");else items.push("주변 생활편의시설과 상권을 이용하기 좋은 주거 입지입니다.");const unique=items.filter(item=>!description.includes(item));if(!unique.length)return description;const bullets=unique.map(item=>`• ${item}`).join("\n");if(/매물 특징/.test(description))return description.replace(/매물 특징\s*/,`매물 특징\n${bullets}\n`);return `${description}\n\n매물 특징\n${bullets}`;}
function normalizeDescriptionGeography(description:unknown,address:unknown,type:string,dealType:unknown){let text=String(description??"").replace(/\r\n/g,"\n").trim().replace(/(\d+(?:\.\d+)?)F㎡/g,"$1㎡").replace(/전용\s*(\d+(?:\.\d+)?)F\b/g,"전용 $1㎡");const geographicLocation=deriveLocationFromAddress(address);if(!text||!geographicLocation)return text;const deal=clean(dealType),correctOpening=deal?`${geographicLocation}에 위치한 ${type} ${deal} 매물입니다.`:`${geographicLocation}에 위치한 ${type} 매물입니다.`;if(/^[^\n.]{1,50}에 위치한 [^\n.]{1,30} 매물입니다\./.test(text))text=text.replace(/^[^\n.]{1,50}에 위치한 [^\n.]{1,30} 매물입니다\./,correctOpening);else if(/^[^\n.]{1,30}에 위치한 매물 [^\n.]{1,20} 매물입니다\./.test(text))text=text.replace(/^[^\n.]{1,30}에 위치한 매물 [^\n.]{1,20} 매물입니다\./,correctOpening);return text;}
export function normalizePropertyForDisplay<T extends Property>(property:T):T {
  const type=detectPropertyDisplayType(property);
  // DB title is authoritative: manual admin edits must survive refresh.
  const title=clean(property.title);
  const geographicLocation=deriveLocationFromAddress(property.address),rawDescription=String(property.description??""),isAdminEdited=rawDescription.includes("<!--PROPERTY_ADMIN_META:");
  const normalizedDescription=isAdminEdited?rawDescription:normalizeDescriptionGeography(rawDescription,property.address,type,property.deal_type);
  const description=isAdminEdited?normalizedDescription:addSmallHomeConvenience(normalizedDescription,type,[property.title,property.address,property.location,property.description].filter(Boolean).join(" "));
  return {...property,type,title,location:geographicLocation||property.location,area:buildDisplayArea(property),contract_area:sanitizePropertyArea(property.contract_area),exclusive_area:sanitizePropertyArea(property.exclusive_area),description};
}
