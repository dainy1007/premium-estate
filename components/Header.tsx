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
        <div className="relative mx-auto flex h-[94px] max-w-[1700px] items-center justify-between px-4 sm:h-[108px] sm:px-8 xl:h-[126px] xl:px-10 2xl:px-12">
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex min-w-0 items-center xl:absolute xl:left-[80px] 2xl:left-[96px]"
            aria-label="백조현대부동산중개 홈"
          >
            <img
              src="/brand/baekjo-approved-logo.webp?v=20260901-1418"
              alt="백조현대부동산중개"
              className="h-[72px] w-auto object-contain sm:h-[86px] xl:h-[102px] 2xl:h-[106px]"
            />
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
