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
  const title = clean(input.title);
  const address = clean(input.address);
  const location = clean(input.location);
  const description = clean(input.description);
  const text = [address, location, title, description].join(" ");
  const explicitType = clean(input.type);

  // 건축물 유형이 명확한 주택 계열은 일반 본문 키워드보다 우선한다.
  // 설명에 '아파트 인근' 같은 문구가 있어도 주택을 아파트로 오분류하지 않는다.
  if (/상가\s*주택|상가주택/i.test(explicitType) || /상가\s*주택|상가주택/i.test(title)) return "상가주택";
  if (/단독\s*주택|단독주택/i.test(explicitType) || /단독\s*주택|단독주택/i.test(title)) return "단독주택";
  if (/다가구/i.test(explicitType) || /다가구/i.test(title)) return "다가구";
  if (/쓰리룸/i.test(explicitType) || /쓰리룸/i.test(title)) return "쓰리룸";
  if (/미니투룸/i.test(explicitType) || /미니투룸/i.test(title)) return "미니투룸";
  if (/투룸/i.test(explicitType) || /투룸/i.test(title)) return "투룸";
  if (/원룸/i.test(explicitType) || /원룸/i.test(title)) return "원룸";

  // 현풍읍 중리 462-4는 상가주택 매매 매물이다.
  if (/현풍읍.*중리\s*462-4|중리\s*462-4/i.test(text)) return "상가주택";

  // 아파트는 실제 단지명/명시적 유형/제목을 기준으로만 판정한다.
  // description의 '아파트 인근' 등 일반 문구만으로는 아파트로 바꾸지 않는다.
  if (/남해\s*오네뜨|남해오네뜨|대구테크노폴리스남해오네뜨1차/i.test(text)) return "아파트";
  if (/하나리움\s*퀸즈\s*파크|하나리움퀸즈파크|하나리움퀸즈/i.test(text)) return "아파트";
  if (/아파트/i.test(explicitType) || /아파트/i.test(title)) return "아파트";

  // 대구테크노폴리스 줌시티: 현풍읍 중리 505-2 / 테크노대로 73
  if (/중리\s*505-2|테크노대로\s*73|줌시티/i.test(text)) return "오피스텔";
  if (/오피스텔/i.test(explicitType) || /오피스텔/i.test(title)) return "오피스텔";

  if (/상가/i.test(explicitType) || /상가/i.test(title)) return "상가";
  if (/창고/i.test(explicitType) || /창고/i.test(title)) return "창고";
  if (/공장/i.test(explicitType) || /공장/i.test(title)) return "공장";
  if (/토지/i.test(explicitType) || /토지/i.test(title)) return "토지";

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
