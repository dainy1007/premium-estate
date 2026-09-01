"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const navItems = [
  { label: "HOME", href: "/" },
  { label: "회사소개", href: "/#about", sectionId: "about" },
  { label: "전문분야", href: "/#services", sectionId: "services" },
  { label: "매물검색", href: "/properties" },
  { label: "상담문의", href: "/contact" },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 150 118" aria-hidden className="h-[68px] w-[86px] shrink-0 sm:h-[80px] sm:w-[100px] xl:h-[96px] xl:w-[122px]">
      <defs>
        <linearGradient id="goldLogo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2C34A" />
          <stop offset="1" stopColor="#B98205" />
        </linearGradient>
      </defs>
      <path d="M9 91c18-10 35-13 53-9 16 4 28 13 44 13 12 0 23-4 35-13-12 18-30 28-50 27-17 0-31-8-47-9-12-1-23 2-35 8 8-8 15-13 22-17Z" fill="#082746" />
      <path d="M10 86c19-9 36-10 52-5 15 4 28 13 45 12 12 0 22-4 34-12-12 15-28 22-45 22-17 0-31-8-47-10-14-2-26 1-39 7Z" fill="url(#goldLogo)" />
      <path d="M21 72V47l21-17 21 17v25Z" fill="#0A2B4D" />
      <path d="M28 72V50l14-12 14 12v22Z" fill="#fff" />
      <rect x="38" y="53" width="9" height="14" rx="1" fill="#0A2B4D" />
      <path d="M58 38V18h14v20M74 38V9h16v35M92 45V23h13v26" fill="none" stroke="#0A2B4D" strokeWidth="8" />
      <path d="M54 74c22 4 32-11 34-29 2-14-2-27 7-34 8-7 19-4 23 3-9-3-16 2-16 10 0 7 6 10 14 12-6 4-12 5-19 3 5 11 4 23-2 34-7 13-20 20-41 15Z" fill="#fff" stroke="#C7D0D9" strokeWidth="2.5" />
      <path d="M69 78c14-2 25-10 31-24-1 15-9 27-25 34-9 4-19 4-31 1 10-1 18-5 25-11Z" fill="#0A2B4D" />
      <path d="M68 70c11-2 21-8 29-18-4 12-12 21-24 26-7 3-14 4-22 3 6-3 12-7 17-11Z" fill="#E2E8EE" />
      <path d="M113 33c8 0 14 3 20 8-8 3-15 3-22-1Z" fill="url(#goldLogo)" />
      <circle cx="108" cy="23" r="2.4" fill="#0A2B4D" />
      <path d="M101 16c4-4 9-5 14-3 4 2 7 5 8 9-6-2-11-1-15 2Z" fill="#0A2B4D" />
    </svg>
  );
}

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
        <div className="relative mx-auto flex h-[94px] max-w-[1700px] items-center justify-between px-4 sm:h-[108px] sm:px-8 xl:h-[126px] xl:px-10 2xl:px-12">
          <Link href="/" onClick={handleHomeClick} className="flex min-w-0 items-center gap-2 sm:gap-3 xl:absolute xl:left-[48px] xl:gap-4 2xl:left-[56px]">
            <BrandMark />
            <div className="min-w-0">
              <div className="whitespace-nowrap text-[22px] font-black leading-none tracking-[-0.045em] text-[#071f3b] sm:text-[29px] xl:text-[39px] 2xl:text-[42px]">
                백조현대부동산중개
              </div>
              <div className="mt-2 h-[3px] w-full bg-[#D5A514] xl:mt-2.5 xl:h-[4px]" />
              <div className="mt-2 whitespace-nowrap text-[9px] font-bold tracking-[0.18em] text-[#173553] sm:text-[12px] xl:text-[14px] 2xl:text-[15px]">
                BAEKJO HYUNDAI REAL ESTATE
              </div>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center xl:flex">
            {navItems.map((item, index) => (
              <div key={item.label} className="flex items-center">
                {index > 0 && <span className="mx-4 h-5 w-px bg-slate-300 2xl:mx-5" />}
                <Link
                  href={item.href}
                  onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : undefined}
                  className={`whitespace-nowrap text-[17px] font-bold transition-colors hover:text-[#C9A227] 2xl:text-[19px] ${textClass}`}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`ml-auto text-2xl xl:hidden ${textClass}`}
            aria-label="메뉴 열기"
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="bg-white p-6 shadow-lg xl:hidden">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : () => setMobileMenuOpen(false)}
                className="block border-b border-slate-100 py-3 font-semibold text-[#071f3b]"
              >
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
