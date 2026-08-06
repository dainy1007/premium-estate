"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyListingStatus } from "@/types/property";

type BulkProperty = {
  id: number;
  title: string;
  location?: string | null;
  price?: string | null;
  type?: string | null;
  deal_type?: string | null;
  is_featured?: boolean;
  is_hidden?: boolean;
  listing_status?: PropertyListingStatus;
};

type BulkAction =
  | "feature"
  | "unfeature"
  | "hide"
  | "show"
  | "complete"
  | "activate";

const ACTION_LABELS: Record<BulkAction, string> = {
  feature: "추천 지정",
  unfeature: "추천 해제",
  hide: "숨김 처리",
  show: "노출 처리",
  complete: "계약완료 처리",
  activate: "거래중으로 변경",
};

export default function AdminBulkPage() {
  const [properties, setProperties] = useState<BulkProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [managementEnabled, setManagementEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setErrorMessage("");

    const primary = await supabase
      .from("properties")
      .select("id, title, location, price, type, deal_type, is_featured, is_hidden, listing_status")
      .order("id", { ascending: false });

    if (!primary.error) {
      setProperties((primary.data || []) as BulkProperty[]);
      setManagementEnabled(true);
      setLoading(false);
      return;
    }

    const fallback = await supabase
      .from("properties")
      .select("id, title, location, price, type, deal_type")
      .order("id", { ascending: false });

    if (fallback.error) {
      setErrorMessage("매물 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setProperties((fallback.data || []) as BulkProperty[]);
    setManagementEnabled(false);
    setLoading(false);
  }

  const filteredProperties = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return properties;

    return properties.filter((property) =>
      [property.title, property.location, property.price, property.type, property.deal_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, properties]);

  const visibleIds = filteredProperties.map((property) => property.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const toggleOne = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  async function runBulkAction(action: BulkAction) {
    if (!managementEnabled) {
      setErrorMessage("Supabase 상태 관리 SQL을 먼저 적용해야 일괄 처리를 사용할 수 있습니다.");
      return;
    }

    if (selectedIds.length === 0) {
      setErrorMessage("처리할 매물을 먼저 선택해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `선택한 ${selectedIds.length}개 매물을 '${ACTION_LABELS[action]}' 하시겠습니까?`,
    );
    if (!confirmed) return;

    const changes: Partial<BulkProperty> =
      action === "feature"
        ? { is_featured: true }
        : action === "unfeature"
          ? { is_featured: false }
          : action === "hide"
            ? { is_hidden: true }
            : action === "show"
              ? { is_hidden: false }
              : action === "complete"
                ? { listing_status: "completed" }
                : { listing_status: "active" };

    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("properties").update(changes).in("id", selectedIds);

    if (error) {
      console.error("매물 일괄 처리 오류:", error);
      setErrorMessage("일괄 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }

    setProperties((current) =>
      current.map((property) =>
        selectedIds.includes(property.id) ? { ...property, ...changes } : property,
      ),
    );
    setMessage(`${selectedIds.length}개 매물을 '${ACTION_LABELS[action]}' 했습니다.`);
    setSelectedIds([]);
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] bg-white p-7 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">BULK MANAGEMENT</p>
              <h1 className="mt-2 text-3xl font-bold">매물 일괄 관리</h1>
              <p className="mt-2 text-sm text-[#0A2342]/60">
                여러 매물을 선택해 추천·노출·숨김·계약 상태를 한 번에 변경합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-full border border-[#0A2342]/15 px-5 py-3 text-sm font-semibold">
                매물 관리
              </Link>
              <Link href="/admin/overview" className="rounded-full bg-[#0A2342] px-5 py-3 text-sm font-semibold text-white">
                운영 현황
              </Link>
            </div>
          </div>
        </section>

        {!managementEnabled && !loading && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            추천·숨김·계약완료 필드가 아직 없습니다. Supabase SQL 적용 후 일괄 관리가 활성화됩니다.
          </div>
        )}

        {message && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
        {errorMessage && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>}

        <section className="mt-6 rounded-[32px] bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 border-b border-[#0A2342]/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold">선택된 매물 {selectedIds.length}개</h2>
              <p className="mt-1 text-sm text-[#0A2342]/55">검색 결과만 전체 선택하거나 개별 선택할 수 있습니다.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTION_LABELS) as BulkAction[]).map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={submitting || !managementEnabled || selectedIds.length === 0}
                  onClick={() => void runBulkAction(action)}
                  className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="매물명·지역·가격 검색"
              className="w-full rounded-2xl border border-[#0A2342]/15 px-4 py-3 text-sm outline-none focus:border-[#C9A227] sm:max-w-md"
            />
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold"
            >
              선택 해제
            </button>
          </div>

          {loading && <p className="py-16 text-center text-[#0A2342]/55">매물을 불러오는 중입니다...</p>}

          {!loading && filteredProperties.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-[#0A2342]/20 p-10 text-center">
              조건에 맞는 매물이 없습니다.
            </div>
          )}

          {!loading && filteredProperties.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-[#F8F9FB] text-sm">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label="검색 결과 전체 선택"
                      />
                    </th>
                    <th className="px-4 py-4 text-left">번호</th>
                    <th className="px-4 py-4 text-left">매물명</th>
                    <th className="px-4 py-4 text-left">유형</th>
                    <th className="px-4 py-4 text-left">지역·가격</th>
                    <th className="px-4 py-4 text-left">현재 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => {
                    const checked = selectedIds.includes(property.id);
                    const completed = property.listing_status === "completed";

                    return (
                      <tr key={property.id} className={`border-t border-[#0A2342]/10 text-sm ${checked ? "bg-[#C9A227]/10" : ""}`}>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(property.id)}
                            aria-label={`${property.title} 선택`}
                          />
                        </td>
                        <td className="px-4 py-4 text-[#0A2342]/55">{property.id}</td>
                        <td className="px-4 py-4 font-semibold">{property.title}</td>
                        <td className="px-4 py-4">{property.type || "-"} {property.deal_type || ""}</td>
                        <td className="px-4 py-4">
                          <p>{property.location || "-"}</p>
                          <p className="mt-1 font-semibold text-[#9B7900]">{property.price || "문의"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {property.is_featured && <StatusBadge label="추천" className="bg-amber-100 text-amber-800" />}
                            {property.is_hidden && <StatusBadge label="숨김" className="bg-slate-200 text-slate-700" />}
                            {completed && <StatusBadge label="계약완료" className="bg-blue-100 text-blue-800" />}
                            {!property.is_hidden && !completed && <StatusBadge label="노출중" className="bg-emerald-100 text-emerald-800" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
