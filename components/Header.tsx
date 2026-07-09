"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";

const navItems = [
  "HOME",
  "회사소개",
  "서비스",
  "추천매물",
  "고객후기",
  "상담문의",
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0)",
        boxShadow: scrolled
          ? "0 10px 30px rgba(10, 37, 64, 0.08)"
          : "0 0 0 rgba(0, 0, 0, 0)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold tracking-[0.3em] ${
              scrolled
                ? "border-[#C9A227] bg-[#0A2540] text-[#C9A227]"
                : "border-white/90 bg-white/10 text-white"
            }`}
          >
            PE
          </div>
          <div>
            <p
              className={`text-base font-semibold tracking-[0.24em] ${
                scrolled ? "text-[#0A2540]" : "text-white"
              }`}
            >
              PREMIUM ESTATE
            </p>
            <p
              className={`text-xs uppercase tracking-[0.3em] ${
                scrolled ? "text-[#0A2540]/70" : "text-white/80"
              }`}
            >
              Trusted Real Estate
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className={`text-sm font-medium transition-colors hover:text-[#C9A227] ${
                scrolled ? "text-[#0A2540]" : "text-white"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0A2540] shadow-lg shadow-[#C9A227]/20 transition-transform hover:-translate-y-0.5"
          >
            무료상담
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border md:hidden ${
            scrolled
              ? "border-[#0A2540]/10 bg-white text-[#0A2540]"
              : "border-white/30 bg-white/10 text-white"
          }`}
        >
          <div className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </div>
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? "auto" : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden border-t border-[#0A2540]/10 bg-white/95 backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-[#0A2540] transition-colors hover:text-[#C9A227]"
            >
              {item}
            </a>
          ))}
          <a
            href="#contact"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-[#0A2540]"
          >
            무료상담
          </a>
        </div>
      </motion.div>
    </motion.header>
  );
}
