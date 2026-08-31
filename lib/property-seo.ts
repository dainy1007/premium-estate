import { seoLandings } from "@/lib/seo-landings";
import { seoExtraLandings } from "@/lib/seo-extra-landings";

type SeoPropertyInput = {
  title?: string | null;
  location?: string | null;
  address?: string | null;
  type?: string | null;
  deal_type?: string | null;
  description?: string | null;
};

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const allSeoLandings = [...seoLandings, ...seoExtraLandings];

function includesAny(text: string, terms: string[]) {
  const haystack = text.toLowerCase();
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function detectPropertyType(input: SeoPropertyInput) {
  const explicitType = clean(input.type);
  if (explicitType) {
    const normalizedExplicitType = normalizePropertyType(explicitType);
    if (normalizedExplicitType && normalizedExplicitType !== "부동산") return normalizedExplicitType;
  }
  const title = clean(input.title);
  if (title) {
    const normalizedTitleType = normalizePropertyType(title);
    const knownTypes = ["미니투룸", "쓰리룸", "투룸", "원룸", "창고", "공장", "상가주택", "상가", "오피스텔", "아파트", "토지", "다가구", "단독주택"];
    if (knownTypes.includes(normalizedTitleType)) return normalizedTitleType;
  }
  return normalizePropertyType(clean(input.description));
}

export function normalizePropertyType(value: string) {
  const text = clean(value);
  if (!text) return "부동산";
  if (/미니\s*투룸/i.test(text)) return "미니투룸";
  if (/쓰리룸|3룸/i.test(text)) return "쓰리룸";
  if (/투룸|2룸/i.test(text)) return "투룸";
  if (/원룸/i.test(text)) return "원룸";
  if (/창고/i.test(text)) return "창고";
  if (/공장/i.test(text)) return "공장";
  if (/상가\s*주택|상가주택/i.test(text)) return "상가주택";
  if (/상가|근린생활시설|근생/i.test(text)) return "상가";
  if (/오피스텔/i.test(text)) return "오피스텔";
  if (/아파트/i.test(text)) return "아파트";
  if (/토지|대지|전|답|임야/i.test(text)) return "토지";
  if (/다가구/i.test(text)) return "다가구";
  if (/단독/i.test(text)) return "단독주택";
  return text;
}

export function normalizeDealType(value: string) {
  const text = clean(value);
  if (/월세/i.test(text)) return "월세";
  if (/전세/i.test(text)) return "전세";
  if (/매매/i.test(text)) return "매매";
  return text;
}

export function detectSeoArea(input: SeoPropertyInput) {
  const text = [input.location, input.address, input.title, input.description].map(clean).join(" ");
  if (/구지면|\b구지\b/i.test(text)) return "구지면";
  if (/현풍읍|\b현풍\b/i.test(text)) return "현풍읍";
  if (/유가읍|\b유가\b/i.test(text)) return "유가읍";
  if (/대합면|\b대합\b/i.test(text)) return "창녕 대합면";
  if (/창녕/i.test(text)) return "창녕군";
  if (/달성군/i.test(text)) return "대구 달성군";
  return clean(input.location) || "대구 달성군";
}

export function detectLandmark(input: SeoPropertyInput) {
  const text = [input.location, input.address, input.title, input.description].map(clean).join(" ");
  if (/디지스트|DGIST/i.test(text)) return "디지스트 인근";
  if (/테크노폴리스/i.test(text)) return "테크노폴리스";
  if (/쿠팡/i.test(text)) return "구지 쿠팡물류 인근";
  if (/엘엔에프|L&F/i.test(text)) return "엘엔에프 인근";
  return "";
}

export function buildSeoTitle(input: SeoPropertyInput) {
  const area = detectSeoArea(input);
  const propertyType = detectPropertyType(input);
  const dealType = normalizeDealType(clean(input.deal_type));
  const landmark = detectLandmark(input);
  const base = [area, propertyType, dealType].filter(Boolean).join(" ");
  return landmark && !base.includes(landmark) ? `${base} | ${landmark}` : base || clean(input.title) || "대구 달성군 부동산 매물";
}

export function buildSeoKeywords(input: SeoPropertyInput) {
  const area = detectSeoArea(input);
  const propertyType = detectPropertyType(input);
  const dealType = normalizeDealType(clean(input.deal_type));
  const landmark = detectLandmark(input);
  const compactArea = area.replace(/\s+/g, "");
  const compactLandmark = landmark.replace(/\s*인근$/, "").replace(/\s+/g, "");
  const text = [input.location, input.address, input.title, input.description].map(clean).join(" ");
  const coreAreas = [
    /현풍/i.test(text) ? "현풍" : "",
    /유가/i.test(text) ? "유가읍" : "",
    /디지스트|DGIST/i.test(text) ? "디지스트" : "",
    /테크노폴리스/i.test(text) ? "테크노폴리스" : "",
  ].filter(Boolean);
  const keywords = [
    [compactArea, propertyType, dealType].filter(Boolean).join(""),
    [compactArea, propertyType].filter(Boolean).join(""),
    landmark ? [compactLandmark, propertyType, dealType].filter(Boolean).join("") : "",
    landmark ? [compactLandmark, propertyType].filter(Boolean).join("") : "",
    `${compactArea}부동산`,
    ...coreAreas.flatMap((core) => [
      `${core}${propertyType}${dealType}`,
      `${core}${propertyType}`,
      `${core}부동산`,
    ]),
    "현풍부동산",
    "유가읍부동산",
    "디지스트부동산",
    "테크노폴리스부동산",
    "대구테크노폴리스부동산",
    "백조현대부동산",
    "백조현대부동산중개",
  ].filter(Boolean);
  return [...new Set(keywords)].slice(0, 18);
}

export function buildImageAlt(input: SeoPropertyInput, index = 1) {
  return `${buildSeoTitle(input)} 매물사진 ${index}`;
}

function landingMatchesPropertyType(propertyType: string, propertyTerms: string[]) {
  return propertyTerms.some((term) => normalizePropertyType(term) === propertyType);
}

export function getRelatedSeoLandings(input: SeoPropertyInput) {
  const area = detectSeoArea(input);
  const propertyType = detectPropertyType(input);
  const landmark = detectLandmark(input);
  const searchable = [input.title, input.location, input.address, input.type, input.deal_type, input.description, area, propertyType, landmark].map(clean).join(" ");
  return allSeoLandings
    .map((landing) => {
      const slug = landing.slug;
      const areaCompatible =
        (area === "현풍읍" && slug.startsWith("hyunpung-")) ||
        (area === "유가읍" && slug.startsWith("yuga-")) ||
        (area === "구지면" && slug.startsWith("guji-")) ||
        (slug.startsWith("techno-") && /테크노폴리스/i.test(landmark)) ||
        (slug.startsWith("dgist-") && /디지스트/i.test(landmark));
      const locationScore = includesAny(searchable, landing.locationTerms) ? 2 : 0;
      const propertyScore = landingMatchesPropertyType(propertyType, landing.propertyTerms) ? 4 : 0;
      const keywordScore = includesAny(searchable, landing.keywords) ? 1 : 0;
      const score = (areaCompatible ? 4 : 0) + locationScore + propertyScore + keywordScore;
      return { landing, score, areaCompatible };
    })
    .filter(({ score, areaCompatible }) => areaCompatible && score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ landing }) => ({ slug: landing.slug, title: landing.heading, href: `/real-estate/${landing.slug}` }));
}
