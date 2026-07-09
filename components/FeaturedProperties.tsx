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
          엄선한 프리미엄 매물을 소개합니다.
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property, index) => (
          <motion.article
            key={property.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.06 }}
            whileHover={{ scale: 1.03, y: -6, boxShadow: "0 24px 50px rgba(10, 37, 64, 0.12)" }}
            className="group overflow-hidden rounded-[28px] border border-[#0A2342]/10 bg-white shadow-sm transition-all duration-300 hover:border-[#C9A227]"
          >
            <div className="overflow-hidden">
              <img
                src={property.image}
                alt={property.location}
                className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-sm font-medium text-[#C9A227]">
                  {property.type}
                </span>
                <span className="text-sm text-[#0A2342]/60">{property.area}</span>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-[#0A2342]">{property.title}</h3>
              <p className="mt-2 text-sm text-[#0A2342]/70">{property.location}</p>
              <p className="mt-2 text-sm font-semibold text-[#0A2342]">{property.price}</p>

              <Link
                href={`/properties/${property.id}`}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-4 py-2 text-sm font-semibold text-[#0A2342] transition duration-300 hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-[#0A2342]"
              >
                상세보기
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
