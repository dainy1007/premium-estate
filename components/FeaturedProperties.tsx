"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Property } from "@/types/property";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProperties() {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("매물 불러오기 오류:", error);
        setLoading(false);
        return;
      }

      setProperties(data || []);
      setLoading(false);
    }

    getProperties();
  }, []);

  if (loading) {
    return (
      <section className="py-20 text-center">
        <p>추천 매물을 불러오는 중입니다...</p>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A2342]">
            추천 매물
          </h2>
          <p className="mt-3 text-gray-600">
            백조현대부동산중개가 엄선한 매물입니다.
          </p>
        </div>


        <div className="grid md:grid-cols-3 gap-8">

          {properties.map((property) => (
            <div
              key={property.id}
              className="border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition"
            >

              {property.image_url ? (
                <img
                  src={property.image_url}
                  alt={property.title}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                  이미지 준비중
                </div>
              )}


              <div className="p-5">

                <h3 className="text-xl font-semibold text-[#0A2342]">
                  {property.title}
                </h3>

                <p className="text-gray-600 mt-2">
                  {property.location}
                </p>

                <p className="text-gray-600">
                  {property.area}
                </p>

                <p className="mt-3 font-bold text-[#C9A227]">
                  {property.price}
                </p>


                <Link
                  href={`/properties/${property.id}`}
                  className="block mt-5 text-center bg-[#0A2342] text-white py-2 rounded-lg hover:opacity-90"
                >
                  상세보기
                </Link>

              </div>

            </div>
          ))}

        </div>


        {properties.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            등록된 추천 매물이 없습니다.
          </div>
        )}

      </div>
    </section>
  );
}