"use client";

import { motion } from "framer-motion";

const OFFICE_QUERY = encodeURIComponent("백조현대부동산중개 대구 달성군 유가읍 테크노공원로 69");
const DAANGN_URL = "https://www.daangn.com/kr/local-profile/%EB%B0%B1%EC%A1%B0%ED%98%84%EB%8C%80%EB%B6%80%EB%8F%99%EC%82%B0%EC%A4%91%EA%B0%9C-wwd4axcsm5me/";

const featuredReviews = [
  {
    platform: "당근",
    rating: 5,
    reviewer: "뽀로롱",
    text: "사진과 실제 방이 같아 믿을 수 있었고, 지인에게도 소개할 만큼 만족했다는 후기입니다.",
    href: DAANGN_URL,
  },
  {
    platform: "당근",
    rating: 5,
    reviewer: "내살콩이",
    text: "친절한 상담과 합리적인 가격 조율 덕분에 만족스럽게 계약했다는 후기입니다.",
    href: DAANGN_URL,
  },
];

const reviewChannels = [
  {
    name: "Google",
    description: "구글에서 별점과 리뷰를 바로 남겨주세요.",
    href: "https://search.google.com/local/writereview?placeid=ChIJxeSFToxZbzUR2zAeLtReJMA",
    action: "구글 리뷰 작성",
    badge: "G",
  },
  {
    name: "네이버",
    description: "네이버 부동산의 백조현대부동산 중개사무소 페이지로 이동합니다.",
    href: "https://m.land.naver.com/agency/info/0014hsy?tradTpCd=&atclRletTpCd=",
    action: "네이버에서 보기",
    badge: "N",
  },
  {
    name: "카카오맵",
    description: "카카오맵에서 백조현대부동산을 찾아 후기와 업체 정보를 확인하세요.",
    href: `https://map.kakao.com/link/search/${OFFICE_QUERY}`,
    action: "카카오맵에서 보기",
    badge: "K",
  },
  {
    name: "당근",
    description: "당근 동네업체의 백조현대부동산 페이지에서 실제 이용 후기를 남겨주세요.",
    href: DAANGN_URL,
    action: "당근 후기 남기기",
    badge: "당근",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-28 border-t border-[#0A2342]/10 bg-[#F8F9FB] py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#C9A227]">CUSTOMER REVIEW</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0A2342] sm:text-3xl">실제 고객이 남긴 추천 후기</h2>
          <p className="mt-4 text-sm leading-6 text-[#0A2342]/65 sm:text-base">외부 플랫폼에 공개된 실제 후기 중 좋은 평가를 받은 후기를 선별해 소개합니다. 각 후기의 원문은 출처 링크에서 확인하실 수 있습니다.</p>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {featuredReviews.map((review, index) => (
            <motion.a key={`${review.platform}-${review.reviewer}`} href={review.href} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: index * 0.06 }} whileHover={{ y: -2 }} className="rounded-2xl border border-[#0A2342]/10 bg-white p-6 shadow-sm transition hover:border-[#C9A227] hover:shadow-md">
              <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#0A2342] px-3 py-1 text-xs font-extrabold text-white">출처 · {review.platform}</span><span className="text-lg tracking-wide text-[#C9A227]">{"★".repeat(review.rating)}</span></div>
              <p className="mt-5 text-[15px] leading-7 text-[#0A2342]/80">“{review.text}”</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-bold text-[#0A2342]">{review.reviewer} 님</span><span className="text-sm font-bold text-[#C99700]">원문 보기 →</span></div>
            </motion.a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-extrabold text-[#0A2342]">거래가 만족스러우셨다면 후기를 남겨주세요.</h3>
          <p className="mt-3 text-sm leading-6 text-[#0A2342]/65">이용하시는 서비스를 선택해 편하게 리뷰를 남겨주세요.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviewChannels.map((channel, index) => (
            <motion.a key={channel.name} href={channel.href} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: index * 0.05 }} whileHover={{ y: -3 }} className="group flex min-h-[210px] flex-col rounded-2xl border border-[#0A2342]/10 bg-white p-5 shadow-sm transition hover:border-[#C9A227] hover:shadow-lg">
              <div className="flex items-center justify-between gap-3"><span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#0A2342] px-2 text-sm font-extrabold text-white">{channel.badge}</span><span className="text-lg text-[#C9A227]">★★★★★</span></div>
              <h3 className="mt-5 text-lg font-extrabold text-[#0A2342]">{channel.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#0A2342]/65">{channel.description}</p>
              <span className="mt-5 inline-flex items-center font-bold text-[#0A2342] transition group-hover:text-[#C99700]">{channel.action} <span className="ml-1">→</span></span>
            </motion.a>
          ))}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#0A2342]/50">추천 후기는 외부 플랫폼에 공개된 실제 후기 중 일부를 선별해 소개합니다. 플랫폼별 전체 평점과 모든 후기는 각 원문 페이지에서 확인해 주세요.</p>
      </div>
    </section>
  );
}
