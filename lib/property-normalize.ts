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

export function detectPropertyDisplayType(input: {
  type?: string | null;
  title?: string | null;
  address?: string | null;
  location?: string | null;
  description?: string | null;
}) {
  const text = [input.address, input.location, input.title, input.description]
    .map(clean)
    .join(" ");
  const explicitType = clean(input.type);

  // 아파트 단지명/주소 우선 판정.
  // 방 3개라는 이유로 '쓰리룸'으로 분류되는 것을 방지한다.
  if (/남해\s*오네뜨|남해오네뜨|대구테크노폴리스남해오네뜨1차/i.test(text)) return "아파트";
  if (/하나리움\s*퀸즈\s*파크|하나리움퀸즈파크|하나리움퀸즈/i.test(text)) return "아파트";
  if (/유가읍.*봉리\s*601|봉리\s*601/i.test(text)) return "아파트";
  if (/현풍읍.*중리\s*480|중리\s*480/i.test(text)) return "아파트";
  if (/아파트/i.test(explicitType) || /아파트/i.test(text)) return "아파트";

  // 대구테크노폴리스 줌시티: 현풍읍 중리 505-2 / 테크노대로 73
  // 주거형 원룸 표현이 포함되어도 건축물 유형은 오피스텔로 표시한다.
  if (/중리\s*505-2|테크노대로\s*73|줌시티/i.test(text)) return "오피스텔";
  if (/오피스텔/i.test(explicitType) || /오피스텔/i.test(text)) return "오피스텔";

  // 현풍읍 중리 462-4는 상가주택 매매 매물이다.
  if (/현풍읍.*중리\s*462-4|중리\s*462-4/i.test(text)) return "상가주택";
  if (/상가\s*주택|상가주택/i.test(explicitType) || /상가\s*주택|상가주택/i.test(text)) return "상가주택";

  return explicitType || "매물";
}

function normalizeTitleByType(title: string, type: string) {
  const rawTitle = clean(title);
  if (!rawTitle) return rawTitle;

  if (type === "오피스텔") return rawTitle.replace(/원룸/g, "오피스텔");
  if (type === "상가주택") return rawTitle.replace(/상가(?!주택)|토지|원룸|투룸|미니투룸/g, "상가주택");
  if (type === "아파트") {
    const corrected = rawTitle.replace(/미니투룸|쓰리룸|투룸|원룸|상가주택|상가|창고|공장|토지|오피스텔|다가구|단독주택/g, "아파트");
    if (/남해\s*오네뜨|남해오네뜨/i.test(rawTitle) && !corrected.includes("아파트")) {
      return `${corrected} 아파트`;
    }
    if (/하나리움\s*퀸즈\s*파크|하나리움퀸즈파크|하나리움퀸즈/i.test(rawTitle) && !corrected.includes("아파트")) {
      return `${corrected} 아파트`;
    }
    return corrected;
  }

  const replaceableTypes = /미니투룸|쓰리룸|투룸|원룸|상가주택|상가|창고|공장|토지|오피스텔|아파트|다가구|단독주택/;
  if (replaceableTypes.test(rawTitle) && !rawTitle.includes(type)) {
    return rawTitle.replace(replaceableTypes, type);
  }

  return rawTitle;
}

export function normalizePropertyForDisplay<T extends Property>(property: T): T {
  const type = detectPropertyDisplayType(property);
  const title = normalizeTitleByType(property.title, type);

  return {
    ...property,
    type,
    title,
    area: sanitizePropertyArea(property.area),
    contract_area: sanitizePropertyArea(property.contract_area),
    exclusive_area: sanitizePropertyArea(property.exclusive_area),
    description: clean(property.description)
      .replace(/(\d+(?:\.\d+)?)F㎡/g, "$1㎡")
      .replace(/전용\s*(\d+(?:\.\d+)?)F\b/g, "전용 $1㎡"),
  };
}
