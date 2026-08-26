"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizePropertyForDisplay } from "@/lib/property-normalize";
import type { Property } from "@/types/property";

const ITEMS_PER_PAGE = 9;

const TYPE_GROUPS: Record<string, string[]> = {
  소형주택: ["원룸", "미니투룸", "투룸"],
  주택: ["쓰리룸", "단독주택", "상가주택", "다가구"],
  상가: ["상가"],
  "창고·공장": ["창고", "공장"],
};

function withSquareMeter(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/㎡|m²|m2|평/i.test(text)) return text;
  return /^\d+(?:\.\d+)?$/.test(text.replace(/,/g, "")) ? `${text}㎡` : text;
}

function formatCardArea(property: Property) {
  const contract = withSquareMeter(property.contract_area);
  const exclusive = withSquareMeter(property.exclusive_area);
  if (contract && exclusive) return `계약 ${contract} / 전용 ${exclusive}`;
  if (contract) return `계약 ${contract}`;
  if (exclusive) return `전용 ${exclusive}`;
  return withSquareMeter(property.area);
}

function formatCardPrice(property: Property) {
  const raw = String(property.price || "").replace(/,\s+/g, ",").trim();
  if (!raw) return "가격 문의";
  if (/만원|억원|원\b/.test(raw)) return raw;
  const deal = String(property.deal_type || "").trim();
  if (deal === "월세") {
    const parts = raw.split("/").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) return `보증금 ${parts[0]}만원 / 월세 ${parts[1]}만원`;
  }
  if (deal === "전세") return `전세가 ${raw}만원`;
  if (deal === "매매") return `매매가 ${raw}만원`;
  return raw;
}

export default function PropertySearchPage() {
  return <Suspense fallback={<SearchPageLoading />}><PropertySearchContent /></Suspense>;
}

