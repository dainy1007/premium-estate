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

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  const property = properties.find(
    (item) => item.id === Number(id)
  );

  if (!property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-[#0A2342]">

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">

        {/* 매물 기본 정보 */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-[32px] border border-[#0A2342]/10 shadow-xl"
          >
            <img
              src={property.image}
              alt={property.title}
              className="h-[420px] w-full object-cover"
            />
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center"
          >

            <p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">
              백조현대부동산중개
            </p>

            <p className="mt-2 text-sm text-[#0A2342]/60">
              Trusted Real Estate Partner
            </p>


            <span className="mt-6 inline-flex w-fit rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-sm font-medium text-[#C9A227]">
              {property.type}
            </span>


            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
              {property.title}
            </h1>


            <p className="mt-4 text-xl font-bold text-[#C9A227]">
              {property.price}
            </p>


            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-gray-500">
                  지역
                </p>
                <p className="mt-1 font-semibold">
                  {property.location}
                </p>
              </div>


              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-gray-500">
                  면적
                </p>
                <p className="mt-1 font-semibold">
                  {property.area}
                </p>
              </div>


              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-gray-500">
                  유형
                </p>
                <p className="mt-1 font-semibold">
                  {property.type}
                </p>
              </div>

            </div>

          </motion.div>

        </div>



        {/* 상담 영역 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-12 rounded-[32px] bg-[#0A2340] p-8 text-white shadow-xl"
        >

          <h2 className="text-2xl font-bold">
            가치를 보는 안목,
            <br />
            신뢰를 만드는 중개
          </h2>


          <p className="mt-4 leading-8 text-white/80">
            고객의 성공적인 부동산 선택을 위해
            함께 고민하고 함께 만들어 가겠습니다.
            <br />
            상가 · 원룸 · 투룸 · 다가구 · 아파트 ·
            오피스텔 · 창고 · 공장 전문 상담을 제공합니다.
          </p>


          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <a
              href="tel:01077750014"
              className="rounded-full bg-[#C9A227] px-6 py-3.5 text-center font-semibold text-[#0A2342] hover:bg-[#d8b53b]"
            >
              ☎ 전화 상담 010-7775-0014
            </a>


            <Link
              href="/"
              className="rounded-full border border-white/30 px-6 py-3.5 text-center font-semibold text-white hover:bg-white/10"
            >
              추천 매물 보기
            </Link>

          </div>

        </motion.div>



        {/* 중개사 정보 */}
        <div className="mt-8 rounded-[32px] border p-8">

          <h2 className="text-2xl font-bold">
            백조현대부동산중개
          </h2>


          <div className="mt-4 space-y-2 text-[#0A2342]/80">

            <p>
              대표 : 하순영
            </p>

            <p>
              전화 :
              <a
                href="tel:01077750014"
                className="ml-2 font-semibold text-[#C9A227]"
              >
                010-7775-0014
              </a>
            </p>

            <p>
              주소 :
              대구광역시 달성군 유가읍 테크노공원로69
              파크뷰타워 105호
            </p>

          </div>

        </div>


      </section>

    </main>
  );
}