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

  // 현풍읍 중리 462-4: 동일 주소지 네이버 매물 및 건물정보 확인 반영.
  // 매매가 6억8,000 / 기보증금 1억7,100 / 월수익 230만원
  // 대지 261.9㎡ / 연면적 392.59㎡ / 지상 3층 / 북향
  // 총 5세대 / 방 9 / 욕실 6 / 사용승인일 2015.04.24 / 주차 4대
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

  return null;
}
