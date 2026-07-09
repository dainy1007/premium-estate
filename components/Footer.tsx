"use client";

import { motion } from "framer-motion";

const quickLinks = ["HOME", "회사소개", "서비스", "추천매물", "상담문의"];

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
          <div>
            <p className="text-lg font-semibold tracking-[0.3em] text-[#C9A227]">
              PREMIUM ESTATE
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.25em] text-white/70">
              Trusted Real Estate
            </p>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/80">
              정직과 신뢰를 바탕으로 고객의 자산 가치를 높여드립니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">빠른 메뉴</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-[#C9A227]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">연락처</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              <li>
                <span className="font-semibold text-white">대표번호</span>
                <br />
                010-1234-5678
              </li>
              <li>
                <span className="font-semibold text-white">이메일</span>
                <br />
                contact@example.com
              </li>
              <li>
                <span className="font-semibold text-white">주소</span>
                <br />
                대구광역시 달성군
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          Copyright © 2026 PREMIUM ESTATE
        </div>
      </motion.div>
    </footer>
  );
}
