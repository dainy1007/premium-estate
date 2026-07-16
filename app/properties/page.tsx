"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Property } from "@/types/property";

const ALL = "전체";

const PRICE_OPTIONS = [
  { label: "제한 없음", value: "" },
  { label: "5천만원", value: "50000000" },
  { label: "1억원", value: "100000000" },
  { label: "2억원", value: "200000000" },
  { label: "3억원", value: "300000000" },
  { label: "5억원", value: "500000000" },
  { label: "10억원", value: "1000000000" },
  { label: "20억원", value: "2000000000" },
  { label: "50억원", value: "5000000000" },
];

type SortOption = "최신순" | "오래된순" | "이름순" | "낮은가격순" | "높은가격순";

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
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  useEffect(() => {
    async function getProperties() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("매물 목록 불러오기 오류:", error);
        setErrorMessage("매물 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setLoading(false);
        return;
      }

      setProperties((data || []) as Property[]);
      setLoading(false);
    }

    getProperties();
  }, []);

  const propertyTypes = useMemo(
    () => [ALL, ...Array.from(new Set(properties.map((item) => item.type).filter(Boolean) as string[]))],
    [properties]
  );

  const dealTypes = useMemo(
    () => [ALL, ...Array.from(new Set(properties.map((item) => item.deal_type).filter(Boolean) as string[]))],
    [properties]
  );

  const locations = useMemo(
    () => [ALL, ...Array.from(new Set(properties.map((item) => item.location).filter(Boolean)))],
    [properties]
  );

  const filteredProperties = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const minimum = minPrice ? Number(minPrice) : null;
    const maximum = maxPrice ? Number(maxPrice) : null;

    const result = properties.filter((property) => {
      const searchableText = [
        property.title,
        property.location,
        property.address,
        property.description,
        property.price,
        property.type,
        property.deal_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword);
      const matchesPropertyType = propertyType === ALL || property.type === propertyType;
      const matchesDealType = dealType === ALL || property.deal_type === dealType;
      const matchesLocation = location === ALL || property.location === location;
      const hasPriceFilter = minimum !== null || maximum !== null;
      const amount = property.price_amount;
      const matchesMinimum = minimum === null || (amount != null && amount >= minimum);
      const matchesMaximum = maximum === null || (amount != null && amount <= maximum);
      const matchesPrice = !hasPriceFilter || (amount != null && matchesMinimum && matchesMaximum);

      return matchesKeyword && matchesPropertyType && matchesDealType && matchesLocation && matchesPrice;
    });

    return [...result].sort((a, b) => {
      if (sortOption === "이름순") {
        return a.title.localeCompare(b.title, "ko");
      }

      if (sortOption === "낮은가격순" || sortOption === "높은가격순") {
        const aPrice = a.price_amount ?? Number.MAX_SAFE_INTEGER;
        const bPrice = b.price_amount ?? Number.MAX_SAFE_INTEGER;

        if (sortOption === "낮은가격순") return aPrice - bPrice;

        const highA = a.price_amount ?? -1;
        const highB = b.price_amount ?? -1;
        return highB - highA;
      }

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

      return sortOption === "오래된순" ? aTime - bTime : bTime - aTime;
    });
  }, [properties, keyword, propertyType, dealType, location, minPrice, maxPrice, sortOption]);

  const resetFilters = () => {
    setKeyword("");
    setPropertyType(ALL);
    setDealType(ALL);
    setLocation(ALL);
    setMinPrice("");
    setMaxPrice("");
    setSortOption("최신순");
  };

  return (
    <main className="min-h-screen bg-[#F8F9FB] text-[#0A2342]">
      <section className="bg-[#0A2342] px-6 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm font-semibold text-[#C9A227] hover:underline">
            ← 홈으로
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">
            Property Search
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">매물 검색</h1>
          <p className="mt-4 max-w-2xl text-white/75">
            원하는 조건을 선택해 백조현대부동산중개의 등록 매물을 빠르게 찾아보세요.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[28px] border border-[#0A2342]/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold">검색어</label>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="매물명, 주소, 지역, 설명 검색"
                className="w-full rounded-2xl border border-[#0A2342]/15 px-4 py-3 outline-none transition focus:border-[#C9A227]"
              />
            </div>

            <FilterSelect label="매물유형" value={propertyType} options={propertyTypes} onChange={setPropertyType} />
            <FilterSelect label="거래유형" value={dealType} options={dealTypes} onChange={setDealType} />
            <FilterSelect label="지역" value={location} options={locations} onChange={setLocation} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <PriceSelect label="최저가격" value={minPrice} onChange={setMinPrice} />
            <PriceSelect label="최고가격" value={maxPrice} onChange={setMaxPrice} />
          </div>

          {minPrice && maxPrice && Number(minPrice) > Number(maxPrice) && (
            <p className="mt-3 text-sm font-medium text-red-600">최저가격은 최고가격보다 낮아야 합니다.</p>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-[#0A2342]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#0A2342]/65">
              전체 {properties.length}개 중 <strong className="text-[#0A2342]">{filteredProperties.length}개</strong> 매물
            </p>
            <div className="flex flex-wrap gap-3">
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm outline-none focus:border-[#C9A227]"
              >
                <option>최신순</option>
                <option>오래된순</option>
                <option>이름순</option>
                <option>낮은가격순</option>
                <option>높은가격순</option>
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
              >
                조건 초기화
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="py-20 text-center text-[#0A2342]/60">매물을 불러오는 중입니다...</p>}

        {!loading && errorMessage && (
          <div className="my-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && filteredProperties.length === 0 && (
          <div className="my-10 rounded-[28px] border border-dashed border-[#0A2342]/20 bg-white p-12 text-center">
            <p className="text-lg font-semibold">조건에 맞는 매물이 없습니다.</p>
            <button onClick={resetFilters} className="mt-4 font-semibold text-[#C9A227] hover:underline">
              검색 조건 초기화
            </button>
          </div>
        )}

        {!loading && !errorMessage && filteredProperties.length > 0 && (
          <div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.map((property) => {
              const orderedImages = [...(property.property_images || [])].sort(
                (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order
              );
              const coverImage = orderedImages[0]?.image_url || property.image_url;

              return (
                <article key={property.id} className="overflow-hidden rounded-[24px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <Link href={`/properties/${property.id}`}>
                    {coverImage ? (
                      <img src={coverImage} alt={property.title} className="h-60 w-full object-cover" />
                    ) : (
                      <div className="flex h-60 items-center justify-center bg-[#EEF1F5] text-[#0A2342]/45">
                        이미지 준비중
                      </div>
                    )}
                  </Link>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {property.type && <Badge>{property.type}</Badge>}
                      {property.deal_type && <Badge>{property.deal_type}</Badge>}
                    </div>
                    <h2 className="mt-4 text-xl font-bold">{property.title}</h2>
                    <p className="mt-2 line-clamp-1 text-sm text-[#0A2342]/65">
                      {property.address || property.location}
                    </p>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#0A2342]/55">면적 {property.area || "문의"}</p>
                        <p className="mt-1 text-lg font-bold text-[#C9A227]">{property.price || "가격 문의"}</p>
                      </div>
                      <Link
                        href={`/properties/${property.id}`}
                        className="rounded-full bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#12385f]"
                      >
                        상세보기
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 outline-none transition focus:border-[#C9A227]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function PriceSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 outline-none transition focus:border-[#C9A227]"
      >
        {PRICE_OPTIONS.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#C9A227]/15 px-3 py-1 text-xs font-semibold text-[#8C6E00]">{children}</span>;
}
