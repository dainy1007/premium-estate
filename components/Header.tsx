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
        <div className="mx-auto flex h-[106px] max-w-[1600px] items-center justify-between px-4 sm:h-[118px] sm:px-6 xl:h-[142px] xl:px-8 2xl:px-10">
          <Link href="/" onClick={handleHomeClick} className="flex min-w-0 items-center gap-3 sm:gap-4 xl:gap-5">
            <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-full sm:h-[88px] sm:w-[88px] xl:h-[108px] xl:w-[108px]">
              <img
                src="/baekjo-header-logo.png"
                alt="백조현대부동산중개 백조 로고"
                className="h-full w-full object-cover object-left"
              />
            </div>

            <div className="min-w-0">
              <div className="whitespace-nowrap text-[22px] font-black leading-none tracking-[-0.045em] text-[#071f3b] sm:text-[28px] xl:text-[42px] 2xl:text-[44px]">
                백조현대부동산중개
              </div>
              <div className="mt-2 h-[3px] w-full bg-[#D5A514] xl:mt-3 xl:h-[4px]" />
              <div className="mt-2 whitespace-nowrap text-[10px] font-bold tracking-[0.18em] text-[#173553] sm:text-[12px] xl:text-[16px] 2xl:text-[17px]">
                BAEKJO HYUNDAI REAL ESTATE
              </div>
            </div>
          </Link>

          <nav className="hidden items-center xl:flex">
            {navItems.map((item, index) => (
              <div key={item.label} className="flex items-center">
                {index > 0 && <span className="mx-5 h-5 w-px bg-slate-300 2xl:mx-6" />}
                <Link
                  href={item.href}
                  onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : undefined}
                  className={`whitespace-nowrap text-[18px] font-bold transition-colors hover:text-[#C9A227] 2xl:text-[20px] ${textClass}`}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`text-2xl xl:hidden ${textClass}`}
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

      {brightHome && <div aria-hidden className="h-[106px] sm:h-[118px] xl:h-[142px]" />}
    </>
  );
}
