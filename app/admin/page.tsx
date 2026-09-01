"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizePropertyForDisplay } from "@/lib/property-normalize";
import type { Property, PropertyListingStatus } from "@/types/property";

type AdminProperty = Property & {
  id: number;
  title: string;
  location: string;
  address?: string | null;
  price: string;
  type?: string | null;
  deal_type?: string | null;
  created_at?: string | null;
  is_featured?: boolean;
  is_hidden?: boolean;
  listing_status?: PropertyListingStatus;
};

const ALL = "전체";
const COLUMNS = "id,title,address,location,price,type,deal_type,description,created_at,is_featured,is_hidden,listing_status";
const ADMIN_LIST_STATE_KEY = "baekjo-admin-property-list-state";
type SavedAdminListState = { keyword?: string; propertyType?: string; dealType?: string; statusFilter?: string };

export default function AdminPage() {
  const [propertyList, setPropertyList] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState(ALL);
  const [dealType, setDealType] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [stateReady, setStateReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_LIST_STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedAdminListState;
        setKeyword(saved.keyword || "");
        setPropertyType(saved.propertyType || ALL);
        setDealType(saved.dealType || ALL);
        setStatusFilter(saved.statusFilter || ALL);
      }
    } catch (error) {
      console.warn("관리자 매물 목록 상태 복원 실패:", error);
    }
    setStateReady(true);
    void getProperties();
  }, []);

  useEffect(() => {
    if (!stateReady) return;
    try {
      sessionStorage.setItem(ADMIN_LIST_STATE_KEY, JSON.stringify({ keyword, propertyType, dealType, statusFilter }));
    } catch (error) {
      console.warn("관리자 매물 목록 상태 저장 실패:", error);
    }
  }, [keyword, propertyType, dealType, statusFilter, stateReady]);

  async function getProperties() {
    setLoading(true);
    const { data, error } = await supabase.from("properties").select(COLUMNS).order("id", { ascending: false });
    if (error) {
      console.error(error);
      setErrorMessage("매물 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    setPropertyList(((data || []) as AdminProperty[]).map((item) => normalizePropertyForDisplay(item) as AdminProperty));
    setLoading(false);
  }

  const propertyTypes = useMemo(() => [ALL, ...Array.from(new Set(propertyList.map((v) => v.type).filter(Boolean) as string[]))], [propertyList]);
  const dealTypes = useMemo(() => [ALL, ...Array.from(new Set(propertyList.map((v) => v.deal_type).filter(Boolean) as string[]))], [propertyList]);
  const counts = useMemo(() => ({
    total: propertyList.length,
    featured: propertyList.filter((v) => v.is_featured).length,
    hidden: propertyList.filter((v) => v.is_hidden).length,
    completed: propertyList.filter((v) => v.listing_status === "completed").length,
  }), [propertyList]);

  const filtered = useMemo(() => propertyList.filter((p) => {
    const q = keyword.trim().toLowerCase();
    const text = [p.title, p.location, p.address, p.price, p.type, p.deal_type].filter(Boolean).join(" ").toLowerCase();
    const statusOk = statusFilter === ALL
      || (statusFilter === "추천" && p.is_featured)
      || (statusFilter === "숨김" && p.is_hidden)
      || (statusFilter === "계약완료" && p.listing_status === "completed")
      || (statusFilter === "노출중" && !p.is_hidden && p.listing_status !== "completed");
    return (!q || text.includes(q))
      && (propertyType === ALL || p.type === propertyType)
      && (dealType === ALL || p.deal_type === dealType)
      && statusOk;
  }), [propertyList, keyword, propertyType, dealType, statusFilter]);

  async function updateField(property: AdminProperty, changes: Record<string, unknown>) {
    setBusyId(property.id);
    const { error } = await supabase.from("properties").update(changes).eq("id", property.id);
    if (error) window.alert("상태 변경에 실패했습니다.");
    else setPropertyList((list) => list.map((v) => v.id === property.id ? ({ ...v, ...changes } as AdminProperty) : v));
    setBusyId(null);
  }

  function startTitleEdit(property: AdminProperty) {
    setEditingTitleId(property.id);
    setEditingTitle(property.title || "");
  }

  function cancelTitleEdit() {
    setEditingTitleId(null);
    setEditingTitle("");
  }

  async function saveTitle(property: AdminProperty) {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      window.alert("매물명을 입력해 주세요.");
      return;
    }
    if (nextTitle === property.title) {
      cancelTitleEdit();
      return;
    }
    setBusyId(property.id);
    const { error } = await supabase.from("properties").update({ title: nextTitle }).eq("id", property.id);
    if (error) {
      console.error(error);
      window.alert("매물명 수정에 실패했습니다.");
    } else {
      setPropertyList((list) => list.map((v) => v.id === property.id ? ({ ...v, title: nextTitle } as AdminProperty) : v));
      cancelTitleEdit();
    }
    setBusyId(null);
  }

  async function handleDuplicate(property: AdminProperty) {
    if (!window.confirm(`'${property.title}' 매물을 복사할까요?\n복사본은 숨김 상태로 생성됩니다.`)) return;
    setBusyId(property.id);
    try {
      const response = await fetch(`/api/admin/properties/${property.id}/duplicate`, { method: "POST" });
      const result = await response.json() as { ok?: boolean; property_id?: number; error?: string };
      if (!response.ok || !result.ok || !result.property_id) throw new Error(result.error || "duplicate_failed");
      window.location.href = `/admin/properties/${result.property_id}/edit`;
    } catch (error) {
      console.error(error);
      window.alert("매물 복사에 실패했습니다.");
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) window.alert("삭제하지 못했습니다.");
    else setPropertyList((list) => list.filter((v) => v.id !== id));
  }

  const reset = () => {
    setKeyword("");
    setPropertyType(ALL);
    setDealType(ALL);
    setStatusFilter(ALL);
    try { sessionStorage.removeItem(ADMIN_LIST_STATE_KEY); } catch {}
  };

  return (
    <main className="h-[calc(100dvh-65px)] overflow-hidden bg-[#F8F9FB] px-3 py-2 text-[#0A2342] sm:px-4">
      <div className="mx-auto flex h-full max-w-7xl min-h-0 flex-col">
        <div className="shrink-0 flex flex-col gap-2 rounded-[22px] bg-white px-5 py-3 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#C9A227]">ADMIN DASHBOARD</p>
            <h1 className="mt-0.5 text-2xl font-bold">백조현대부동산 관리자</h1>
            <p className="mt-0.5 text-xs text-[#0A2342]/60">등록 매물과 고객 문의를 한 곳에서 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/inquiries" className="rounded-full border px-5 py-2 text-sm font-semibold">문의 관리</Link>
            <Link href="/admin/properties/new" className="rounded-full bg-[#C9A227] px-5 py-2 text-sm font-semibold">+ 매물 등록</Link>
          </div>
        </div>

        {errorMessage && <div className="mt-2 shrink-0 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}

        <section className="mt-2 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          {[["전체 등록 매물", counts.total, ALL], ["추천 매물", counts.featured, "추천"], ["숨김 매물", counts.hidden, "숨김"], ["계약완료", counts.completed, "계약완료"]].map(([label, value, status]) => (
            <button key={String(label)} onClick={() => setStatusFilter(String(status))} className="rounded-[18px] bg-white px-4 py-2.5 text-left shadow-sm">
              <p className="text-xs text-[#0A2342]/55">{label}</p>
              <p className="mt-0.5 text-2xl font-bold">{value}</p>
            </button>
          ))}
        </section>

        <section className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-white shadow-sm">
          <div className="shrink-0 border-b border-[#0A2342]/10 bg-white px-4 py-3 md:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="shrink-0">
                <h2 className="text-lg font-bold">등록 매물 관리</h2>
                <p className="mt-0.5 text-xs text-[#0A2342]/55">홈페이지와 동일한 주소·매물유형 보정 기준으로 표시합니다.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[200px_130px_130px_130px_auto] xl:items-end">
                <label className="flex flex-col gap-1"><span className="text-[11px] font-semibold text-[#0A2342]/60">검색</span><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="매물명·지역·가격 검색" className="h-10 rounded-xl border px-3 text-sm" /></label>
                <label className="flex flex-col gap-1"><span className="text-[11px] font-semibold text-[#0A2342]/60">매물유형</span><select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">{propertyTypes.map((v) => <option key={v}>{v}</option>)}</select></label>
                <label className="flex flex-col gap-1"><span className="text-[11px] font-semibold text-[#0A2342]/60">거래유형</span><select value={dealType} onChange={(e) => setDealType(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">{dealTypes.map((v) => <option key={v}>{v}</option>)}</select></label>
                <label className="flex flex-col gap-1"><span className="text-[11px] font-semibold text-[#0A2342]/60">노출상태</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">{[ALL, "노출중", "추천", "숨김", "계약완료"].map((v) => <option key={v}>{v}</option>)}</select></label>
                <button onClick={reset} className="h-10 rounded-xl border px-4 text-sm font-semibold">필터 초기화</button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="flex flex-1 items-center justify-center text-center">매물을 불러오는 중입니다...</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1160px] border-collapse">
                <thead className="sticky top-0 z-30 bg-[#F8F9FB] shadow-sm">
                  <tr>{["번호", "매물명", "유형", "지역·가격", "상태", "빠른 관리", "상세 관리"].map((v) => <th key={v} className="px-3 py-2.5 text-left text-sm">{v}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const completed = p.listing_status === "completed";
                    const busy = busyId === p.id;
                    const editingTitleRow = editingTitleId === p.id;
                    return (
                      <tr key={p.id} className="border-t align-middle text-sm">
                        <td className="px-3 py-2.5">{p.id}</td>
                        <td className="px-3 py-2.5 font-semibold">
                          {editingTitleRow ? (
                            <div className="min-w-[260px]"><input autoFocus value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void saveTitle(p); if (e.key === "Escape") cancelTitleEdit(); }} className="w-full rounded-lg border px-3 py-1.5" /><div className="mt-1 flex gap-2"><button disabled={busy} onClick={() => void saveTitle(p)} className="rounded-full bg-[#0A2342] px-3 py-1 text-xs font-semibold text-white">저장</button><button disabled={busy} onClick={cancelTitleEdit} className="rounded-full border px-3 py-1 text-xs">취소</button></div></div>
                          ) : (
                            <button type="button" onClick={() => startTitleEdit(p)} className="min-w-[240px] text-left font-semibold hover:text-[#9B7900] hover:underline">{p.title}</button>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">{p.type || "-"} <span className="text-[#0A2342]/50">{p.deal_type}</span></td>
                        <td className="px-3 py-2.5"><p>{p.location || "-"}</p><p className="mt-0.5 font-semibold text-[#9B7900]">{p.price || "문의"}</p></td>
                        <td className="whitespace-nowrap px-3 py-2.5">{p.is_hidden ? "숨김" : completed ? "계약완료" : "노출중"}{p.is_featured ? " · 추천" : ""}</td>
                        <td className="px-3 py-2.5"><div className="flex flex-nowrap gap-1.5"><button disabled={busy} onClick={() => void updateField(p, { is_featured: !p.is_featured })} className="whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs">추천</button><button disabled={busy} onClick={() => void updateField(p, { is_hidden: !p.is_hidden })} className="whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs">숨김</button><button disabled={busy} onClick={() => void updateField(p, { listing_status: completed ? "active" : "completed" })} className="whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs">계약완료</button></div></td>
                        <td className="px-3 py-2.5"><div className="flex flex-nowrap gap-1.5"><Link href={`/admin/properties/${p.id}`} className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs">보기</Link><Link href={`/admin/properties/${p.id}/edit`} className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs">수정</Link><button disabled={busy} onClick={() => void handleDuplicate(p)} className="whitespace-nowrap rounded-full border border-[#C9A227]/50 px-3 py-1.5 text-xs font-semibold text-[#9B7900] disabled:opacity-50">{busy ? "처리중" : "복사"}</button><button onClick={() => void handleDelete(p.id)} className="whitespace-nowrap rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-600">삭제</button></div></td>
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
