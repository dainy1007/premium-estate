"use client";

import { motion } from "framer-motion";
import React from "react";
import Contact from "../components/Contact";
import FeaturedProperties from "../components/FeaturedProperties";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Testimonials from "../components/Testimonials";
import Map from "../components/Map";

export default function Home() {
  const stats = [
    { value: "15+", label: "경력" },
    { value: "1200+", label: "거래" },
    { value: "98%", label: "만족도" },
    { value: "24H", label: "상담" },
  ];

  const services = [
    "상가 매매.임대",
    "원룸,투룸,다가구",
    "아파트 매매,전세",
    "오피스텔 매매,임대",
    "창고,공장 전문",
    "토지 투자 상담",
  ];

  return (
    <main className="min-h-screen bg-white text-[#0A2342]">
      <Header />

      <section className="relative isolate flex min-h-screen items-center overflow-hidden bg-[#0A2342]">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-28 text-center text-white md:px-8 md:py-32 lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
              백조현대부동산중개
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              가치를 보는 안목,
              <br />
              신뢰를 만드는 중개
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              고객의 성공적인 부동산 선택을 위해 함께 고민하고 함께 만들어 가겠습니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-6 py-3.5 text-sm font-semibold text-[#0A2342] shadow-lg shadow-[#C9A227]/20 transition duration-300 hover:-translate-y-1 hover:bg-[#d8b53b]"
              >
                무료 상담
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                추천 매물 보기
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-16 grid w-full max-w-4xl gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm"
              >
                <p className="text-3xl font-semibold text-[#C9A227]">{stat.value}</p>
                <p className="mt-2 text-sm text-white/80">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
            Our Services
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">부동산의 모든 서비스를 한 곳에서 제공합니다.</h2>
          <p className="mt-4 text-base text-[#0A2342]/70 sm:text-lg">
            매매, 임대, 투자, 시세 분석까지 고객 맞춤형 솔루션으로 안내해드립니다.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <motion.article
              key={service}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              whileHover={{ scale: 1.03, y: -4, boxShadow: "0 20px 45px rgba(10, 37, 64, 0.12)" }}
              className="rounded-3xl border border-[#0A2342]/10 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#C9A227]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A227]/10 text-lg font-semibold text-[#C9A227]">
                0{index + 1}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[#0A2342]">{service}</h3>
              <p className="mt-3 text-sm leading-7 text-[#0A2342]/70">
                전문 컨설턴트가 맞춤형 전략으로 성공적인 거래를 지원합니다.
              </p>
            </motion.article>
          ))}
        </div>
      </section>

     <FeaturedProperties />
<Testimonials />
<Map />
<Contact />
<Footer />
    </main>
  );
}
