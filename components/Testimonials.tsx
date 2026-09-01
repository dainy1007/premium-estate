"use client";

import { motion } from "framer-motion";

const testimonials = [
  { name: "홍길동", role: "아파트 매매", quote: "매우 친절하고 전문적으로 상담해 주셨습니다." },
  { name: "김영희", role: "상가 임대", quote: "원하는 상가를 빠르게 계약했습니다." },
  { name: "이철수", role: "토지 투자", quote: "투자 상담이 큰 도움이 되었습니다." },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-xl text-center"
      >
        <p className="text-xs font-semibold tracking-[0.3em] text-[#C9A227]">고객 후기</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0A2342] sm:text-3xl">고객이 직접 경험한 신뢰와 만족을 확인하세요.</h2>
      </motion.div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            whileHover={{ y: -3, boxShadow: "0 16px 34px rgba(10, 37, 64, 0.10)" }}
            className="rounded-2xl border border-[#0A2342]/10 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#C9A227]"
          >
            <div className="text-base text-[#C9A227]">★★★★★</div>
            <p className="mt-3 text-sm leading-6 text-[#0A2342]">“{item.quote}”</p>
            <div className="mt-4">
              <p className="text-sm font-semibold text-[#0A2342]">{item.name}</p>
              <p className="mt-0.5 text-xs text-[#0A2342]/65">{item.role}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
