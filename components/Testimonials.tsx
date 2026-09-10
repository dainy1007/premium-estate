"use client";

import { motion } from "framer-motion";

const OFFICE_QUERY = encodeURIComponent("백조현대부동산중개 대구 달성군 유가읍 테크노공원로 69");
const DAANGN_URL = "https://www.daangn.com/kr/local-profile/%EB%B0%B1%EC%A1%B0%ED%98%84%EB%8C%80%EB%B6%80%EB%8F%99%EC%82%B0%EC%A4%91%EA%B0%9C-wwd4axcsm5me/";

const daangnRating = {
  score: 4.3,
  total: 7,
  distribution: [
    { star: 5, count: 5 },
    { star: 4, count: 1 },
    { star: 3, count: 0 },
    { star: 2, count: 0 },
    { star: 1, count: 1 },
  ],
};

const goodPoints = [
  { label: "전문적이고 꼼꼼해요", count: 5 },
  { label: "적극적으로 여러 매물을 찾아줘요", count: 4 },
  { label: "조건에 맞는 매물을 소개해줘요", count: 3 },
];

const featuredReviews = [
  {
    platform: "당근",
    rating: 5,
    reviewer: "카운터",
    meta: "5개월 전 · 계약 완료",
    text: "계약 전·후로 필요한 소소한 일처리들도 신경써주셔서 편리한 거래 진행 했습니다",
    href: DAANGN_URL,
  },
  {
    platform: "당근",
    rating: 5,
    reviewer: "별빛",
    meta: "1년 전 · 계약 완료",
    text: "소장님 정말 신경써주시는게 눈에 보일 정도로 많이 도와주셨습니다! 덕분에 좋은 집 찾아서 이사갑니다~ 감사해요 다음에 또 이사할 일 생기면 연락 드리겠습니다ㅎㅎ!!",
    href: DAANGN_URL,
  },
  {
    platform: "당근",
    rating: 5,
    reviewer: "뽀로롱",
    meta: "1년 전 · 계약 완료",
    text: "많이 급했는데 금액도 원하는 금액으로 낮춰주시고 친근하게 설명 잘 해주시고 도시가스 신청도 해주시고 도움 많이 받았어요. 덕분에 좋은집 바로 계약했어요.",
    href: DAANGN_URL,
  },
  {
    platform: "당근",
    rating: 4,
    reviewer: "조이필드",
    meta: "11개월 전 · 연락만 했어요",
    text: "별점으로 만족도를 남겨주신 고객 후기입니다.",
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
    description: "당근 동네업체의 백조현대부동산 페이지에서 실제 이용 후기를 확인하거나 남겨주세요.",
    href: DAANGN_URL,
    action: "당근 후기 보기",
    badge: "당근",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-28 border-t border-[#0A2342]/10 bg-[#F8F9FB] py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-[0.3em] text-[#C9A227]">CUSTOMER REVIEW</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0A2342] sm:text-3xl">실제 고객 후기</h2>
          <p className="mt-4 text-sm leading-6 text-[#0A2342]/65 sm:text-base">
            외부 플랫폼에 공개된 실제 후기와 평점을 확인해 보세요. 후기 원문은 각 출처에서 직접 확인할 수 있습니다.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="mt-8 grid gap-5 rounded-3xl border border-[#0A2342]/10 bg-white p-6 shadow-sm md:grid-cols-[220px_1fr_1fr] md:p-7"
        >
          <a href={DAANGN_URL} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center rounded-2xl bg-[#FFF8F1] p-5 text-center transition hover:shadow-sm">
            <span className="rounded-full bg-[#FF6F0F] px-3 py-1 text-xs font-extrabold text-white">당근 실제 후기</span>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-3xl text-[#FF6F0F]">★</span>
              <strong className="text-4xl font-extrabold text-[#0A2342]">{daangnRating.score}</strong>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#0A2342]/60">후기 {daangnRating.total}개</p>
            <span className="mt-4 text-xs font-bold text-[#FF6F0F]">당근에서 전체 후기 보기 →</span>
          </a>

          <div className="rounded-2xl border border-[#0A2342]/8 p-5">
            <h3 className="text-sm font-extrabold text-[#0A2342]">평점 비율</h3>
            <div className="mt-4 space-y-2.5">
              {daangnRating.distribution.map((item) => {
                const width = daangnRating.total > 0 ? (item.count / daangnRating.total) * 100 : 0;
                return (
                  <div key={item.star} className="grid grid-cols-[18px_1fr_20px] items-center gap-2 text-xs text-[#0A2342]/65">
                    <span className="font-bold">{item.star}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#FF6F0F]" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-right font-semibold">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#0A2342]/8 p-5">
            <h3 className="text-sm font-extrabold text-[#0A2342]">이런 점이 좋았어요</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {goodPoints.map((point) => (
                <span key={point.label} className="rounded-full bg-[#F4F6F8] px-3 py-2 text-xs font-semibold text-[#0A2342]/80">
                  👍 {point.label} <strong>{point.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {featuredReviews.map((review, index) => (
            <motion.a
              key={`${review.platform}-${review.reviewer}`}
              href={review.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-[#0A2342]/10 bg-white p-6 shadow-sm transition hover:border-[#C9A227] hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#FF6F0F] px-3 py-1 text-xs font-extrabold text-white">출처 · {review.platform}</span>
                <span className="text-lg tracking-wide text-[#FF6F0F]">{"★".repeat(review.rating)}<span className="text-slate-200">{"★".repeat(5 - review.rating)}</span></span>
              </div>
              <p className="mt-5 text-[15px] leading-7 text-[#0A2342]/80">“{review.text}”</p>
              <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <span className="block text-sm font-bold text-[#0A2342]">{review.reviewer} 님</span>
                  <span className="mt-1 block text-xs text-[#0A2342]/45">{review.meta}</span>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#FF6F0F]">원문 보기 →</span>
              </div>
            </motion.a>
          ))}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#0A2342]/50">
          위 평점은 당근에 공개된 후기 7개 기준이며, 홈페이지에는 확인 가능한 후기 일부를 소개합니다. 전체 후기와 최신 평점은 당근 원문 페이지에서 확인해 주세요.
        </p>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-extrabold text-[#0A2342]">거래가 만족스러우셨다면 후기를 남겨주세요.</h3>
          <p className="mt-3 text-sm leading-6 text-[#0A2342]/65">이용하시는 서비스를 선택해 편하게 리뷰를 남겨주세요.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviewChannels.map((channel, index) => (
            <motion.a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -3 }}
              className="group flex min-h-[210px] flex-col rounded-2xl border border-[#0A2342]/10 bg-white p-5 shadow-sm transition hover:border-[#C9A227] hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#0A2342] px-2 text-sm font-extrabold text-white">{channel.badge}</span>
                <span className="text-lg text-[#C9A227]">★★★★★</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-[#0A2342]">{channel.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#0A2342]/65">{channel.description}</p>
              <span className="mt-5 inline-flex items-center font-bold text-[#0A2342] transition group-hover:text-[#C99700]">{channel.action} <span className="ml-1">→</span></span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
