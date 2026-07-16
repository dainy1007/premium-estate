"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { PropertyImage } from "@/types/property";

type Property = {
  id: number;
  title: string;
  price: string;
  location: string;
  address?: string;
  area: string;
  description: string;
  image_url?: string;
  deal_type?: string;
  property_images?: PropertyImage[];
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProperty() {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("상세보기 오류:", error);
        setLoading(false);
        return;
      }

      setProperty(data);
      setLoading(false);
    }

    if (!Number.isNaN(id)) {
      getProperty();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>매물 정보를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>매물을 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{property.title}</h1>

          <Link
            href="/"
            className="rounded-full border px-5 py-3 hover:bg-gray-100"
          >
            목록으로
          </Link>
        </div>

        {(property.property_images?.length || property.image_url) && (
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {(property.property_images?.length
              ? [...property.property_images].sort((a, b) => a.display_order - b.display_order)
              : [{ id: 0, image_url: property.image_url, alt_text: property.title }]
            ).map((image, index) => (
              <div key={image.id} className="relative overflow-hidden rounded-2xl">
                <img
                  src={image.image_url || ""}
                  alt={image.alt_text || property.title}
                  className="h-40 w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-[#C9A227] px-2 py-1 text-xs font-bold text-[#0A2342]">대표</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <p>
            <strong>거래유형 :</strong> {property.deal_type || "-"}
          </p>

          <p>
            <strong>지역 :</strong> {property.location}
          </p>

          <p>
            <strong>주소 :</strong> {property.address || "-"}
          </p>

          <p>
            <strong>가격 :</strong> {property.price}
          </p>

          <p>
            <strong>면적 :</strong> {property.area}
          </p>

          <div>
            <strong>설명</strong>
            <div className="mt-2 rounded-xl bg-[#F8F9FB] p-5 whitespace-pre-line">
              {property.description}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="rounded-full bg-[#C9A227] px-6 py-3 font-semibold text-[#0A2342]"
          >
            수정하기
          </Link>

          <Link
            href="/"
            className="rounded-full border px-6 py-3"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}