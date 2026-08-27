import type { Property } from "@/types/property";

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function sanitizePropertyArea(value: unknown) {
  return clean(value)
    .replace(/(\d+(?:\.\d+)?)F㎡/g, "$1㎡")
    .replace(/전용\s*(\d+(?:\.\d+)?)F\b/g, "전용 $1㎡")
    .replace(/전용(\d+(?:\.\d+)?)㎡/g, "전용 $1㎡");
}

function withSquareMeter(value: unknown) {
  const text = sanitizePropertyArea(value);
  if (!text) return "";
  if (/㎡|평/.test(text)) return text;
  if (/^[\d,.]+$/.test(text)) return `${text}㎡`;
  return text;
}

function buildDisplayArea(property: Property) {
  const contract = withSquareMeter(property.contract_area);
  const exclusive = withSquareMeter(property.exclusive_area);
  if (contract && exclusive) return `계약 ${contract} / 전용 ${exclusive}`;
  if (contract) return `계약 ${contract}`;
  if (exclusive) return `전용 ${exclusive}`;
  return withSquareMeter(property.area);
}

export function deriveLocationFromAddress(value: unknown) {
  const address = clean(value);
  if (!address) return "";
  const parts = address.split(" ").filter(Boolean);
  const province = parts.find((part) => /(?:특별시|광역시|특별자치시|도)$/.test(part)) || "";
  const cityCounty = parts.find((part) => /(?:시|군|구)$/.test(part) && part !== province) || "";
  const town = parts.find((part) => /(?:읍|면|동)$/.test(part)) || "";
  return [province, cityCounty, town].filter(Boolean).join(" ");
}

function deriveTitleLocationFromAddress(value: unknown) {
  const full = deriveLocationFromAddress(value);
  if (!full) return "";
  const parts = full.split(" ").filter(Boolean);
  return parts.slice(-2).join(" ") || full;
}

const CANONICAL_TYPES = ["아파트","원룸","미니투룸","투룸","쓰리룸","단독주택","다가구","상가주택","상가","오피스텔","창고","공장","토지"] as const;

function canonicalExplicitType(value: unknown) {
  const explicitType = clean(value);
  if (!explicitType) return "";
  if (/상가\s*주택|상가주택/i.test(explicitType)) return "상가주택";
  if (/단독\s*주택|단독주택/i.test(explicitType)) return "단독주택";
  if (/미니\s*투룸|미니투룸/i.test(explicitType)) return "미니투룸";
  return CANONICAL_TYPES.find((type) => explicitType === type || explicitType.includes(type)) || "";
}

export function detectPropertyDisplayType(input: {type?: string | null;title?: string | null;address?: string | null;location?: string | null;description?: string | null;}) {
  const title = clean(input.title), address = clean(input.address), location = clean(input.location), description = clean(input.description);
  const text = [address, location, title, description].join(" ");
  const explicitType = canonicalExplicitType(input.type);
  if (explicitType) return explicitType;
  if (/상가\s*주택|상가주택/i.test(title)) return "상가주택";
  if (/단독\s*주택|단독주택/i.test(title)) return "단독주택";
  if (/다가구/i.test(title)) return "다가구";
  if (/쓰리룸/i.test(title)) return "쓰리룸";
  if (/미니투룸/i.test(title)) return "미니투룸";
  if (/투룸/i.test(title)) return "투룸";
  if (/원룸/i.test(title)) return "원룸";
  if (/현풍읍.*중리\s*462-4|중리\s*462-4/i.test(text)) return "상가주택";
  if (/남해\s*오네뜨|남해오네뜨|대구테크노폴리스남해오네뜨1차/i.test(text)) return "아파트";
  if (/하나리움\s*퀸즈\s*파크|하나리움퀸즈파크|하나리움퀸즈/i.test(text)) return "아파트";
  if (/아파트/i.test(title)) return "아파트";
  if (/중리\s*505-2|테크노대로\s*73|줌시티/i.test(text)) return "오피스텔";
  if (/오피스텔/i.test(title)) return "오피스텔";
  if (/창고/i.test(title)) return "창고";
  if (/공장/i.test(title)) return "공장";
  if (/토지/i.test(title)) return "토지";
  if (/상가/i.test(title)) return "상가";
  return clean(input.type) || "매물";
}

