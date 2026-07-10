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

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            부동산 상담 신청
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
            상가, 아파트, 원룸·투룸, 창고·공장 등
            <br />
            고객 상황에 맞는 전문 상담을 제공합니다.
          </p>

          <form className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">
                이름
              </label>
              <input
                type="text"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#C9A227]"
                placeholder="성함을 입력해주세요"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">
                전화번호
              </label>
              <input
                type="tel"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#C9A227]"
                placeholder="010-7775-0014"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">
                문의내용
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#C9A227]"
                placeholder="찾으시는 부동산 내용을 입력해주세요."
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-6 py-3.5 text-sm font-semibold text-[#0A2342] transition duration-300 hover:-translate-y-1 hover:bg-[#d8b53b]"
            >
              상담 신청하기
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

            <h3 className="mt-3 text-2xl font-semibold">
              백조현대부동산중개
            </h3>
          </div>


          <div className="space-y-4 text-sm text-white/80">

            <p>
              <span className="font-semibold text-white">
                대표
              </span>
              <br />
              하순영
            </p>


            <p>
              <span className="font-semibold text-white">
                대표번호
              </span>
              <br />

              <a
                href="tel:01077750014"
                className="hover:text-[#C9A227]"
              >
                010-7775-0014
              </a>
            </p>


            <p>
              <span className="font-semibold text-white">
                주소
              </span>
              <br />
              대구광역시 달성군 유가읍 테크노공원로69
              <br />
              파크뷰타워 105호
            </p>


            <p>
              <span className="font-semibold text-white">
                영업시간
              </span>
              <br />
              09:00 ~ 18:00
            </p>


            <p>
              <span className="font-semibold text-white">
                전문 분야
              </span>
              <br />
              상가 · 원룸 · 투룸 · 다가구
              <br />
              아파트 · 오피스텔 · 창고 · 공장
            </p>

          </div>


          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0A2342]">
            <div className="flex h-48 items-center justify-center text-sm text-white/70">
              대구 달성군 유가읍
              <br />
              찾아오시는 길 지도 영역
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}