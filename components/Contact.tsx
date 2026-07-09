"use client";

import { motion } from "framer-motion";

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
      <div className="grid gap-8 rounded-[32px] border border-[#0A2342]/10 bg-[#0A2340] p-8 text-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="rounded-[24px] bg-white/10 p-6 backdrop-blur-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
            무료 상담 신청
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">무료 상담 신청</h2>
          <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
            전문 상담원이 빠르게 연락드리겠습니다. 원하는 매물이나 상담 내용을 남겨주세요.
          </p>

          <form className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">이름</label>
              <input
                type="text"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#C9A227]"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">전화번호</label>
              <input
                type="tel"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#C9A227]"
                placeholder="010-1234-5678"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">문의내용</label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#C9A227]"
                placeholder="상담받고 싶은 내용을 입력해주세요."
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-6 py-3.5 text-sm font-semibold text-[#0A2342] transition duration-300 hover:-translate-y-1 hover:bg-[#d8b53b]"
            >
              무료 상담 신청하기
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-sm"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
              회사 정보
            </p>
            <h3 className="mt-3 text-2xl font-semibold">PREMIUM ESTATE</h3>
          </div>

          <div className="space-y-3 text-sm text-white/80">
            <p>
              <span className="font-semibold text-white">대표번호</span>
              <br />
              010-1234-5678
            </p>
            <p>
              <span className="font-semibold text-white">이메일</span>
              <br />
              contact@example.com
            </p>
            <p>
              <span className="font-semibold text-white">영업시간</span>
              <br />
              09:00~18:00
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0A2342]">
            <div className="flex h-48 items-center justify-center text-sm text-white/70">
              Google Map / Kakao Map 영역
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
