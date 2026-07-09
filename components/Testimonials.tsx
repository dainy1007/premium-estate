"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "홍길동",
    role: "아파트 매매",
    quote: "매우 친절하고 전문적으로 상담해 주셨습니다.",
  },
  {
    name: "김영희",
    role: "상가 임대",
    quote: "원하는 상가를 빠르게 계약했습니다.",
  },
  {
    name: "이철수",
    role: "토지 투자",
    quote: "투자 상담이 큰 도움이 되었습니다.",
  },
];

export default function Testimonials() {
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
          고객 후기
        </p>
        <h2 className="mt-3 text-3xl font-bold text-[#0A2342] sm:text-4xl">
          고객이 직접 경험한 신뢰와 만족을 확인하세요.
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            whileHover={{ scale: 1.03, y: -6, boxShadow: "0 24px 50px rgba(10, 37, 64, 0.12)" }}
            className="rounded-[28px] border border-[#0A2342]/10 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#C9A227]"
          >
            <div className="text-xl text-[#C9A227]">★★★★★</div>
            <p className="mt-5 text-lg leading-8 text-[#0A2342]">“{item.quote}”</p>
            <div className="mt-6">
              <p className="font-semibold text-[#0A2342]">{item.name}</p>
              <p className="text-sm text-[#0A2342]/70">{item.role}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
