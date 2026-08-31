"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const BUILDING_LEDGER_VIEW_URL = "https://www.eais.go.kr/moct/bci/aaa01/BCIAAA01V01";
const REGISTRY_VIEW_URL = "https://www.iros.go.kr";

const adminLinks = [
  { href: "/admin/overview", label: "운영 현황" },
  { href: "/admin", label: "매물 관리" },
  { href: "/admin/building-ledger", label: "건축물대장" },
  { href: "/admin/building-directory", label: "건물 장부" },
  { href: "/admin/vacancy-sms", label: "공실 문자" },
  { href: "/admin/bulk", label: "일괄 관리" },
  { href: "/admin/inquiries", label: "문의 관리" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    hasUnsavedChanges.current = false;

    const markDirty = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest("form")) return;
      if (target.closest("form")?.dataset.ignoreUnsavedWarning === "true") return;
      hasUnsavedChanges.current = true;
    };

    const clearDirty = (event: Event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement) hasUnsavedChanges.current = false;
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const confirmed = window.confirm("저장하지 않은 변경사항이 있습니다. 페이지를 이동하시겠습니까?");
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      hasUnsavedChanges.current = false;
    };

    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("submit", clearDirty, true);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("submit", clearDirty, true);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  if (pathname === "/admin/login") return children;

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href || pathname.startsWith("/admin/properties");
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/admin/overview" className="truncate font-bold text-[#0A2342]">백조현대부동산 관리자</Link>
            <nav className="hidden items-center gap-2 md:flex" aria-label="관리자 메뉴">
              {adminLinks.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isActive(item.href) ? "bg-[#0A2342] text-white" : "text-slate-600 hover:bg-[#C9A227]/10 hover:text-[#0A2342]"}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a href={BUILDING_LEDGER_VIEW_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#C9A227] px-3 py-2 text-sm font-semibold text-[#0A2342] hover:bg-[#C9A227]/10">건축물대장 열람</a>
            <a href={REGISTRY_VIEW_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#C9A227] px-3 py-2 text-sm font-semibold text-[#0A2342] hover:bg-[#C9A227]/10">등기부등본 열람</a>
            <Link href="/" target="_blank" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">홈페이지 보기</Link>
            <form action="/api/admin/logout" method="post" data-ignore-unsaved-warning="true"><button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">로그아웃</button></form>
          </div>

          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden" aria-expanded={mobileMenuOpen} aria-controls="admin-mobile-menu">메뉴</button>
        </div>

        {mobileMenuOpen && (
          <div id="admin-mobile-menu" className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <nav className="grid gap-2" aria-label="모바일 관리자 메뉴">
              {adminLinks.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${isActive(item.href) ? "bg-[#0A2342] text-white" : "bg-slate-50 text-slate-700"}`}>{item.label}</Link>
              ))}
              <a href={BUILDING_LEDGER_VIEW_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-[#C9A227] bg-[#C9A227]/10 px-4 py-3 text-sm font-semibold text-[#0A2342]">건축물대장 열람</a>
              <a href={REGISTRY_VIEW_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-[#C9A227] bg-[#C9A227]/10 px-4 py-3 text-sm font-semibold text-[#0A2342]">등기부등본 열람</a>
              <Link href="/" target="_blank" className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">홈페이지 보기</Link>
              <form action="/api/admin/logout" method="post" data-ignore-unsaved-warning="true"><button type="submit" className="w-full rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-600">로그아웃</button></form>
            </nav>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
