"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const navItems = [
  { label: "매물검색", href: "/properties" },
  { label: "전문분야", href: "/#services", sectionId: "services" },
  { label: "회사소개", href: "/#about", sectionId: "about" },
  { label: "상담문의", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const router = useRouter();
  const brightHome = pathname === "/";

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 20));

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      event.preventDefault();
      window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      event.preventDefault();
      const section = document.getElementById(sectionId);
      if (section) {
        window.history.replaceState(null, "", `/#${sectionId}`);
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    event.preventDefault();
    router.push(`/#${sectionId}`);
  };

  const darkText = scrolled || brightHome;
  const textClass = darkText ? "text-[#071f3b]" : "text-white";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: scrolled
            ? "rgba(255,255,255,0.98)"
            : brightHome
              ? "rgba(255,255,255,0.98)"
              : "rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.3 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 backdrop-blur-sm"
      >
        <div className="relative mx-auto flex h-[94px] w-full max-w-[1600px] items-center justify-between gap-2 px-4 sm:h-[108px] sm:px-6 xl:flex xl:h-[126px] xl:gap-0 xl:px-6 2xl:px-10">
          <nav className="hidden min-w-0 items-center gap-0 xl:flex xl:w-[34%] xl:shrink-0 xl:justify-start">
            {navItems.map((item, index) => (
              <div key={item.label} className="flex items-center">
                {index > 0 && <span className="mx-2.5 h-4 w-px bg-slate-300 2xl:mx-3" />}
                <Link href={item.href} onClick={item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : undefined} className={`whitespace-nowrap text-[13px] font-bold transition-colors hover:text-[#C9A227] 2xl:text-[14px] ${textClass}`}>{item.label}</Link>
              </div>
            ))}
          </nav>

          <Link href="/" onClick={handleHomeClick} className="flex min-w-0 items-center xl:w-[34%] xl:shrink-0 xl:justify-center" aria-label="백조현대부동산중개 홈">
            <img src="/brand-logo?v=20260901-header-inset" alt="백조현대부동산중개" className="h-[76px] w-auto max-w-full object-contain sm:h-[92px] xl:h-[100px] 2xl:h-[114px]" />
          </Link>

          <a href="tel:01077750014" aria-label="010-7775-0014 전화 상담 연결" className="hidden min-w-0 items-center gap-2 text-[#071f3b] transition-colors hover:text-[#C9A227] xl:flex xl:w-[32%] xl:shrink-0 xl:justify-end">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-8 w-8 shrink-0 2xl:h-10 2xl:w-10"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.56 3.58.56a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.56 3.58a1 1 0 01-.25 1.01l-2.19 2.2z"/></svg>
            <span className="whitespace-nowrap text-[20px] font-extrabold tracking-tight 2xl:text-[25px]">010-7775-0014</span>
          </a>

          <a href="tel:01077750014" className="ml-auto mr-4 flex items-center gap-1.5 text-sm font-extrabold text-[#071f3b] xl:hidden" aria-label="전화 상담 010-7775-0014">☎ <span className="hidden sm:inline">010-7775-0014</span></a>
          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`ml-auto text-2xl xl:hidden ${textClass}`} aria-label="메뉴 열기">☰</button>
        </div>

        {mobileMenuOpen && (
          <div className="bg-white p-6 shadow-lg xl:hidden">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : () => setMobileMenuOpen(false)} className="block border-b border-slate-100 py-3 font-semibold text-[#071f3b]">
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </motion.header>

      {brightHome && <div aria-hidden className="h-[94px] sm:h-[108px] xl:h-[126px]" />}
    </>
  );
}
