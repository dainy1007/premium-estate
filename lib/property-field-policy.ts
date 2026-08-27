export const RESIDENTIAL_PROPERTY_TYPES = new Set([
  "아파트",
  "오피스텔",
  "원룸",
  "미니투룸",
  "투룸",
  "쓰리룸",
  "단독주택",
  "다가구",
  "다세대",
  "연립",
  "빌라",
  "상가주택",
]);

export type PropertyFieldPolicy = {
  showMaintenance: boolean;
  showRooms: boolean;
  showBathrooms: boolean;
  showMoveIn: boolean;
  showHeating: boolean;
  showElevator: boolean;
  showContractExclusiveArea: boolean;
};

export function getPropertyFieldPolicy(type?: string | null): PropertyFieldPolicy {
  const normalized = String(type || "").trim();
  const residential = RESIDENTIAL_PROPERTY_TYPES.has(normalized);
  const warehouseFactoryLand = /^(창고|공장|창고·공장|창고\/공장|토지)$/.test(normalized);

  return {
    // 관리자 입력 화면과 공개 홈페이지가 이 기준을 함께 사용한다.
    showMaintenance: residential,
    showRooms: residential,
    showBathrooms: true,
    showMoveIn: residential,
    showHeating: residential,
    showElevator: !warehouseFactoryLand,
    showContractExclusiveArea: normalized === "상가",
  };
}
