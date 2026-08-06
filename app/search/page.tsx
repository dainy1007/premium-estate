"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";

export default function PropertySearchPage() {
  const searchParams = useSearchParams();
  const keyword = (searchParams.get("q") || "").trim();
  const type = (searchParams.get("type") || "").trim();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("매물 검색 오류:", error);
        setErrorMessage("매물 검색 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      setProperties((data || []) as Property[]);
      setLoading(false);
    }

    loadProperties();
  }, []);

  const results = useMemo(() => {
    const normalizedKeyword = keyword.toLowerCase();
    const typeTerms = type ? type.split("·") : [];

    return properties.filter((property) => {
      const searchable = [
        property.title,
        property.location,
        property.address,
        property.description,
        property.type,
        property.deal_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const keywordMatches = !normalizedKeyword || searchable.includes(normalizedKeyword);
      const typeMatches =
        typeTerms.length === 0 ||
        typeTerms.some((term) => searchable.includes(term.toLowerCase()));

      return keywordMatches && typeMatches;
    });
  }, [keyword, properties, type]);

  return (
    <main className="min-h-screen bg-[#F8F9FB] text-[#0A2342]">
      <section className="bg-[#0A2342] px-6 pb-14 pt-24 text-white">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm font-semibold text-[#C9A227] hover:underline">
            ← 홈으로
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">
            Property Search
          </p>
          <h1 className="mt-3 text-4xl font-bold">매물 검색 결과</h1>
          <p className="mt-4 text-white/70">
            {keyword && `검색어 “${keyword}”`}
            {keyword && type && " · "}
            {type && `유형 “${type}”`}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#0A2342]/65">
            총 <strong className="text-[#0A2342]">{results.length}개</strong> 매물
          </p>
          <Link
            href="/properties"
            className="w-fit rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            상세 조건으로 다시 검색
          </Link>
        </div>

        {loading && <p className="py-20 text-center text-[#0A2342]/55">매물을 검색하는 중입니다...</p>}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && results.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-[#0A2342]/20 bg-white p-12 text-center">
            <p className="text-lg font-semibold">조건에 맞는 매물이 없습니다.</p>
            <Link href="/properties" className="mt-4 inline-block font-semibold text-[#C9A227] hover:underline">
              전체 매물 보기
            </Link>
          </div>
        )}

        {!loading && !errorMessage && results.length > 0 && (
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {results.map((property) => {
              const orderedImages = [...(property.property_images || [])].sort(
                (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order
              );
              const coverImage = orderedImages[0]?.image_url || property.image_url;

              return (
                <article
                  key={property.id}
                  className="overflow-hidden rounded-[24px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
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
                      {property.type && <span className="rounded-full bg-[#C9A227]/15 px-3 py-1 text-xs font-semibold text-[#8C6E00]">{property.type}</span>}
                      {property.deal_type && <span className="rounded-full bg-[#C9A227]/15 px-3 py-1 text-xs font-semibold text-[#8C6E00]">{property.deal_type}</span>}
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