function SearchPageLoading() {
  return <main className="min-h-screen bg-[#F8F9FB] text-[#0A2342]"><section className="bg-[#0A2342] px-6 pb-14 pt-24 text-white"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">Property Search</p><h1 className="mt-3 text-4xl font-bold">매물 검색 결과</h1></div></section><p className="py-20 text-center text-[#0A2342]/55">검색 화면을 준비하는 중입니다...</p></main>;
}

function PropertySearchContent() {
  const searchParams = useSearchParams();
  const keyword = (searchParams.get("q") || "").trim();
  const type = (searchParams.get("type") || "").trim();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [dealType, setDealType] = useState("전체");
  const [sortOption, setSortOption] = useState("최신순");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { async function loadProperties() { setLoading(true); setErrorMessage(""); const { data, error } = await supabase.from("properties").select("*, property_images(*)").order("created_at", { ascending: false }); if (error) { console.error("매물 검색 오류:", error); setErrorMessage("매물 검색 중 오류가 발생했습니다."); } else { setProperties(((data || []) as Property[]).filter((property) => property.is_hidden !== true).map(normalizePropertyForDisplay)); } setLoading(false); } loadProperties(); }, []);
  useEffect(() => { setCurrentPage(1); }, [dealType, featuredOnly, keyword, sortOption, type]);

  const dealTypes = useMemo(() => ["전체", ...Array.from(new Set(properties.map((item) => item.deal_type).filter(Boolean) as string[]))], [properties]);
  const results = useMemo(() => { const normalizedKeyword = keyword.toLowerCase(); const allowedTypes = TYPE_GROUPS[type] || (type ? [type] : []); const filtered = properties.filter((property) => { const searchable = [property.title, property.location, property.address, property.description, property.type, property.deal_type].filter(Boolean).join(" ").toLowerCase(); const propertyType = String(property.type || "").trim(); const typeMatches = allowedTypes.length === 0 || allowedTypes.includes(propertyType); return (!normalizedKeyword || searchable.includes(normalizedKeyword)) && typeMatches && (dealType === "전체" || property.deal_type === dealType) && (!featuredOnly || property.is_featured === true); }); return [...filtered].sort((a, b) => { if (sortOption === "이름순") return a.title.localeCompare(b.title, "ko"); const aTime = a.created_at ? new Date(a.created_at).getTime() : 0; const bTime = b.created_at ? new Date(b.created_at).getTime() : 0; if (sortOption === "오래된순") return aTime - bTime; const featuredDifference = Number(b.is_featured) - Number(a.is_featured); if (featuredDifference !== 0) return featuredDifference; const orderDifference = (a.display_order ?? 0) - (b.display_order ?? 0); if (orderDifference !== 0) return orderDifference; return bTime - aTime; }); }, [dealType, featuredOnly, keyword, properties, sortOption, type]);

  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE)); const safePage = Math.min(currentPage, totalPages); const pageStart = (safePage - 1) * ITEMS_PER_PAGE; const paginatedResults = results.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const moveToPage = (page: number) => { setCurrentPage(Math.min(Math.max(page, 1), totalPages)); window.scrollTo({ top: 360, behavior: "smooth" }); };
  const resetLocalFilters = () => { setDealType("전체"); setSortOption("최신순"); setFeaturedOnly(false); setCurrentPage(1); };

  return <main className="min-h-screen bg-[#F8F9FB] text-[#0A2342]">
    <section className="bg-[#0A2342] px-6 pb-14 pt-24 text-white"><div className="mx-auto max-w-7xl"><Link href="/" className="text-sm font-semibold text-[#C9A227] hover:underline">← 홈으로</Link><p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">Property Search</p><h1 className="mt-3 text-4xl font-bold">매물 검색 결과</h1><p className="mt-4 text-white/70">{keyword && `검색어 “${keyword}”`}{keyword && type && " · "}{type && `유형 “${type}”`}</p></div></section>
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 rounded-[24px] border border-[#0A2342]/10 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><p className="text-sm text-[#0A2342]/65">총 <strong className="text-[#0A2342]">{results.length}개</strong> 매물{results.length > 0 && <span className="ml-2 text-[#0A2342]/45">· {pageStart + 1}-{Math.min(pageStart + ITEMS_PER_PAGE, results.length)}번째 표시</span>}</p><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><select value={dealType} onChange={(e) => setDealType(e.target.value)} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm">{dealTypes.map((item) => <option key={item}>{item}</option>)}</select><select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm"><option>최신순</option><option>오래된순</option><option>이름순</option></select><label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm font-semibold"><input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />추천만 보기</label><button type="button" onClick={resetLocalFilters} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm font-semibold">조건 초기화</button><Link href="/properties" className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-center text-sm font-semibold">상세 조건 검색</Link></div></div></div>
      {loading && <p className="py-20 text-center text-[#0A2342]/55">매물을 검색하는 중입니다...</p>}
      {!loading && errorMessage && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{errorMessage}</div>}
      {!loading && !errorMessage && results.length === 0 && <div className="rounded-[28px] border border-dashed border-[#0A2342]/20 bg-white p-12 text-center"><p className="text-lg font-semibold">조건에 맞는 매물이 없습니다.</p><Link href="/properties" className="mt-4 inline-block font-semibold text-[#C9A227]">전체 매물 보기</Link></div>}
      {!loading && !errorMessage && paginatedResults.length > 0 && <><div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">{paginatedResults.map((property) => { const orderedImages = [...(property.property_images || [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order); const coverImage = orderedImages[0]?.image_url || property.image_url; const completed = property.listing_status === "completed"; const areaText = formatCardArea(property); return <article key={property.id} className="overflow-hidden rounded-[24px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Link href={`/properties/${property.id}`} className="relative block">{coverImage ? <img src={coverImage} alt={property.title} className={`h-60 w-full object-cover ${completed ? "grayscale-[35%]" : ""}`} /> : <div className="flex h-60 items-center justify-center bg-[#EEF1F5] text-[#0A2342]/45">이미지 준비중</div>}<div className="absolute left-4 top-4 flex flex-wrap gap-2">{property.is_featured && <StatusBadge className="bg-[#C9A227] text-[#0A2342]">추천</StatusBadge>}{completed && <StatusBadge className="bg-red-600 text-white">계약완료</StatusBadge>}</div></Link><div className="p-6"><div className="flex flex-wrap gap-2">{property.type && <Badge>{property.type}</Badge>}{property.deal_type && <Badge>{property.deal_type}</Badge>}</div><h2 className="mt-4 text-xl font-bold">{property.title}</h2><p className="mt-2 line-clamp-1 text-sm text-[#0A2342]/65">{property.address || property.location}</p><div className="mt-4 flex items-end justify-between gap-4"><div>{areaText && <p className="text-sm text-[#0A2342]/55">면적 {areaText}</p>}<p className={`${areaText ? "mt-1 " : ""}text-lg font-bold text-[#C9A227]`}>{completed ? "계약완료" : formatCardPrice(property)}</p></div><Link href={`/properties/${property.id}`} className="rounded-full bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white">상세보기</Link></div></div></article>; })}</div>{totalPages > 1 && <nav className="mt-12 flex flex-wrap items-center justify-center gap-2"><PageButton disabled={safePage === 1} onClick={() => moveToPage(safePage - 1)}>이전</PageButton>{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => <button key={page} type="button" onClick={() => moveToPage(page)} className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold ${page === safePage ? "bg-[#0A2342] text-white" : "border border-[#0A2342]/15 bg-white"}`}>{page}</button>)}<PageButton disabled={safePage === totalPages} onClick={() => moveToPage(safePage + 1)}>다음</PageButton></nav>}</>}
    </section>
  </main>;
}

function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-[#C9A227]/15 px-3 py-1 text-xs font-semibold text-[#8C6E00]">{children}</span>; }
function StatusBadge({ children, className }: { children: React.ReactNode; className: string }) { return <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${className}`}>{children}</span>; }
function PageButton({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) { return <button type="button" disabled={disabled} onClick={onClick} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-35">{children}</button>; }
