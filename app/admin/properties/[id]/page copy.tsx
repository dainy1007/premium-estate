"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
        .select("*")
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


    if (id) {
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


        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold">
            {property.title}
          </h1>


          <Link
            href="/admin"
            className="rounded-full border px-5 py-3"
          >
            목록으로
          </Link>

        </div>



        {property.image_url && (

          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-72 object-cover rounded-2xl mb-8"
          />

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


          <p>
            <strong>설명 :</strong>
          </p>


          <div className="rounded-xl bg-[#F8F9FB] p-5 whitespace-pre-line">
            {property.description}
          </div>


        </div>



        <div className="mt-8">

          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="inline-block rounded-full bg-[#C9A227] px-6 py-3 font-semibold text-[#0A2342]"
          >
            수정하기
          </Link>

        </div>


      </div>


    </main>

  );

}