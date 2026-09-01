"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { normalizePropertyForDisplay } from "@/lib/property-normalize";
import { formatPropertyPriceDisplay } from "@/lib/property-price";
import { Property } from "@/types/property";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function getProperties() {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*)")
        .order("created_at", { ascending: false })
        .limit(24);

      if (error) {
        console.error("매물 불러오기 오류:", error);
        setErrorMessage("매물을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      const visibleProperties = ((data || []) as Property[])
        .filter((property) => property.is_hidden !== true)
        .map(normalizePropertyForDisplay)
        .sort((a, b) => {
          const featuredDifference = Number(b.is_featured) - Number(a.is_featured);
          if (featuredDifference !== 0) return featuredDifference;

          const orderDifference = (a.display_order ?? 0) - (b.display_order ?? 0);
          if (orderDifference !== 0) return orderDifference;

          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 6);

      setProperties(visibleProperties);
      setLoading(false);
    }

    getProperties();
  }, []);

  return (
    <section id="featured-properties" className="bg-[#F8F9FB] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">
              Featured Properties
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#0A2342] sm:text-4xl">추천·최근 매물</h2>
            <p className="mt-3 text-[#0A2342]/65">추천 매물을 먼저, 이후 최근 등록 순으로 안내합니다.</p>
          </div>
          <Link
            href="/properties"
            className="inline-flex w-fit items-center justify-center rounded-full border border-[#0A2342]/15 bg-white px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            전체 매물 보기 →
          </Link>
        </div>

        {loading && (
          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-[26px] bg-white shadow-sm">
                <div className="h-60 bg-[#E7EAF0]" />
                <div className="space-y-4 p-6">
                  <div className="h-4 w-1/3 rounded bg-[#E7EAF0]" />
                  <div className="h-6 w-4/5 rounded bg-[#E7EAF0]" />
                  <div className="h-4 w-1/2 rounded bg-[#E7EAF0]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && properties.length > 0 && (
          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => {
              const images = [...(property.property_images || [])].sort(
                (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order
              );
              const coverImage = images[0]?.image_url || property.image_url;
              const isCompleted = property.listing_status === "completed";

              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group overflow-hidden rounded-[26px] border border-[#0A2342]/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-[#EEF1F5]">
                    <div className="absolute inset-0 flex items-center justify-center text-[#0A2342]/45">
                      이미지 준비중
                    </div>
                    {coverImage && (
                      <img
                        src={coverImage}
                        alt={property.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${isCompleted ? "grayscale-[35%]" : ""}`}
                      />
                    )}
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {property.is_featured && <Badge>추천</Badge>}
                      {isCompleted && <StatusBadge>계약완료</StatusBadge>}
                      {property.type && <Badge>{property.type}</Badge>}
                      {property.deal_type && <Badge>{property.deal_type}</Badge>}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="line-clamp-2 text-xl font-bold text-[#0A2342]">{property.title}</h3>
                    <p className="mt-2 line-clamp-1 text-sm text-[#0A2342]/60">
                      {property.location || "지역 문의"}
                    </p>
                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#0A2342]/10 pt-5">
                      <div>
                        <p className="text-sm text-[#0A2342]/55">면적 {property.area || "문의"}</p>
                        <p className="mt-1 text-lg font-bold text-[#C9A227]">
                          {isCompleted ? "계약완료" : formatPropertyPriceDisplay(property.price)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#0A2342] transition group-hover:text-[#C9A227]">
                        상세보기 →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && !errorMessage && properties.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-[#0A2342]/20 bg-white p-12 text-center text-[#0A2342]/60">
            공개 중인 매물이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0A2342] shadow-sm backdrop-blur-sm">
      {children}
    </span>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
      {children}
    </span>
  );
}
