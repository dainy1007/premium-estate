"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { properties } from "../data/properties";

export default function FeaturedProperties() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >

        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
          추천 매물
        </p>

        <h2 className="mt-3 text-3xl font-bold text-[#0A2342] sm:text-4xl">
          백조현대부동산이 엄선한 매물
        </h2>

        <p className="mt-4 text-[#0A2342]/70">
          달성군 유가읍·현풍읍·구지면 중심의
          <br />
          검증된 매물을 안내해드립니다.
        </p>

      </motion.div>


      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {properties.map((property, index) => (

          <motion.article
            key={property.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.5,
              delay: index * 0.06,
            }}
            className="group overflow-hidden rounded-[28px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-2 hover:border-[#C9A227]"
          >

            <div className="overflow-hidden">
              <img
                src={property.image}
                alt={property.title}
                className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </div>


            <div className="p-6">

              <div className="flex items-center justify-between">

                <span className="rounded-full bg-[#C9A227]/10 px-3 py-1 text-sm font-semibold text-[#C9A227]">
                  {property.type}
                </span>

                <span className="text-sm text-[#0A2342]/60">
                  {property.area}
                </span>

              </div>


              <h3 className="mt-5 text-xl font-semibold text-[#0A2342]">
                {property.title}
              </h3>


              <p className="mt-2 text-sm text-[#0A2342]/70">
                📍 {property.location}
              </p>


              <p className="mt-3 font-semibold text-[#0A2342]">
                {property.price}
              </p>


              <p className="mt-4 text-sm leading-6 text-[#0A2342]/60">
                전문 상담을 통해 정확한 매물 정보와
                <br />
                거래 전략을 안내해드립니다.
              </p>


              <div className="mt-6 flex gap-3">

                <Link
                  href={`/properties/${property.id}`}
                  className="flex-1 rounded-full border border-[#0A2342]/10 py-2 text-center text-sm font-semibold text-[#0A2342] hover:border-[#C9A227]"
                >
                  상세보기
                </Link>


                <a
                  href="tel:01077750014"
                  className="flex-1 rounded-full bg-[#C9A227] py-2 text-center text-sm font-semibold text-[#0A2342]"
                >
                  전화 상담
                </a>

              </div>

            </div>

          </motion.article>

        ))}

      </div>

    </section>
  );
}