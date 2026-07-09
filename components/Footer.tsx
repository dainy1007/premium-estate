"use client";

import { motion } from "framer-motion";

const quickLinks = ["HOME", "서비스", "추천매물", "상담문의"];

export default function Footer() {
  return (
    <footer className="bg-[#0A2540] text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-7xl px-6 py-16 md:px-8"
      >
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_0.8fr]">

          {/* 회사 소개 */}
          <div>
            <p className="text-lg font-semibold tracking-[0.2em] text-[#C9A227]">
              백조현대부동산중개
            </p>

            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/70">
              Trusted Real Estate Partner
            </p>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/80">
              가치를 보는 안목,
              <br />
              신뢰를 만드는 중개.
              <br /><br />
              고객의 성공적인 부동산 선택을 위해
              함께 고민하고 함께 만들어 가겠습니다.
            </p>
          </div>


          {/* 빠른 메뉴 */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              빠른 메뉴
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-white/80">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="transition-colors hover:text-[#C9A227]"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>


          {/* 연락처 */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              상담 문의
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-white/80">

              <li>
                <span className="font-semibold text-white">
                  대표
                </span>
                <br />
                하순영
              </li>

              <li>
                <span className="font-semibold text-white">
                  전화
                </span>
                <br />
                <a
                  href="tel:01077750014"
                  className="hover:text-[#C9A227]"
                >
                  010-7775-0014
                </a>
              </li>

              <li>
                <span className="font-semibold text-white">
                  주소
                </span>
                <br />
                대구광역시 달성군 유가읍 테크노공원로69
                <br />
                파크뷰타워 105호
              </li>

              <li>
                <span className="font-semibold text-white">
                  전문 분야
                </span>
                <br />
                상가 · 원룸 · 투룸 · 다가구
                <br />
                아파트 · 오피스텔 · 창고 · 공장
              </li>

            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          Copyright © 2026 백조현대부동산중개. All Rights Reserved.
        </div>

      </motion.div>
    </footer>
  );
}