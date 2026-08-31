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
      .then((response) => response.ok ? response.text() : Promise.reject(new Error("logo load failed")))
      .then((base64) => { if (active) setLogoSrc(`data:image/webp;base64,${base64.trim()}`); })
      .catch(() => { if (active) setLogoSrc(""); });
    return () => { active = false; };
  }, []);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#C9A227]/60 bg-[#0A2540] shadow-sm sm:h-[72px] sm:w-[72px]" aria-label="백조현대부동산 공식 로고">
      {logoSrc ? <img src={logoSrc} alt="백조현대부동산 백조 로고" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-[#C9A227]">백조</span>}
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

  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, backgroundColor: scrolled ? "rgba(255,255,255,0.96)" : brightHome ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0)" }} transition={{ duration: 0.3 }} className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <Link href="/" onClick={handleHomeClick} className="flex items-center gap-4">
          <SwanLogo />
          <div>
            <p className={`text-xl font-extrabold tracking-tight sm:text-2xl ${darkText ? "text-[#0A2540]" : "text-white"}`}>백조현대부동산중개</p>
            <p className={`mt-0.5 text-xs sm:text-sm ${darkText ? "text-[#0A2540]/60" : "text-white/80"}`}>Trusted Real Estate Partner</p>
          </div>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {navItems.map((item) => <Link key={item.label} href={item.href} onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : undefined} className={`text-sm font-medium hover:text-[#C9A227] ${darkText ? "text-[#0A2540]" : "text-white"}`}>{item.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href="tel:01077750014" className="rounded-full border border-[#C9A227] bg-white/70 px-4 py-2 text-sm font-semibold text-[#C9A227]">☎ 010-7775-0014</a>
          <Link href="/contact" className="rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0A2540]">상담문의</Link>
        </div>
        <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={darkText ? "text-2xl text-[#0A2540] md:hidden" : "text-2xl text-white md:hidden"} aria-label="메뉴 열기">☰</button>
      </div>
      {mobileMenuOpen && <div className="bg-white p-6 shadow-lg md:hidden">{navItems.map((item) => <Link key={item.label} href={item.href} onClick={item.href === "/" ? handleHomeClick : item.sectionId ? (event) => handleSectionClick(event, item.sectionId!) : () => setMobileMenuOpen(false)} className="block py-2 text-[#0A2540]">{item.label}</Link>)}<div className="mt-3 grid grid-cols-2 gap-3"><a href="tel:01077750014" className="rounded-full border border-[#C9A227] py-3 text-center font-semibold text-[#0A2540]">전화 상담</a><Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-[#C9A227] py-3 text-center font-semibold text-[#0A2540]">문의 남기기</Link></div></div>}
    </motion.header>
  );
}
