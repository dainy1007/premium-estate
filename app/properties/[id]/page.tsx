"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { properties } from "../../../data/properties";

interface PropertyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = properties.find((item) => item.id === Number(id));

  if (!property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-[#0A2342]">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-[32px] border border-[#0A2342]/10 bg-white shadow-xl"
          >
            <img src={property.image} alt={property.title} className="h-[420px] w-full object-cover" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center"
          >
            <span className="inline-flex w-fit rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-sm font-medium text-[#C9A227]">
              {property.type}
            </span>
            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">{property.title}</h1>
            <p className="mt-4 text-lg font-semibold text-[#0A2342]">{property.price}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">지역</p>
                <p className="mt-1 font-semibold text-[#0A2342]">{property.location}</p>
              </div>
              <div className="rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">면적</p>
                <p className="mt-1 font-semibold text-[#0A2342]">{property.area}</p>
              </div>
              <div className="rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">매물 종류</p>
                <p className="mt-1 font-semibold text-[#0A2342]">{property.type}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-12 rounded-[32px] border border-[#0A2342]/10 bg-[#F8F9FB] p-8 shadow-sm"
        >
          <h2 className="text-2xl font-semibold text-[#0A2342]">상세 설명</h2>
          <p className="mt-4 text-base leading-8 text-[#0A2342]/80">
            이 매물은 입지와 가치를 동시에 만족하는 프리미엄 부동산입니다. 주변 인프라와
            교통 접근성이 우수하며, 장기 자산 가치 상승 가능성이 높습니다. 전문 상담팀이
            투자, 거주, 임대 운영까지 체계적으로 지원해드립니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-6 py-3.5 text-sm font-semibold text-[#0A2342] transition duration-300 hover:-translate-y-1 hover:bg-[#d8b53b]"
            >
              무료 상담 버튼
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/15 px-6 py-3.5 text-sm font-semibold text-[#0A2342] transition duration-300 hover:border-[#C9A227] hover:bg-[#C9A227]/10"
            >
              목록으로
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
