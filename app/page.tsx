"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Contact from "../components/Contact";
import FeaturedProperties from "../components/FeaturedProperties";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Testimonials from "../components/Testimonials";
import Map from "../components/Map";

export default function Home() {
  const stats = [
    { value: "15+", label: "년 이상 지역 전문" },
    { value: "1200+", label: "누적 거래 매물" },
    { value: "98%", label: "고객 만족도" },
    { value: "24H", label: "상담 가능" },
  ];

  const quickLinks = [
    { label: "원룸/투룸", sub: "원룸·투룸 임대 매물 확인부터 계약까지", type: "소형주택", image: "/property-types/small-home-final.jpg?v=20260828-hq" },
    { label: "다가구/주택", sub: "단독·다가구·전원주택 매매·임대 상담", type: "주택", image: "/property-types/house-final.jpg?v=20260828-hq" },
    { label: "오피스텔", sub: "주거·업무용 오피스텔 매매·임대", type: "오피스텔", image: "/property-types/officetel-final.jpg?v=20260828-hq" },
    { label: "상가(사무실)", sub: "상가·사무실 매매·임대 현장 안내", type: "상가", image: "/property-types/commercial-final.jpg?v=20260828-hq" },
    { label: "아파트", sub: "아파트 매매·전세 조건 비교 상담", type: "아파트", image: "/property-types/apartment-final.jpg?v=20260828-hq" },
    { label: "창고/공장/토지", sub: "창고·공장·토지 매매·임대·투자 상담", type: "창고·공장", image: "/property-types/industrial-final.jpg?v=20260828-hq" },
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

      <section className="relative isolate overflow-hidden bg-[#FBF9F5]">
        <div aria-hidden className="absolute inset-0 bg-cover bg-[center_48%]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=92')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/82 to-white/18" />
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative mx-auto flex min-h-[330px] w-full max-w-7xl items-center px-6 py-10 md:min-h-[360px] md:px-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl text-left">
            <p className="mb-3 text-xl font-extrabold tracking-[0.1em] text-[#C99700] sm:text-2xl">백조현대부동산중개</p>
            <h1 className="text-4xl font-extrabold leading-[1.12] sm:text-5xl lg:text-[3.35rem]">현풍·유가·구지,<br />원하는 매물을 빠르게 찾으세요</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#0A2342]/70 sm:text-base">대구 테크노폴리스 생활권의 원룸·투룸·상가·공장·토지를 현장 중심으로 안내합니다.</p>
          </motion.div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 bg-white py-7 md:py-9">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickLinks.map((item) => (
              <Link key={item.label} href={`/search?type=${encodeURIComponent(item.type)}`} className="group overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#C9A227] hover:shadow-lg">
                <div className="h-24 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:h-28" style={{ backgroundImage: `url('${item.image}')` }} />
                <div className="px-3 py-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-extrabold sm:text-base">{item.label}</span><span className="text-xl text-[#C9A227]">›</span></div><p className="mt-1 text-[11px] leading-5 text-[#0A2342]/65">{item.sub}</p></div>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => <div key={s.label} className="rounded-2xl border border-[#0A2342]/8 bg-white p-4 text-center shadow-sm"><p className="text-3xl font-extrabold text-[#C99700]">{s.value}</p><p className="mt-1 text-xs font-semibold text-[#0A2342]/75">{s.label}</p></div>)}
          </div>
        </div>
      </section>

      <FeaturedProperties />

      <section className="border-b border-[#0A2342]/10 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-[#C9A227]">지역별 빠른 매물 찾기</p><h2 className="mt-1 text-2xl font-bold">테크노폴리스 생활권 매물을 바로 확인하세요</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">{regionLinks.map((r) => <Link key={r.label} href={r.href} className="rounded-xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 text-center text-sm font-semibold">{r.label}</Link>)}</div></div></div>
      </section>

      <section className="bg-[#F8F9FB] py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-8"><div className="max-w-3xl"><p className="text-sm font-semibold tracking-[.22em] text-[#C9A227]">POPULAR SEARCH</p><h2 className="mt-2 text-3xl font-bold">지역·매물유형별 인기 검색</h2><p className="mt-3 leading-7 text-[#0A2342]/70">현풍·유가·구지와 대구테크노폴리스 생활권의 주요 원룸·투룸·상가 매물을 지역별로 바로 확인할 수 있습니다.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{seoLandingLinks.map((i) => <Link key={i.href} href={i.href} className="rounded-2xl border border-[#0A2342]/10 bg-white px-5 py-4 font-semibold">{i.label} →</Link>)}</div></div>
      </section>

      <section id="about" className="scroll-mt-24 border-y border-[#0A2342]/10 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8"><div className="overflow-hidden rounded-[28px] border border-[#0A2342]/10 bg-[#FBF9F5] shadow-sm"><div className="grid lg:grid-cols-[1fr_1.05fr] lg:items-stretch"><div className="p-7 sm:p-9 lg:p-11"><p className="text-sm font-semibold tracking-[.25em] text-[#C9A227]">ABOUT BAEKJO</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">백조현대부동산중개</h2><p className="mt-6 text-xl font-bold leading-8">고객의 소중한 자산을 정직과 신뢰로 연결합니다.</p><div className="mt-5 space-y-3 leading-7 text-[#0A2342]/70"><p>대구 달성군 유가읍·현풍읍·구지면과 대구테크노폴리스 생활권을 중심으로 원룸·투룸·다가구·아파트·상가·공장·토지 등 다양한 부동산 거래를 전문적으로 중개합니다.</p><p>풍부한 지역 정보와 현장 경험을 바탕으로 매물 확인부터 조건 비교, 현장 안내, 계약 상담까지 빠르고 정확하게 안내해 드리겠습니다.</p></div></div><div className="min-h-[260px] bg-cover bg-center lg:min-h-full" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=88')" }} aria-label="백조현대부동산중개 사무실 이미지" /></div></div></div>
      </section>

      <Map />
      <Contact />
      <Testimonials />
      <Footer />
    </main>
  );
}
