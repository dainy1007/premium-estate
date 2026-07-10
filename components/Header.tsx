"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const navItems = [
  "HOME",
  "회사소개",
  "전문분야",
  "추천매물",
  "상담문의",
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: scrolled
          ? "rgba(255,255,255,0.96)"
          : "rgba(255,255,255,0)",
      }}
      transition={{ duration: 0.3 }}
      className="fixed inset-x-0 top-0 z-50"
    >

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <a href="#" className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A2540] text-xs font-bold text-[#C9A227]">
            백조
          </div>


          <div>

            <p className={`font-bold tracking-wide ${
              scrolled ? "text-[#0A2540]" : "text-white"
            }`}>
              백조현대부동산중개
            </p>


            <p className={`text-xs ${
              scrolled ? "text-[#0A2540]/60" : "text-white/80"
            }`}>
              Trusted Real Estate Partner
            </p>

          </div>

        </a>


        <nav className="hidden gap-8 md:flex">

          {navItems.map((item)=>(
            <a
              key={item}
              href="#"
              className={`text-sm font-medium hover:text-[#C9A227] ${
                scrolled
                ? "text-[#0A2540]"
                : "text-white"
              }`}
            >
              {item}
            </a>
          ))}

        </nav>


        <div className="hidden md:flex items-center gap-3">

          <a
            href="tel:01077750014"
            className="rounded-full border border-[#C9A227] px-4 py-2 text-sm font-semibold text-[#C9A227]"
          >
            ☎ 010-7775-0014
          </a>


          <a
            href="#contact"
            className="rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0A2540]"
          >
            상담문의
          </a>

        </div>


        <button
          onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white"
        >
          ☰
        </button>

      </div>


      {mobileMenuOpen && (

        <div className="bg-white p-6 md:hidden">

          {navItems.map((item)=>(
            <a
              key={item}
              href="#"
              className="block py-2 text-[#0A2540]"
            >
              {item}
            </a>
          ))}


          <a
            href="tel:01077750014"
            className="mt-3 block rounded-full bg-[#C9A227] py-3 text-center font-semibold"
          >
            ☎ 전화 상담
          </a>

        </div>

      )}

    </motion.header>
  );
}