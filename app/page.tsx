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
  const stats = [{ value: "15+", label: "년 이상 지역 전문" },{ value: "1200+", label: "누적 거래 매물" },{ value: "98%", label: "고객 만족도" },{ value: "24H", label: "상담 가능" }];
  const services = [
    { label: "상가 매매·임대", href: "/search?type=%EC%83%81%EA%B0%80" },
    { label: "원룸·투룸·다가구", href: "/search?type=%EC%86%8C%ED%98%95%EC%A3%BC%ED%83%9D" },
    { label: "아파트 매매·전세", href: "/search?type=%EC%95%84%ED%8C%8C%ED%8A%B8" },
    { label: "오피스텔 매매·임대", href: "/search?type=%EC%98%A4%ED%94%BC%EC%8A%A4%ED%85%94" },
    { label: "창고·공장 전문", href: "/search?type=%EC%B0%BD%EA%B3%A0%C2%B7%EA%B3%B5%EC%9E%A5" },
    { label: "토지 투자 상담", href: "/search?type=%ED%86%A0%EC%A7%80" },
  ];
  const quickLinks = [
    { label: "원룸/투룸", sub: "깔끔한 원룸부터 투룸까지", type: "소형주택", image: "/property-types/small-home-final.jpg?v=20260828-hq" },
    { label: "다가구/주택", sub: "단독·다가구·전원주택", type: "주택", image: "/property-types/house-final.jpg?v=20260828-hq" },
    { label: "오피스텔", sub: "주거와 업무를 한 번에", type: "오피스텔", image: "/property-types/officetel-final.jpg?v=20260828-hq" },
    { label: "상가(사무실)", sub: "상가·사무실·점포", type: "상가", image: "/property-types/commercial-final.jpg?v=20260828-hq" },
    { label: "아파트", sub: "다양한 아파트 매물", type: "아파트", image: "/property-types/apartment-final.jpg?v=20260828-hq" },
    { label: "창고/공장/토지", sub: "창고·공장·토지 매물", type: "창고·공장", image: "/property-types/industrial-final.jpg?v=20260828-hq" },
  ];
  const regionLinks = [
    { label: "유가읍", href: "/search?q=%EC%9C%A0%EA%B0%80%EC%9D%8D" }, { label: "현풍읍", href: "/search?q=%ED%98%84%ED%92%8D%EC%9D%8D" }, { label: "구지면", href: "/search?q=%EA%B5%AC%EC%A7%80%EB%A9%B4" }, { label: "테크노폴리스", href: "/search?q=%ED%85%8C%ED%81%AC%EB%85%B8%ED%8F%B4%EB%A6%AC%EC%8A%A4" }, { label: "디지스트 인근", href: "/search?q=%EB%94%94%EC%A7%80%EC%8A%A4%ED%8A%B8" },
  ];
  const seoLandingLinks = [
    { label: "현풍 원룸 월세", href: "/real-estate/hyunpung-one-room" },{ label: "유가읍 원룸 월세", href: "/real-estate/yuga-one-room" },{ label: "유가읍 미니투룸", href: "/real-estate/yuga-mini-two-room" },{ label: "현풍 투룸 월세", href: "/real-estate/hyunpung-two-room" },{ label: "테크노폴리스 원룸", href: "/real-estate/techno-one-room" },{ label: "디지스트 원룸", href: "/real-estate/dgist-one-room" },{ label: "테크노폴리스 상가", href: "/real-estate/techno-commercial" },{ label: "현풍 상가", href: "/real-estate/hyunpung-commercial" },{ label: "구지 원룸 월세", href: "/real-estate/guji-one-room" },
  ];
  return (
    <main className="min-h-screen bg-white pb-20 text-[#0A2342] md:pb-0"><Header />
      <section className="relative isolate overflow-hidden bg-[#FBF9F5] pt-20">
        <div aria-hidden className="absolute inset-0 bg-cover bg-[center_48%]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=92')" }} /><div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/82 to-white/18" /><div className="absolute inset-0 bg-white/10" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7">
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:.65 }} className="max-w-4xl text-left">
            <p className="mb-2 text-xl font-extrabold tracking-[0.12em] text-[#C99700] sm:text-2xl">백조현대부동산중개</p><h1 className="text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.7rem]">현풍·유가·구지,<br />원하는 매물을 빠르게 찾으세요</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#0A2342]/70 sm:text-base">대구 테크노폴리스 생활권의 원룸·투룸·상가·공장·토지를 현장 중심으로 안내합니다.</p>
            <form action="/search" method="get" className="mt-4 grid w-full max-w-3xl gap-2 rounded-[20px] border border-[#0A2342]/10 bg-white/95 p-2 shadow-md sm:grid-cols-[1fr_auto]"><label htmlFor="home-property-search" className="sr-only">지역, 주소, 매물명 검색</label><input id="home-property-search" name="q" value={searchKeyword} onChange={(e)=>setSearchKeyword(e.target.value)} placeholder="예: 현풍 원룸, 유가읍 투룸, 테크노폴리스 상가" className="min-w-0 rounded-2xl border border-[#0A2342]/10 bg-white px-5 py-3 outline-none placeholder:text-[#0A2342]/40"/><button type="submit" className="rounded-2xl bg-[#D4A514] px-7 py-3 text-sm font-bold">매물 검색</button></form>
            <div className="mt-3 flex flex-wrap gap-2">{regionLinks.map(r=><Link key={r.label} href={r.href} className="rounded-full border border-[#0A2342]/10 bg-white/95 px-4 py-2 text-sm font-semibold shadow-sm">{r.label}</Link>)}</div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Link href="/properties" className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 bg-white/95 px-5 py-2.5 text-sm font-semibold shadow-sm">⌂ 상세 조건 검색</Link><a href="tel:01077750014" className="inline-flex items-center justify-center rounded-full bg-[#0A2342] px-5 py-2.5 text-sm font-bold text-white">☎ 전화 상담 010-7775-0014</a></div>
          </motion.div>
          <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1,duration:.6 }} className="mt-3 w-full rounded-[24px] border border-[#0A2342]/8 bg-white/95 p-4 shadow-xl"><div className="mb-3 flex items-end justify-between gap-4"><p className="text-xl font-extrabold">매물유형 바로가기</p><span className="hidden text-xs text-[#0A2342]/50 sm:block">카드를 누르면 해당 매물만 볼 수 있어요</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{quickLinks.map(item=><Link key={item.label} href={`/search?type=${encodeURIComponent(item.type)}`} className="group overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#C9A227] hover:shadow-lg"><div className="h-24 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:h-28" style={{backgroundImage:`url('${item.image}')`}}/><div className="px-3 py-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-extrabold sm:text-base">{item.label}</span><span className="text-xl text-[#C9A227]">›</span></div><p className="mt-1 hidden text-[11px] text-[#0A2342]/60 xl:block">{item.sub}</p></div></Link>)}</div></motion.div>
          <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.18,duration:.6}} className="mt-3 grid w-full grid-cols-2 gap-2 md:grid-cols-4">{stats.map(s=><div key={s.label} className="rounded-2xl border border-[#0A2342]/8 bg-white/92 p-3 text-center shadow-sm"><p className="text-2xl font-extrabold text-[#C99700]">{s.value}</p><p className="mt-1 text-xs font-semibold text-[#0A2342]/75">{s.label}</p></div>)}</motion.div>
        </div>
      </section>
      <section id="about" className="scroll-mt-24 border-b border-[#0A2342]/10 bg-white py-16 md:py-20"><div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="text-sm font-semibold tracking-[.25em] text-[#C9A227]">ABOUT BAEKJO</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">백조현대부동산중개</h2></div><div className="space-y-4 leading-8 text-[#0A2342]/75"><p>대구 달성군 유가읍·현풍읍·구지면과 대구테크노폴리스 생활권을 중심으로 상가, 원룸·투룸, 다가구, 오피스텔, 창고·공장, 토지 매물을 안내합니다.</p><p>매물 확인부터 조건 비교, 현장 안내, 계약 상담까지 실제 거래에 필요한 정보를 꼼꼼하게 확인해 안내해드립니다.</p></div></div></section>
      <section className="border-b border-[#0A2342]/10 bg-white py-8"><div className="mx-auto max-w-7xl px-6 md:px-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-[#C9A227]">지역별 빠른 매물 찾기</p><h2 className="mt-1 text-2xl font-bold">테크노폴리스 생활권 매물을 바로 확인하세요</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">{regionLinks.map(r=><Link key={r.label} href={r.href} className="rounded-xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 text-center text-sm font-semibold">{r.label}</Link>)}</div></div></div></section>
      <section className="bg-[#F8F9FB] py-12"><div className="mx-auto max-w-7xl px-6 md:px-8"><div className="max-w-3xl"><p className="text-sm font-semibold tracking-[.22em] text-[#C9A227]">POPULAR SEARCH</p><h2 className="mt-2 text-3xl font-bold">지역·매물유형별 인기 검색</h2><p className="mt-3 leading-7 text-[#0A2342]/70">현풍·유가·구지와 대구테크노폴리스 생활권의 주요 원룸·투룸·상가 매물을 지역별로 바로 확인할 수 있습니다.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{seoLandingLinks.map(i=><Link key={i.href} href={i.href} className="rounded-2xl border border-[#0A2342]/10 bg-white px-5 py-4 font-semibold">{i.label} →</Link>)}</div></div></section>
      <FeaturedProperties />
      <section id="services" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[.35em] text-[#C9A227]">Our Services</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">부동산의 모든 서비스를 한 곳에서 제공합니다.</h2><p className="mt-4 text-base text-[#0A2342]/70 sm:text-lg">매매, 임대, 투자, 시세 분석까지 고객 맞춤형 솔루션으로 안내해드립니다.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{services.map((s,index)=><motion.div key={s.label} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.5,delay:index*.06}}><Link href={s.href} className="block h-full rounded-3xl border border-[#0A2342]/10 bg-white p-8 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A227]/10 text-sm font-bold text-[#C9A227]">0{index+1}</div><h3 className="mt-6 text-2xl font-semibold">{s.label}</h3><p className="mt-4 leading-7 text-[#0A2342]/70">현장 경험을 바탕으로 매물 확인부터 계약까지 꼼꼼하게 안내합니다.</p><p className="mt-6 text-sm font-semibold text-[#C9A227]">매물 보기 →</p></Link></motion.div>)}</div></section>
      <Testimonials /><Map /><Contact /><Footer />
    </main>
  );
}