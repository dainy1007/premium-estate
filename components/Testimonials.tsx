"use client";

import { motion } from "framer-motion";

const OFFICE_QUERY = encodeURIComponent("백조현대부동산중개 대구 달성군 유가읍 테크노공원로 69");
const DAANGN_URL = "https://www.daangn.com/kr/local-profile/%EB%B0%B1%EC%A1%B0%ED%98%84%EB%8C%80%EB%B6%80%EB%8F%99%EC%82%B0%EC%A4%91%EA%B0%9C-wwd4axcsm5me/";

const featuredReviews = [
  { platform: "당근", rating: 5, reviewer: "카운터", meta: "5개월 전 · 계약 완료", text: "계약 전·후로 필요한 소소한 일처리들도 신경써주셔서 편리한 거래 진행 했습니다", href: DAANGN_URL },
  { platform: "당근", rating: 5, reviewer: "별빛", meta: "1년 전 · 계약 완료", text: "소장님 정말 신경써주시는게 눈에 보일 정도로 많이 도와주셨습니다! 덕분에 좋은 집 찾아서 이사갑니다~ 감사해요 다음에 또 이사할 일 생기면 연락 드리겠습니다ㅎㅎ!!", href: DAANGN_URL },
  { platform: "당근", rating: 5, reviewer: "뽀로롱", meta: "1년 전 · 계약 완료", text: "많이 급했는데 금액도 원하는 금액으로 낮춰주시고 친근하게 설명 잘 해주시고 도시가스 신청도 해주시고 도움 많이 받았어요. 덕분에 좋은집 바로 계약했어요.", href: DAANGN_URL },
  { platform: "당근", rating: 4, reviewer: "조이필드", meta: "11개월 전 · 연락만 했어요", text: "별점으로 만족도를 남겨주신 고객 후기입니다.", href: DAANGN_URL },
];

const reviewChannels = [
  { name: "Google", description: "구글에서 별점과 리뷰를 바로 남겨주세요.", href: "https://search.google.com/local/writereview?placeid=ChIJxeSFToxZbzUR2zAeLtReJMA", action: "구글 리뷰 작성", badge: "G", badgeClass: "text-[#4285F4]" },
  { name: "네이버", description: "네이버 부동산의 백조현대부동산 중개사무소 페이지로 이동합니다.", href: "https://m.land.naver.com/agency/info/0014hsy?tradTpCd=&atclRletTpCd=", action: "네이버에서 보기", badge: "N", badgeClass: "bg-[#03C75A] text-white" },
  { name: "카카오맵", description: "카카오맵에서 백조현대부동산을 찾아 후기와 업체 정보를 확인하세요.", href: `https://map.kakao.com/link/search/${OFFICE_QUERY}`, action: "카카오맵에서 보기", badge: "TALK", badgeClass: "bg-[#FEE500] text-[#3C1E1E] text-[8px]" },
  { name: "당근", description: "당근 동네업체의 백조현대부동산 페이지에서 실제 이용 후기를 확인하거나 남겨주세요.", href: DAANGN_URL, action: "당근 후기 보기", badge: "●", badgeClass: "bg-[#FF6F0F] text-white" },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-28 border-t border-[#0A2342]/10 bg-[#F8F9FB] py-8 md:py-9">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#C9A227]">CUSTOMER REVIEW</p>
          <h2 className="mt-1.5 text-2xl font-bold text-[#0A2342]">실제 고객 후기</h2>
          <p className="mt-2 text-sm leading-6 text-[#0A2342]/65">외부 플랫폼에 공개된 실제 후기를 확인해 보세요. 후기 원문은 각 출처에서 직접 확인할 수 있습니다.</p>
        </motion.div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {featuredReviews.map((review, index) => (
            <motion.a key={`${review.platform}-${review.reviewer}`} href={review.href} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, delay: index * 0.04 }} whileHover={{ y: -2 }} className="flex min-h-[190px] flex-col rounded-2xl border border-[#0A2342]/10 bg-white p-4 shadow-sm transition hover:border-[#C9A227] hover:shadow-md">
              <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-[#FF6F0F] px-2.5 py-1 text-[11px] font-extrabold text-white">출처 · {review.platform}</span><span className="text-base tracking-tight text-[#FF6F0F]">{"★".repeat(review.rating)}<span className="text-slate-200">{"★".repeat(5-review.rating)}</span></span></div>
              <p className="mt-4 line-clamp-3 text-[13px] leading-6 text-[#0A2342]/80">“{review.text}”</p>
              <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3"><div><span className="block text-[13px] font-bold text-[#0A2342]">{review.reviewer} 님</span><span className="mt-0.5 block text-[11px] text-[#0A2342]/45">{review.meta}</span></div><span className="shrink-0 text-xs font-bold text-[#FF6F0F]">원문 보기 →</span></div>
            </motion.a>
          ))}
        </div>

        <div className="mt-7 text-center"><h3 className="text-lg font-extrabold text-[#0A2342]">거래가 만족스러우셨다면 후기를 남겨주세요.</h3><p className="mt-1 text-xs text-[#0A2342]/60">이용하시는 서비스를 선택해 편하게 리뷰를 남겨주세요.</p></div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {reviewChannels.map((channel, index) => (
            <motion.a key={channel.name} href={channel.href} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.35, delay: index * 0.03 }} whileHover={{ y: -2 }} className="group flex min-h-[118px] flex-col rounded-xl border border-[#0A2342]/10 bg-white p-3 shadow-sm transition hover:border-[#C9A227] hover:shadow-md">
              <div className="flex items-center gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black shadow-sm ring-1 ring-[#0A2342]/8 ${channel.badgeClass}`}>{channel.badge}</span><h3 className="text-sm font-extrabold text-[#0A2342]">{channel.name}</h3><span className="ml-auto text-sm tracking-[-2px] text-[#D4A017]">★★★★★</span></div>
              <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#0A2342]/60">{channel.description}</p>
              <span className="mt-auto pt-2 text-xs font-bold text-[#0A2342] transition group-hover:text-[#C99700]">{channel.action} →</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
