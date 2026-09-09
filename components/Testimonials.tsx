"use client";

import { motion } from "framer-motion";

const OFFICE_QUERY = encodeURIComponent("백조현대부동산중개 대구 달성군 유가읍 테크노공원로 69");

const reviewChannels = [
  {
    name: "Google",
    description: "구글 지도에서 별점과 리뷰를 남겨주세요.",
    href: `https://www.google.com/maps/search/?api=1&query=${OFFICE_QUERY}`,
    action: "구글 리뷰 남기기",
    badge: "G",
  },
  {
    name: "네이버",
    description: "네이버에서 백조현대부동산을 확인하고 후기를 남겨주세요.",
    href: "https://m.land.naver.com/agency/info/0014hsy?tradTpCd=&atclRletTpCd=",
    action: "네이버에서 보기",
    badge: "N",
  },
  {
    name: "카카오맵",
    description: "카카오맵에서 업체 정보를 확인하고 후기를 남겨주세요.",
    href: `https://map.kakao.com/link/search/${OFFICE_QUERY}`,
    action: "카카오맵에서 보기",
    badge: "K",
  },
  {
    name: "당근",
    description: "당근 동네업체에서 실제 이용 후기를 남겨주세요.",
    href: "https://www.daangn.com/kr/local-profile/%EB%B0%B1%EC%A1%B0%ED%98%84%EB%8C%80%EB%B6%80%EB%8F%99%EC%82%B0%EC%A4%91%EA%B0%9C-wwd4axcsm5me/",
    action: "당근 후기 남기기",
    badge: "당근",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="border-t border-[#0A2342]/10 bg-[#F8F9FB] py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-[0.3em] text-[#C9A227]">CUSTOMER REVIEW</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0A2342] sm:text-3xl">거래가 만족스러우셨다면 후기를 남겨주세요.</h2>
          <p className="mt-4 text-sm leading-6 text-[#0A2342]/65 sm:text-base">
            고객님의 한마디가 백조현대부동산을 처음 찾는 분들에게 큰 도움이 됩니다.
            이용하시는 서비스를 선택해 편하게 리뷰를 남겨주세요.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#0A2342] px-2 text-sm font-extrabold text-white">
                  {channel.badge}
                </span>
                <span className="text-lg text-[#C9A227]">★★★★★</span>
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-[#0A2342]">{channel.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#0A2342]/65">{channel.description}</p>
              <span className="mt-5 inline-flex items-center font-bold text-[#0A2342] transition group-hover:text-[#C99700]">
                {channel.action} <span className="ml-1">→</span>
              </span>
            </motion.a>
          ))}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#0A2342]/50">
          각 서비스의 로그인 상태나 업체 등록 방식에 따라 업체 페이지가 먼저 열릴 수 있습니다.
        </p>
      </div>
    </section>
  );
}
