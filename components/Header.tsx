"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";

const navItems = [
  { label: "HOME", href: "/" },
  { label: "회사소개", href: "/#about", sectionId: "about" },
  { label: "전문분야", href: "/#services", sectionId: "services" },
  { label: "매물검색", href: "/properties" },
  { label: "상담문의", href: "/contact" },
];

function SwanLogo() {
  const [logoSrc, setLogoSrc] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/baekjo-logo.webp.base64.tmp", { cache: "force-cache" })
      .then((r) => r.ok ? r.text() : Promise.reject(new Error("logo load failed")))
      .then((base64) => { if (active) setLogoSrc(`data:image/webp;base64,${base64.trim()}`); })
      .catch(() => { if (active) setLogoSrc(""); });
    return () => { active = false; };
  }, []);

  return (
    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D5AF45] bg-[#061f3d] shadow-md sm:h-[82px] sm:w-[82px]" aria-label="백조현대부동산 로고">
      {logoSrc ? <img src={logoSrc} alt="백조현대부동산 백조 로고" className="h-full w-full object-cover" /> : <span className="text-sm font-extrabold text-[#D5AF45]">백조</span>}
    </div>
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
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, backgroundColor: scrolled ? "rgba(255,255,255,0.97)" : brightHome ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0)" }} transition={{ duration: 0.3 }} className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 backdrop-blur-sm">
      <div className="mx-auto flex h-28 max-w-[1380px] items-center justify-between px-6 lg:px-8">
        <Link href="/" onClick={handleHomeClick} className="flex min-w-0 items-center gap-5">
          <SwanLogo />
          <div className="min-w-0">
            <p className={`whitespace-nowrap text-[22px] font-black tracking-[-0.04em] sm:text-[28px] ${textClass}`}>백조현대부동산중개</p>
            <div className="mt-2 hidden items-center gap-3 sm:flex">
              <span className="h-px w-8 bg-[#D5AF45]" />
              <p className={`whitespace-nowrap text-[10px] font-semibold tracking-[0.2em] sm:text-[11px] ${darkText ? "text-[#52647a]" : "text-white/80"}`}>BAEKJO HYUNDAI REAL ESTATE</p>
            </div>
          </div>
        </Link>
        <nav className="hidden items-center xl:flex">
          {navItems.map((item, index) => (
            <div key={item.label} className="flex items-center">
              {index > 0 && <span className="mx-5 h-4 w-px bg-slate-300" />}
              <Link href={item.href} onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : undefined} className={`whitespace-nowrap text-[15px] font-bold transition-colors hover:text-[#C9A227] ${textClass}`}>{item.label}</Link>
            </div>
          ))}
        </nav>
        <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`text-2xl xl:hidden ${textClass}`} aria-label="메뉴 열기">☰</button>
      </div>
      {mobileMenuOpen && <div className="bg-white p-6 shadow-lg xl:hidden">{navItems.map((item) => <Link key={item.label} href={item.href} onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : () => setMobileMenuOpen(false)} className="block border-b border-slate-100 py-3 font-semibold text-[#071f3b]">{item.label}</Link>)}</div>}
    </motion.header>
  );
}
