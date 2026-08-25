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

  // 대구테크노폴리스 줌시티: 현풍읍 중리 505-2 / 테크노대로 73
  // 주거형 원룸 표현이 포함되어도 건축물 유형은 오피스텔로 표시한다.
  if (/중리\s*505-2|테크노대로\s*73|줌시티/i.test(text)) return "오피스텔";
  if (/오피스텔/i.test(explicitType) || /오피스텔/i.test(text)) return "오피스텔";
  if (/상가\s*주택|상가주택/i.test(explicitType) || /상가\s*주택|상가주택/i.test(text)) return "상가주택";

  return explicitType || "매물";
}

export function normalizePropertyForDisplay<T extends Property>(property: T): T {
  const type = detectPropertyDisplayType(property);
  const isOfficetel = type === "오피스텔";
  const isCommercialHouse = type === "상가주택";
  const rawTitle = clean(property.title);
  const title = isOfficetel
    ? rawTitle.replace(/원룸/g, "오피스텔")
    : isCommercialHouse
      ? rawTitle.replace(/상가(?!주택)/g, "상가주택")
      : property.title;

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
