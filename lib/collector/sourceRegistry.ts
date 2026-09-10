import type { ListingSource } from "../../automation/collector/types";

export type CollectorSourceConfig = {
  source: ListingSource;
  label: string;
  enabled: boolean;
  priority: number;
  requiresLogin: boolean;
  mode: "browser" | "api" | "manual-import" | "unknown";
};

/**
 * 매체가 늘어나도 수집 코어를 수정하지 않고 adapter만 추가하기 위한 registry.
 * 실제 접근 방식은 각 매체의 이용약관/로그인/공개 API 제공 여부를 확인한 뒤 결정한다.
 */
export const COLLECTOR_SOURCES: CollectorSourceConfig[] = [
  { source: "naver", label: "네이버부동산", enabled: true, priority: 10, requiresLogin: false, mode: "unknown" },
  { source: "realestatebank", label: "부동산뱅크", enabled: true, priority: 20, requiresLogin: false, mode: "unknown" },
  { source: "hanbang", label: "한방", enabled: true, priority: 30, requiresLogin: true, mode: "unknown" },
  { source: "esiljang", label: "이실장", enabled: true, priority: 40, requiresLogin: true, mode: "unknown" },
  { source: "mk", label: "매경부동산", enabled: true, priority: 50, requiresLogin: false, mode: "unknown" },
  { source: "dabang", label: "다방", enabled: true, priority: 60, requiresLogin: false, mode: "unknown" },
  { source: "zigbang", label: "직방", enabled: true, priority: 70, requiresLogin: false, mode: "unknown" },
];

export function getEnabledCollectorSources() {
  return COLLECTOR_SOURCES.filter((item) => item.enabled).sort((a, b) => a.priority - b.priority);
}
