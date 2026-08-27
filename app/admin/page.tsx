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

export default function AdminPage() {
  const [propertyList, setPropertyList] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState(ALL);
  const [dealType, setDealType] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => { void getProperties(); }, []);

  async function getProperties() {
    setLoading(true);
    const { data, error } = await supabase.from("properties").select(COLUMNS).order("id", { ascending: false });
    if (error) {
      console.error(error);
      setErrorMessage("매물 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    const normalized = ((data || []) as AdminProperty[]).map((item) => normalizePropertyForDisplay(item) as AdminProperty);
    setPropertyList(normalized);
    setLoading(false);
  }

  const propertyTypes = useMemo(() => [ALL, ...Array.from(new Set(propertyList.map(v => v.type).filter(Boolean) as string[]))], [propertyList]);
  const dealTypes = useMemo(() => [ALL, ...Array.from(new Set(propertyList.map(v => v.deal_type).filter(Boolean) as string[]))], [propertyList]);
  const counts = useMemo(() => ({
    total: propertyList.length,
    featured: propertyList.filter(v => v.is_featured).length,
    hidden: propertyList.filter(v => v.is_hidden).length,
    completed: propertyList.filter(v => v.listing_status === "completed").length,
  }), [propertyList]);

  const filtered = useMemo(() => propertyList.filter(p => {
    const q = keyword.trim().toLowerCase();
    const text = [p.title,p.location,p.address,p.price,p.type,p.deal_type].filter(Boolean).join(" ").toLowerCase();
    const statusOk = statusFilter === ALL ||
      (statusFilter === "추천" && p.is_featured) ||
      (statusFilter === "숨김" && p.is_hidden) ||
      (statusFilter === "계약완료" && p.listing_status === "completed") ||
      (statusFilter === "노출중" && !p.is_hidden && p.listing_status !== "completed");
    return (!q || text.includes(q)) && (propertyType === ALL || p.type === propertyType) && (dealType === ALL || p.deal_type === dealType) && statusOk;
  }), [propertyList, keyword, propertyType, dealType, statusFilter]);

  async function updateField(property: AdminProperty, changes: Record<string, unknown>) {
    setBusyId(property.id);
    const { error } = await supabase.from("properties").update(changes).eq("id", property.id);
    if (error) window.alert("상태 변경에 실패했습니다.");
    else setPropertyList(list => list.map(v => v.id === property.id ? ({...v,...changes} as AdminProperty) : v));
    setBusyId(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) window.alert("삭제하지 못했습니다.");
    else setPropertyList(list => list.filter(v => v.id !== id));
  }

  const reset = () => { setKeyword(""); setPropertyType(ALL); setDealType(ALL); setStatusFilter(ALL); };

  return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 rounded-[32px] bg-white p-7 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
        <div><p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">ADMIN DASHBOARD</p><h1 className="mt-2 text-3xl font-bold">백조현대부동산 관리자</h1><p className="mt-2 text-sm text-[#0A2342]/60">등록 매물과 고객 문의를 한 곳에서 관리합니다.</p></div>
        <div className="flex gap-3"><Link href="/admin/inquiries" className="rounded-full border px-6 py-3 font-semibold">문의 관리</Link><Link href="/admin/properties/new" className="rounded-full bg-[#C9A227] px-6 py-3 font-semibold">+ 매물 등록</Link></div>
      </div>
      {errorMessage && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-red-700">{errorMessage}</div>}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["전체 등록 매물",counts.total,ALL],["추천 매물",counts.featured,"추천"],["숨김 매물",counts.hidden,"숨김"],["계약완료",counts.completed,"계약완료"]].map(([label,value,status]) => <button key={String(label)} onClick={() => setStatusFilter(String(status))} className="rounded-[24px] bg-white p-6 text-left shadow-sm"><p className="text-sm text-[#0A2342]/55">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></button>)}
      </section>
      <section className="mt-6 rounded-[32px] bg-white p-5 shadow-sm md:p-8">
        <div className="relative z-30 -mx-5 bg-white px-5 pb-6 md:-mx-8 md:px-8 lg:sticky lg:top-[72px] lg:border-b lg:border-[#0A2342]/10 lg:pt-3 lg:shadow-[0_10px_20px_-18px_rgba(10,35,66,0.5)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-bold">등록 매물 관리</h2><p className="mt-1 text-sm text-[#0A2342]/55">홈페이지와 동일한 주소·매물유형 보정 기준으로 표시합니다.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_145px_145px_145px_auto] xl:items-end">
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-[#0A2342]/60">검색</span><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="매물명·지역·가격 검색" className="rounded-2xl border px-4 py-3 text-sm"/></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-[#0A2342]/60">매물유형</span><select value={propertyType} onChange={e=>setPropertyType(e.target.value)} className="rounded-2xl border bg-white px-4 py-3">{propertyTypes.map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-[#0A2342]/60">거래유형</span><select value={dealType} onChange={e=>setDealType(e.target.value)} className="rounded-2xl border bg-white px-4 py-3">{dealTypes.map(v=><option key={v}>{v}</option>)}</select></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-[#0A2342]/60">노출상태</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="rounded-2xl border bg-white px-4 py-3">{[ALL,"노출중","추천","숨김","계약완료"].map(v=><option key={v}>{v}</option>)}</select></label>
              <button onClick={reset} className="rounded-2xl border px-4 py-3 font-semibold">필터 초기화</button>
            </div>
          </div>
        </div>
        {loading ? <p className="py-16 text-center">매물을 불러오는 중입니다...</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[1180px]"><thead className="bg-[#F8F9FB]"><tr>{["번호","매물명","유형","지역·가격","상태","빠른 관리","상세 관리"].map(v=><th key={v} className="px-4 py-4 text-left">{v}</th>)}</tr></thead><tbody>
          {filtered.map(p => { const completed=p.listing_status==="completed"; const busy=busyId===p.id; return <tr key={p.id} className="border-t align-top text-sm"><td className="px-4 py-4">{p.id}</td><td className="px-4 py-4 font-semibold">{p.title}</td><td className="px-4 py-4">{p.type || "-"} <span className="text-[#0A2342]/50">{p.deal_type}</span></td><td className="px-4 py-4"><p>{p.location || "-"}</p><p className="mt-1 font-semibold text-[#9B7900]">{p.price || "문의"}</p></td><td className="px-4 py-4">{p.is_hidden ? "숨김" : completed ? "계약완료" : "노출중"}{p.is_featured ? " · 추천" : ""}</td><td className="px-4 py-4"><div className="flex gap-2"><button disabled={busy} onClick={()=>void updateField(p,{is_featured:!p.is_featured})} className="rounded-full border px-3 py-2">추천</button><button disabled={busy} onClick={()=>void updateField(p,{is_hidden:!p.is_hidden})} className="rounded-full border px-3 py-2">숨김</button><button disabled={busy} onClick={()=>void updateField(p,{listing_status:completed?"active":"completed"})} className="rounded-full border px-3 py-2">계약완료</button></div></td><td className="px-4 py-4"><div className="flex gap-2"><Link href={`/admin/properties/${p.id}`} className="rounded-full border px-4 py-2">보기</Link><Link href={`/admin/properties/${p.id}/edit`} className="rounded-full border px-4 py-2">수정</Link><button onClick={()=>void handleDelete(p.id)} className="rounded-full border border-red-300 px-4 py-2 text-red-600">삭제</button></div></td></tr> })}
        </tbody></table></div>}
      </section>
    </div>
  </main>;
}
