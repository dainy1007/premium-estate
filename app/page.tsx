"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";
import Contact from "../components/Contact";
import FeaturedProperties from "../components/FeaturedProperties";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Testimonials from "../components/Testimonials";
import Map from "../components/Map";

export default function Home() {
  const [searchKeyword, setSearchKeyword] = useState("");

  const stats = [
    { value: "15+", label: "경력" },
    { value: "1200+", label: "거래" },
    { value: "98%", label: "만족도" },
    { value: "24H", label: "상담" },
  ];

  const services = [
    { label: "상가 매매·임대", href: "/search?type=%EC%83%81%EA%B0%80" },
    { label: "원룸·투룸·다가구", href: "/search?type=%EC%86%8C%ED%98%95%EC%A3%BC%ED%83%9D" },
    { label: "아파트 매매·전세", href: "/search?type=%EC%95%84%ED%8C%8C%ED%8A%B8" },
    { label: "오피스텔 매매·임대", href: "/search?type=%EC%98%A4%ED%94%BC%EC%8A%A4%ED%85%94" },
    { label: "창고·공장 전문", href: "/search?type=%EC%B0%BD%EA%B3%A0%C2%B7%EA%B3%B5%EC%9E%A5" },
    { label: "토지 투자 상담", href: "/search?type=%ED%86%A0%EC%A7%80" },
  ];

  const quickLinks = [
    { label: "원룸·미니투룸·투룸", type: "소형주택", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=82" },
    { label: "상가", type: "상가", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=82" },
    { label: "오피스텔", type: "오피스텔", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82" },
    { label: "다가구·단독주택", type: "주택", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82" },
    { label: "사무실", type: "사무실", image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=82" },
    { label: "창고·공장·토지", type: "창고·공장", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=82" },
  ];

  const regionLinks = [
    { label: "유가읍", href: "/search?q=%EC%9C%A0%EA%B0%80%EC%9D%8D" },
    { label: "현풍읍", href: "/search?q=%ED%98%84%ED%92%8D%EC%9D%8D" },
    { label: "구지면", href: "/search?q=%EA%B5%AC%EC%A7%80%EB%A9%B4" },
    { label: "테크노폴리스", href: "/search?q=%ED%85%8C%ED%81%AC%EB%85%B8%ED%8F%B4%EB%A6%AC%EC%8A%A4" },
    { label: "디지스트 인근", href: "/search?q=%EB%94%94%EC%A7%80%EC%8A%A4%ED%8A%B8" },
  ];

  const seoLandingLinks = [
    { label: "현풍 원룸 월세", href: "/real-estate/hyunpung-one-room" },
    { label: "유가읍 원룸 월세", href: "/real-estate/yuga-one-room" },
    { label: "유가읍 미니투룸", href: "/real-estate/yuga-mini-two-room" },
    { label: "현풍 투룸 월세", href: "/real-estate/hyunpung-two-room" },
    { label: "테크노폴리스 원룸", href: "/real-estate/techno-one-room" },
    { label: "디지스트 원룸", href: "/real-estate/dgist-one-room" },
    { label: "테크노폴리스 상가", href: "/real-estate/techno-commercial" },
    { label: "현풍 상가", href: "/real-estate/hyunpung-commercial" },
    { label: "구지 원룸 월세", href: "/real-estate/guji-one-room" },
  ];

  return (
    <main className="min-h-screen bg-white pb-20 text-[#0A2342] md:pb-0">
      <Header />
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-[#0A2342]">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80')" }} />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-24 text-center text-white md:px-8 md:py-28 lg:items-start lg:text-left">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#C9A227]">백조현대부동산중개</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">현풍·유가·구지,<br />원하는 매물을 빠르게 찾으세요</h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">대구 테크노폴리스 생활권의 원룸·투룸·상가·공장·토지를 현장 중심으로 안내합니다.</p>
            <form action="/search" method="get" className="mt-8 grid w-full max-w-3xl gap-3 rounded-[24px] border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:grid-cols-[1fr_auto]">
              <label htmlFor="home-property-search" className="sr-only">지역, 주소, 매물명 검색</label>
              <input id="home-property-search" name="q" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="예: 현풍 원룸, 유가읍 투룸, 테크노폴리스 상가" className="min-w-0 rounded-2xl border border-white/15 bg-white px-5 py-4 text-[#0A2342] outline-none placeholder:text-[#0A2342]/45 focus:border-[#C9A227]" />
              <button type="submit" className="rounded-2xl bg-[#C9A227] px-7 py-4 text-sm font-bold text-[#0A2342]">매물 검색</button>
            </form>
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">{regionLinks.map((region) => <Link key={region.label} href={region.href} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">{region.label}</Link>)}</div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href="/properties" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white">상세 조건 검색</Link><a href="tel:01077750014" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#0A2342]">전화 상담 010-7775-0014</a></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.7 }} className="mt-10 w-full max-w-7xl rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-4 text-left"><div><p className="text-sm font-semibold text-white/75">매물유형 바로가기</p><p className="mt-1 text-lg font-bold text-white">원하시는 매물 유형을 선택하세요</p></div><span className="hidden text-xs text-white/60 sm:block">카드를 누르면 해당 매물만 볼 수 있어요</span></div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{quickLinks.map((item) => <Link key={item.label} href={`/search?type=${encodeURIComponent(item.type)}`} className="group overflow-hidden rounded-2xl border border-white/20 bg-white text-[#0A2342] shadow-lg transition duration-300 hover:-translate-y-1 hover:border-[#C9A227] hover:shadow-xl"><div className="h-28 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:h-32" style={{ backgroundImage: `url('${item.image}')` }} /><div className="flex min-h-16 items-center justify-between gap-2 px-3 py-3 sm:px-4"><span className="text-sm font-extrabold leading-tight sm:text-[15px]">{item.label}</span><span className="shrink-0 text-lg text-[#C9A227]">›</span></div></Link>)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm"><p className="text-3xl font-semibold text-[#C9A227]">{stat.value}</p><p className="mt-2 text-sm text-white/80">{stat.label}</p></div>)}</motion.div>
        </div>
      </section>
      <section id="about" className="scroll-mt-24 border-b border-[#0A2342]/10 bg-white py-16 md:py-20"><div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><div><p className="text-sm font-semibold tracking-[0.25em] text-[#C9A227]">ABOUT BAEKJO</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">백조현대부동산중개</h2></div><div className="space-y-4 leading-8 text-[#0A2342]/75"><p>대구 달성군 유가읍·현풍읍·구지면과 대구테크노폴리스 생활권을 중심으로 상가, 원룸·투룸, 다가구, 오피스텔, 창고·공장, 토지 매물을 안내합니다.</p><p>매물 확인부터 조건 비교, 현장 안내, 계약 상담까지 실제 거래에 필요한 정보를 꼼꼼하게 확인해 안내해드립니다.</p></div></div></section>
      <section className="border-b border-[#0A2342]/10 bg-white py-8"><div className="mx-auto max-w-7xl px-6 md:px-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-[#C9A227]">지역별 빠른 매물 찾기</p><h2 className="mt-1 text-2xl font-bold text-[#0A2342]">테크노폴리스 생활권 매물을 바로 확인하세요</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">{regionLinks.map((region) => <Link key={region.label} href={region.href} className="rounded-xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 text-center text-sm font-semibold text-[#0A2342]">{region.label}</Link>)}</div></div></div></section>
      <section className="bg-[#F8F9FB] py-12"><div className="mx-auto max-w-7xl px-6 md:px-8"><div className="max-w-3xl"><p className="text-sm font-semibold tracking-[0.22em] text-[#C9A227]">POPULAR SEARCH</p><h2 className="mt-2 text-3xl font-bold">지역·매물유형별 인기 검색</h2><p className="mt-3 leading-7 text-[#0A2342]/70">현풍·유가·구지와 대구테크노폴리스 생활권의 주요 원룸·투룸·상가 매물을 지역별로 바로 확인할 수 있습니다.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{seoLandingLinks.map((item) => <Link key={item.href} href={item.href} className="rounded-2xl border border-[#0A2342]/10 bg-white px-5 py-4 font-semibold">{item.label} →</Link>)}</div></div></section>
      <FeaturedProperties />
      <section id="services" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">Our Services</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">부동산의 모든 서비스를 한 곳에서 제공합니다.</h2><p className="mt-4 text-base text-[#0A2342]/70 sm:text-lg">매매, 임대, 투자, 시세 분석까지 고객 맞춤형 솔루션으로 안내해드립니다.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{services.map((service, index) => <motion.div key={service.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: index * 0.06 }}><Link href={service.href} className="block h-full cursor-pointer rounded-3xl border border-[#0A2342]/10 bg-white p-8 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A227]/10 text-sm font-bold text-[#C9A227]">0{index + 1}</div><h3 className="mt-6 text-2xl font-semibold">{service.label}</h3><p className="mt-4 leading-7 text-[#0A2342]/70">현장 경험을 바탕으로 매물 확인부터 계약까지 꼼꼼하게 안내합니다.</p><p className="mt-6 text-sm font-semibold text-[#C9A227]">매물 보기 →</p></Link></motion.div>)}</div></section>
      <Testimonials />
      <Map />
      <Contact />
      <Footer />
    </main>
  );
}
