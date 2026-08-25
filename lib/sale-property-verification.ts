import type { Property } from "@/types/property";

export type VerifiedSaleInfo = {
  description: string;
  area?: string;
  floor?: string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function getVerifiedSaleInfo(property: Property): VerifiedSaleInfo | null {
  if (clean(property.deal_type) !== "매매") return null;

  const address = clean(property.address);
  const title = clean(property.title);
  const location = clean(property.location);
  const text = [address, title, location].join(" ");

  // 현풍읍 중리 462-4: 동일 주소지 네이버 매물 및 건물정보 확인 반영.
  if (/현풍읍\s+중리\s+462-4/.test(address)) {
    return {
      area: "대지 261.9㎡ / 연면적 392.59㎡",
      floor: "지상 3층",
      description: [
        "현풍읍 중리 462-4에 위치한 상가주택 매매 매물입니다.",
        "",
        "매물 정보",
        `매매가 : ${property.price || "6억 8,000"}`,
        "기보증금 : 1억 7,100만원",
        "월 임대수익 : 230만원",
        "총 세대수 : 5세대",
        "방/욕실 : 9개 / 6개",
        "대지면적 : 261.9㎡",
        "연면적 : 392.59㎡",
        "층수 : 지상 3층",
        "방향 : 북향(거실 기준)",
        "주차 : 4대",
        "사용승인일 : 2015.04.24",
        "건축물 용도 : 단독주택(상가주택 형태)",
        "",
        "동일 주소지의 매매 매물 및 건물정보를 함께 확인해 반영한 내용입니다.",
      ].join("\n"),
    };
  }

  // 하나리움퀸즈파크 106동 14층 / 유가읍 봉리 601
  if (/하나리움퀸즈파크|봉리\s*601/i.test(text)) {
    return {
      area: "공급 83.27㎡ / 전용 59.87㎡",
      floor: "14/25층",
      description: [
        "대구테크노폴리스 하나리움퀸즈파크 아파트 매매 매물입니다.",
        "",
        "매물 정보",
        `매매가 : ${property.price || "1억 6,500만원"}`,
        "공급/전용면적 : 83.27㎡ / 59.87㎡",
        "전용률 : 72%",
        "해당층/총층 : 14/25층",
        "방/욕실 : 3개 / 2개",
        "방향 : 동향(거실 기준)",
        "관리비 : 18만원",
        "현관구조 : 계단식",
        "난방 : 개별난방 / 도시가스",
        "입주가능일 : 2026년 9월 30일",
        "총주차대수 : 1,049대 (세대당 1.15대)",
        "해당면적 세대수 : 477세대",
        "건축물 용도 : 공동주택",
        "",
        "매물 특징",
        "9월말 이사협의 · 새도배 · 시트작업 · 사이 트인 비슬산뷰",
      ].join("\n"),
    };
  }

  // 대구테크노폴리스 남해오네뜨1차 / 현풍읍 중리 480
  if (/남해오네뜨1차|중리\s*480/i.test(text)) {
    return {
      area: "공급 82.66㎡ / 전용 59.95㎡",
      floor: "7/25층",
      description: [
        "대구테크노폴리스 남해오네뜨1차 아파트 매매 매물입니다.",
        "",
        "매물 정보",
        `매매가 : ${property.price || "1억 9,000만원"}`,
        "공급/전용면적 : 82.66㎡ / 59.95㎡",
        "해당층/총층 : 7/25층",
        "방/욕실 : 3개 / 2개",
        "방향 : 남향(거실 기준)",
        "관리비 : 10만원",
        "난방 : 개별난방 / 도시가스",
        "총주차대수 : 939대 (세대당 1.18대)",
        "건축물 용도 : 공동주택",
        "",
        "매물 특징",
        "올수리 · 채광좋음 · 이사협의",
      ].join("\n"),
    };
  }

  return null;
}
