"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyListingStatus } from "@/types/property";

type AdminProperty = {
  id: number;
  title: string;
  location: string;
  price: string;
  type?: string | null;
  deal_type?: string | null;
  created_at?: string | null;
  is_featured?: boolean;
  is_hidden?: boolean;
  listing_status?: PropertyListingStatus;
};

const ALL = "전체";
const MANAGEMENT_COLUMNS =
  "id, title, location, price, type, deal_type, created_at, is_featured, is_hidden, listing_status";
const LEGACY_COLUMNS = "id, title, location, price, type, deal_type, created_at";

export default function AdminPage() {
  const [propertyList, setPropertyList] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState(ALL);
  const [dealType, setDealType] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [managementEnabled, setManagementEnabled] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    void getProperties();
  }, []);

  async function getProperties() {
    setLoading(true);
    setErrorMessage("");

    const primary = await supabase
      .from("properties")
      .select(MANAGEMENT_COLUMNS)
      .order("id", { ascending: false });

    if (!primary.error) {
      setPropertyList((primary.data || []) as AdminProperty[]);
      setManagementEnabled(true);
      setLoading(false);
      return;
    }

    console.warn("상태 관리 필드 조회 실패, 기존 구조로 다시 조회합니다:", primary.error);

    const fallback = await supabase
      .from("properties")
      .select(LEGACY_COLUMNS)
      .order("id", { ascending: false });

    if (fallback.error) {
      console.error("매물 불러오기 오류:", fallback.error);
      setErrorMessage("매물 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setPropertyList((fallback.data || []) as AdminProperty[]);
    setManagementEnabled(false);
    setLoading(false);
  }

  const propertyTypes = useMemo(
    () => [ALL, ...Array.from(new Set(propertyList.map((item) => item.type).filter(Boolean) as string[]))],
    [propertyList],
  );

  const dealTypes = useMemo(
    () => [ALL, ...Array.from(new Set(propertyList.map((item) => item.deal_type).filter(Boolean) as string[]))],
    [propertyList],
  );

  const counts = useMemo(
    () => ({
      total: propertyList.length,
      featured: propertyList.filter((item) => item.is_featured).length,
      hidden: propertyList.filter((item) => item.is_hidden).length,
      completed: propertyList.filter((item) => item.listing_status === "completed").length,
    }),
    [propertyList],
  );

  const filteredProperties = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return propertyList.filter((property) => {
      const searchableText = [property.title, property.location, property.price, property.type, property.deal_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword);
      const matchesPropertyType = propertyType === ALL || property.type === propertyType;
      const matchesDealType = dealType === ALL || property.deal_type === dealType;
      const matchesStatus =
        statusFilter === ALL ||
        (statusFilter === "추천" && property.is_featured) ||
        (statusFilter === "숨김" && property.is_hidden) ||
        (statusFilter === "계약완료" && property.listing_status === "completed") ||
        (statusFilter === "노출중" && !property.is_hidden && property.listing_status !== "completed");

      return matchesKeyword && matchesPropertyType && matchesDealType && matchesStatus;
    });
  }, [dealType, keyword, propertyList, propertyType, statusFilter]);

  const resetFilters = () => {
    setKeyword("");
    setPropertyType(ALL);
    setDealType(ALL);
    setStatusFilter(ALL);
  };

  async function updateManagementField(
    property: AdminProperty,
    changes: Partial<Pick<AdminProperty, "is_featured" | "is_hidden" | "listing_status">>,
    successText: string,
  ) {
    if (!managementEnabled) {
      setErrorMessage("Supabase 상태 관리 SQL을 먼저 적용해야 합니다.");
      return;
    }

    setBusyId(property.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.from("properties").update(changes).eq("id", property.id);

    if (error) {
      console.error("매물 상태 변경 오류:", error);
      setErrorMessage("매물 상태를 변경하지 못했습니다.");
      setBusyId(null);
      return;
    }

    setPropertyList((current) =>
      current.map((item) => (item.id === property.id ? { ...item, ...changes } : item)),
    );
    setSuccessMessage(successText);
    setBusyId(null);
  }

  async function handleDelete(id: number) {
    const ok = window.confirm("정말 삭제하시겠습니까? 삭제한 매물은 복구할 수 없습니다.");
    if (!ok) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      console.error("삭제 오류:", error);
      window.alert("매물을 삭제하지 못했습니다.");
      return;
    }

    setPropertyList((previous) => previous.filter((property) => property.id !== id));
    window.alert("삭제되었습니다.");
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 rounded-[32px] bg-white p-7 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">ADMIN DASHBOARD</p>
            <h1 className="mt-2 text-3xl font-bold">백조현대부동산 관리자</h1>
            <p className="mt-2 text-sm text-[#0A2342]/60">등록 매물과 고객 문의를 한 곳에서 관리합니다.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/inquiries" className="rounded-full border border-[#0A2342]/15 px-6 py-3 text-center font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">
              문의 관리
            </Link>
            <Link href="/admin/properties/new" className="rounded-full bg-[#C9A227] px-6 py-3 text-center font-semibold text-[#0A2342]">
              + 매물 등록
            </Link>
          </div>
        </div>

        {!managementEnabled && !loading && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
            <strong>상태 관리 준비가 필요합니다.</strong> 저장소의
            <code className="mx-1 rounded bg-white px-2 py-1">supabase/migrations/20260806_property_management_fields.sql</code>
            내용을 Supabase SQL Editor에서 실행하면 추천·숨김·계약완료 기능이 활성화됩니다. 현재 등록·수정·삭제 기능은 그대로 사용할 수 있습니다.
          </div>
        )}

        {errorMessage && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>}
        {successMessage && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="전체 등록 매물" value={counts.total} onClick={() => setStatusFilter(ALL)} active={statusFilter === ALL} />
          <StatCard label="추천 매물" value={counts.featured} onClick={() => setStatusFilter("추천")} active={statusFilter === "추천"} />
          <StatCard label="숨김 매물" value={counts.hidden} onClick={() => setStatusFilter("숨김")} active={statusFilter === "숨김"} />
          <StatCard label="계약완료" value={counts.completed} onClick={() => setStatusFilter("계약완료")} active={statusFilter === "계약완료"} />
        </section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[32px] bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 border-b border-[#0A2342]/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">등록 매물 관리</h2>
              <p className="mt-1 text-sm text-[#0A2342]/55">검색과 필터를 사용하고, 매물별 공개 상태를 바로 변경합니다.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_145px_145px_145px_auto]">
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="매물명·지역·가격 검색" className="rounded-2xl border border-[#0A2342]/15 px-4 py-3 text-sm outline-none focus:border-[#C9A227]" />
              <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A227]">
                {propertyTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={dealType} onChange={(event) => setDealType(event.target.value)} className="rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A227]">
                {dealTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A227]">
                {[ALL, "노출중", "추천", "숨김", "계약완료"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" onClick={resetFilters} className="rounded-2xl border border-[#0A2342]/15 px-4 py-3 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">초기화</button>
            </div>
          </div>

          {loading && <p className="py-16 text-center text-[#0A2342]/55">매물을 불러오는 중입니다...</p>}

          {!loading && !errorMessage && filteredProperties.length === 0 && (
            <div className="my-8 rounded-2xl border border-dashed border-[#0A2342]/20 p-10 text-center">
              <p className="font-semibold">조건에 맞는 매물이 없습니다.</p>
              <button type="button" onClick={resetFilters} className="mt-3 text-sm font-semibold text-[#C9A227] hover:underline">검색 조건 초기화</button>
            </div>
          )}

          {!loading && filteredProperties.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead className="bg-[#F8F9FB] text-sm">
                  <tr>
                    <th className="px-4 py-4 text-left">번호</th>
                    <th className="px-4 py-4 text-left">매물명</th>
                    <th className="px-4 py-4 text-left">유형</th>
                    <th className="px-4 py-4 text-left">지역·가격</th>
                    <th className="px-4 py-4 text-left">상태</th>
                    <th className="px-4 py-4 text-center">빠른 관리</th>
                    <th className="px-4 py-4 text-center">상세 관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => {
                    const isBusy = busyId === property.id;
                    const completed = property.listing_status === "completed";

                    return (
                      <tr key={property.id} className="border-t border-[#0A2342]/10 text-sm align-top">
                        <td className="px-4 py-4 text-[#0A2342]/55">{property.id}</td>
                        <td className="px-4 py-4 font-semibold">{property.title}</td>
                        <td className="px-4 py-4">{property.type || "-"}<span className="ml-2 text-[#0A2342]/50">{property.deal_type || ""}</span></td>
                        <td className="px-4 py-4">
                          <p>{property.location || "-"}</p>
                          <p className="mt-1 font-semibold text-[#9B7900]">{property.price || "문의"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {!property.is_hidden && !completed && <Badge label="노출중" className="bg-emerald-100 text-emerald-800" />}
                            {property.is_featured && <Badge label="추천" className="bg-amber-100 text-amber-800" />}
                            {property.is_hidden && <Badge label="숨김" className="bg-slate-200 text-slate-700" />}
                            {completed && <Badge label="계약완료" className="bg-blue-100 text-blue-800" />}
                            {!managementEnabled && <Badge label="기본 구조" className="bg-slate-100 text-slate-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <QuickButton disabled={isBusy || !managementEnabled} active={Boolean(property.is_featured)} onClick={() => void updateManagementField(property, { is_featured: !property.is_featured }, property.is_featured ? "추천 매물에서 해제했습니다." : "추천 매물로 지정했습니다.")}>추천</QuickButton>
                            <QuickButton disabled={isBusy || !managementEnabled} active={Boolean(property.is_hidden)} onClick={() => void updateManagementField(property, { is_hidden: !property.is_hidden }, property.is_hidden ? "매물을 다시 공개했습니다." : "매물을 숨김 처리했습니다.")}>숨김</QuickButton>
                            <QuickButton disabled={isBusy || !managementEnabled} active={completed} onClick={() => void updateManagementField(property, { listing_status: completed ? "active" : "completed" }, completed ? "계약완료 상태를 해제했습니다." : "계약완료로 처리했습니다.")}>계약완료</QuickButton>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <Link href={`/admin/properties/${property.id}`} className="rounded-full border px-4 py-2 text-xs font-semibold hover:border-[#C9A227]">보기</Link>
                            <Link href={`/admin/properties/${property.id}/edit`} className="rounded-full border px-4 py-2 text-xs font-semibold hover:border-[#C9A227]">수정</Link>
                            <button type="button" onClick={() => handleDelete(property.id)} className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">삭제</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

function StatCard({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-[24px] bg-white p-6 text-left shadow-sm ring-2 transition ${active ? "ring-[#C9A227]" : "ring-transparent hover:ring-[#0A2342]/10"}`}>
      <p className="text-sm text-[#0A2342]/55">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#0A2342]">{value}</p>
    </button>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function QuickButton({ children, active, disabled, onClick }: { children: React.ReactNode; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`rounded-full border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${active ? "border-[#C9A227] bg-[#C9A227]/15 text-[#7B6000]" : "border-[#0A2342]/15 hover:border-[#C9A227] hover:bg-[#C9A227]/10"}`}>
      {children}
    </button>
  );
}
