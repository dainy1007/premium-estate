"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPropertyPriceDisplay, parsePropertyPriceAmount } from "@/lib/property-price";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";

const ALL = "전체";
const ITEMS_PER_PAGE = 9;
const SEARCH_STATE_KEY = "baekjo-property-search-state-v1";
const PRICE_OPTIONS = [
  ["제한 없음", ""], ["5천만원", "50000000"], ["1억원", "100000000"],
  ["2억원", "200000000"], ["3억원", "300000000"], ["5억원", "500000000"],
  ["10억원", "1000000000"], ["20억원", "2000000000"], ["50억원", "5000000000"],
] as const;

type SortOption = "추천순" | "최신순" | "오래된순" | "이름순" | "낮은가격순" | "높은가격순";
type SavedSearchState = { keyword:string; propertyType:string; dealType:string; location:string; minPrice:string; maxPrice:string; featuredOnly:boolean; sortOption:SortOption; currentPage:number; scrollY:number };

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState(ALL);
  const [dealType, setDealType] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("추천순");
  const [currentPage, setCurrentPage] = useState(1);
  const skipResetRef = useRef(true);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedSearchState>;
        setKeyword(String(saved.keyword || ""));
        setPropertyType(String(saved.propertyType || ALL));
        setDealType(String(saved.dealType || ALL));
        setLocation(String(saved.location || ALL));
        setMinPrice(String(saved.minPrice || ""));
        setMaxPrice(String(saved.maxPrice || ""));
        setFeaturedOnly(Boolean(saved.featuredOnly));
        setSortOption((saved.sortOption || "추천순") as SortOption);
        setCurrentPage(Math.max(1, Number(saved.currentPage || 1)));
        restoreScrollRef.current = Math.max(0, Number(saved.scrollY || 0));
      }
    } catch (error) { console.warn("검색 상태 복원 경고:", error); }
    window.setTimeout(() => { skipResetRef.current = false; }, 0);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from("properties").select("*, property_images(*)").order("created_at", { ascending: false });
      if (error) {
        console.error("매물 목록 불러오기 오류:", error);
        setErrorMessage("매물 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setProperties(((data || []) as Property[]).filter((item) => item.is_hidden !== true));
      }
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    if (!loading && restoreScrollRef.current !== null) {
      const y = restoreScrollRef.current;
      restoreScrollRef.current = null;
      window.setTimeout(() => window.scrollTo({ top:y, behavior:"auto" }), 0);
    }
  }, [loading]);

  useEffect(() => { if (skipResetRef.current) return; setCurrentPage(1); }, [keyword, propertyType, dealType, location, minPrice, maxPrice, featuredOnly, sortOption]);

  useEffect(() => {
    if (skipResetRef.current) return;
    const state:SavedSearchState = { keyword, propertyType, dealType, location, minPrice, maxPrice, featuredOnly, sortOption, currentPage, scrollY:window.scrollY };
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  }, [keyword, propertyType, dealType, location, minPrice, maxPrice, featuredOnly, sortOption, currentPage]);

  const propertyTypes = useMemo(() => [ALL, ...Array.from(new Set(properties.map((v) => v.type).filter(Boolean) as string[]))], [properties]);
  const dealTypes = useMemo(() => [ALL, ...Array.from(new Set(properties.map((v) => v.deal_type).filter(Boolean) as string[]))], [properties]);
  const locations = useMemo(() => [ALL, ...Array.from(new Set(properties.map((v) => v.location).filter(Boolean)))], [properties]);

  const filteredProperties = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const minimum = minPrice ? Number(minPrice) : null;
    const maximum = maxPrice ? Number(maxPrice) : null;
    const filtered = properties.filter((property) => {
      const searchable = [property.title, property.location, property.address, property.description, property.price, property.type, property.deal_type].filter(Boolean).join(" ").toLowerCase();
      const amount = property.price_amount ?? parsePropertyPriceAmount(property.price);
      return (!query || searchable.includes(query))
        && (propertyType === ALL || property.type === propertyType)
        && (dealType === ALL || property.deal_type === dealType)
        && (location === ALL || property.location === location)
        && (!featuredOnly || property.is_featured === true)
        && (minimum === null || (amount != null && amount >= minimum))
        && (maximum === null || (amount != null && amount <= maximum));
    });
    return [...filtered].sort((a, b) => {
      if (sortOption === "추천순") { const featured = Number(b.is_featured) - Number(a.is_featured); if (featured !== 0) return featured; const order = (a.display_order ?? 0) - (b.display_order ?? 0); if (order !== 0) return order; }
      if (sortOption === "이름순") return a.title.localeCompare(b.title, "ko");
      if (sortOption === "낮은가격순" || sortOption === "높은가격순") { const aa = a.price_amount ?? parsePropertyPriceAmount(a.price); const bb = b.price_amount ?? parsePropertyPriceAmount(b.price); return sortOption === "낮은가격순" ? (aa ?? Number.MAX_SAFE_INTEGER) - (bb ?? Number.MAX_SAFE_INTEGER) : (bb ?? -1) - (aa ?? -1); }
      const at = a.created_at ? new Date(a.created_at).getTime() : 0; const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOption === "오래된순" ? at - bt : bt - at;
    });
  }, [properties, keyword, propertyType, dealType, location, minPrice, maxPrice, featuredOnly, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredProperties.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const pages = useMemo(() => { const end = Math.min(totalPages, Math.max(5, safePage + 2)); const start = Math.max(1, end - 4); return Array.from({ length: end - start + 1 }, (_, i) => start + i); }, [safePage, totalPages]);

  function saveSearchPosition() { const state:SavedSearchState = { keyword, propertyType, dealType, location, minPrice, maxPrice, featuredOnly, sortOption, currentPage:safePage, scrollY:window.scrollY }; sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state)); }
  function resetFilters() { setKeyword(""); setPropertyType(ALL); setDealType(ALL); setLocation(ALL); setMinPrice(""); setMaxPrice(""); setFeaturedOnly(false); setSortOption("추천순"); setCurrentPage(1); sessionStorage.removeItem(SEARCH_STATE_KEY); }
  function moveToPage(page: number) { setCurrentPage(Math.min(Math.max(page, 1), totalPages)); window.scrollTo({ top: 420, behavior: "smooth" }); }

  return <main className="min-h-screen bg-[#F8F9FB] text-[#0A2342]">
    <section className="bg-[#0A2342] px-6 pb-16 pt-28 text-white"><div className="mx-auto max-w-7xl"><Link href="/" className="text-sm font-semibold text-[#C9A227] hover:underline">← 홈으로</Link><p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">Property Search</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">매물 검색</h1><p className="mt-4 max-w-2xl text-white/75">원하는 조건을 선택해 등록 매물을 빠르게 찾아보세요.</p></div></section>
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="z-30 rounded-[28px] border border-[#0A2342]/10 bg-white p-5 shadow-sm sm:p-7 md:sticky md:top-4 md:shadow-[0_12px_30px_-20px_rgba(10,35,66,0.55)]">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <Field label="검색어"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="매물명, 주소, 지역, 설명 검색" className="input" /></Field>
          <SelectField label="매물유형" value={propertyType} options={propertyTypes} onChange={setPropertyType} />
          <SelectField label="거래유형" value={dealType} options={dealTypes} onChange={setDealType} />
          <SelectField label="지역" value={location} options={locations} onChange={setLocation} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:max-w-2xl"><PriceField label="최저가격" value={minPrice} onChange={setMinPrice} /><PriceField label="최고가격" value={maxPrice} onChange={setMaxPrice} /></div>
        <div className="mt-5 flex flex-col gap-3 border-t border-[#0A2342]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#0A2342]/65">공개 매물 {properties.length}개 중 <strong>{filteredProperties.length}개</strong></p>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setFeaturedOnly((v) => !v)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${featuredOnly ? "border-[#C9A227] bg-[#C9A227]/15" : "border-[#0A2342]/15"}`}>추천만 보기</button><select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm">{(["추천순", "최신순", "오래된순", "이름순", "낮은가격순", "높은가격순"] as SortOption[]).map((v) => <option key={v}>{v}</option>)}</select><button type="button" onClick={resetFilters} className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold">조건 초기화</button></div>
        </div>
      </div>
      {loading && <p className="py-20 text-center text-[#0A2342]/60">매물을 불러오는 중입니다...</p>}
      {!loading && errorMessage && <div className="my-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{errorMessage}</div>}
      {!loading && !errorMessage && filteredProperties.length === 0 && <div className="my-10 rounded-[28px] border border-dashed border-[#0A2342]/20 bg-white p-12 text-center"><p className="text-lg font-semibold">조건에 맞는 매물이 없습니다.</p></div>}
      {!loading && !errorMessage && pageItems.length > 0 && <><div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{pageItems.map((property) => { const images = [...(property.property_images || [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order); const cover = images[0]?.image_url || property.image_url; const completed = property.listing_status === "completed"; return <article key={property.id} className="overflow-hidden rounded-[24px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Link href={`/properties/${property.id}`} onClick={saveSearchPosition} className="relative block">{cover ? <img src={cover} alt={property.title} className={`h-60 w-full object-cover ${completed ? "grayscale-[35%]" : ""}`} /> : <div className="flex h-60 w-full items-center justify-center bg-[#EEF1F5]">이미지 준비중</div>}<div className="absolute left-4 top-4 flex flex-wrap gap-2">{property.is_featured && <Badge>추천</Badge>}{completed && <StatusBadge>계약완료</StatusBadge>}</div></Link><div className="p-6"><div className="flex flex-wrap gap-2">{property.type && <Badge>{property.type}</Badge>}{property.deal_type && <Badge>{property.deal_type}</Badge>}</div><h2 className="mt-4 text-xl font-bold">{property.title}</h2><p className="mt-2 line-clamp-1 text-sm text-[#0A2342]/65">{property.address || property.location}</p><div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-sm text-[#0A2342]/55">면적 {property.area || "문의"}</p><p className="mt-1 text-lg font-bold text-[#C9A227]">{completed ? "계약완료" : formatPropertyPriceDisplay(property.price)}</p></div><Link href={`/properties/${property.id}`} onClick={saveSearchPosition} className="rounded-full bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white">상세보기</Link></div></div></article>; })}</div>{totalPages > 1 && <nav className="mt-12 flex flex-wrap items-center justify-center gap-2"><PageButton disabled={safePage === 1} onClick={() => moveToPage(safePage - 1)}>이전</PageButton>{pages.map((p) => <button key={p} onClick={() => moveToPage(p)} className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold ${p === safePage ? "bg-[#0A2342] text-white" : "border border-[#0A2342]/15 bg-white"}`}>{p}</button>)}<PageButton disabled={safePage === totalPages} onClick={() => moveToPage(safePage + 1)}>다음</PageButton></nav>}</>}
    </section>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-semibold">{label}</label>{children}</div>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) { return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} className="input">{options.map((v) => <option key={v}>{v}</option>)}</select></Field>; }
function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} className="input">{PRICE_OPTIONS.map(([text, val]) => <option key={`${label}-${val}`} value={val}>{text}</option>)}</select></Field>; }
function PageButton({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) { return <button disabled={disabled} onClick={onClick} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-35">{children}</button>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0A2342] shadow-sm">{children}</span>; }
function StatusBadge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">{children}</span>; }