function normalizeTitleByType(title: string, type: string) {
  const rawTitle = clean(title);
  if (!rawTitle) return rawTitle;
  if (type === "오피스텔") return rawTitle.replace(/원룸/g, "오피스텔");
  if (type === "상가주택") return rawTitle.replace(/상가(?!주택)|토지|원룸|투룸|미니투룸/g, "상가주택");
  if (type === "아파트") {
    const corrected = rawTitle.replace(/미니투룸|쓰리룸|투룸|원룸|상가주택|상가|창고|공장|토지|오피스텔|다가구|단독주택/g, "아파트");
    if (/남해\s*오네뜨|남해오네뜨/i.test(rawTitle) && !corrected.includes("아파트")) return `${corrected} 아파트`;
    if (/하나리움\s*퀸즈\s*파크|하나리움퀸즈파크|하나리움퀸즈/i.test(rawTitle) && !corrected.includes("아파트")) return `${corrected} 아파트`;
    return corrected;
  }
  const replaceableTypes = /미니투룸|쓰리룸|투룸|원룸|상가주택|상가|창고|공장|토지|오피스텔|아파트|다가구|단독주택/;
  if (replaceableTypes.test(rawTitle) && !rawTitle.includes(type)) return rawTitle.replace(replaceableTypes, type);
  return rawTitle;
}

function normalizeTitleGeography(title: string, address: unknown) {
  const rawTitle = clean(title), correctLocation = deriveTitleLocationFromAddress(address);
  if (!rawTitle || !correctLocation) return rawTitle;
  const withoutWrongPrefix = rawTitle.replace(/^(?:대구(?:광역시|시)?\s*)?달성군\s*/i, "").replace(/^(?:경상남도\s*)?남해군\s*(?:이동면\s*)?/i, "").replace(/^(?:유가읍|현풍읍|구지면|이동면)\s*/i, "");
  if (rawTitle.startsWith(correctLocation)) return rawTitle;
  return `${correctLocation} ${withoutWrongPrefix}`.replace(/\s+/g, " ").trim();
}

function addSmallHomeConvenience(description: string, type: string, context: string) {
  if (!/^(원룸|미니투룸|투룸)$/.test(type) || !description) return description;
  const items: string[] = [];
  if (/디지스트|DGIST/i.test(context)) items.push("디지스트 학생·직원과 인근 직장인이 생활하기 편리한 위치입니다.");
  if (/유가읍|현풍읍|테크노폴리스|디지스트|DGIST/i.test(context)) items.push("편의점·마트·음식점 등 주변 생활편의시설과 상권을 이용하기 좋습니다.");
  else items.push("주변 생활편의시설과 상권을 이용하기 좋은 주거 입지입니다.");
  const unique = items.filter((item) => !description.includes(item));
  if (!unique.length) return description;
  const bullets = unique.map((item) => `• ${item}`).join("\n");
  if (/매물 특징/.test(description)) return description.replace(/매물 특징\s*/, `매물 특징\n${bullets}\n`);
  return `${description}\n\n매물 특징\n${bullets}`;
}

function normalizeDescriptionGeography(description: unknown, address: unknown, type: string, dealType: unknown) {
  let text = String(description ?? "").replace(/\r\n/g, "\n").trim().replace(/(\d+(?:\.\d+)?)F㎡/g, "$1㎡").replace(/전용\s*(\d+(?:\.\d+)?)F\b/g, "전용 $1㎡");
  const geographicLocation = deriveLocationFromAddress(address);
  if (!text || !geographicLocation) return text;
  const deal = clean(dealType);
  const correctOpening = deal ? `${geographicLocation}에 위치한 ${type} ${deal} 매물입니다.` : `${geographicLocation}에 위치한 ${type} 매물입니다.`;
  if (/^[^\n.]{1,50}에 위치한 [^\n.]{1,30} 매물입니다\./.test(text)) text = text.replace(/^[^\n.]{1,50}에 위치한 [^\n.]{1,30} 매물입니다\./, correctOpening);
  else if (/^[^\n.]{1,30}에 위치한 매물 [^\n.]{1,20} 매물입니다\./.test(text)) text = text.replace(/^[^\n.]{1,30}에 위치한 매물 [^\n.]{1,20} 매물입니다\./, correctOpening);
  return text;
}

export function normalizePropertyForDisplay<T extends Property>(property: T): T {
  const type = detectPropertyDisplayType(property);
  const typedTitle = normalizeTitleByType(property.title, type);
  const title = normalizeTitleGeography(typedTitle, property.address);
  const geographicLocation = deriveLocationFromAddress(property.address);
  const rawDescription = String(property.description ?? "");
  const isAdminEdited = rawDescription.includes("<!--PROPERTY_ADMIN_META:");
  const normalizedDescription = isAdminEdited ? rawDescription : normalizeDescriptionGeography(rawDescription, property.address, type, property.deal_type);
  const description = isAdminEdited ? normalizedDescription : addSmallHomeConvenience(normalizedDescription, type, [property.title, property.address, property.location, property.description].filter(Boolean).join(" "));
  return {...property,type,title,location: geographicLocation || property.location,area:buildDisplayArea(property),contract_area:sanitizePropertyArea(property.contract_area),exclusive_area:sanitizePropertyArea(property.exclusive_area),description};
}
