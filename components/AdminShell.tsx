"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const adminLinks = [
  { href: "/admin", label: "매물 관리" },
  { href: "/admin/inquiries", label: "문의 관리" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === "/admin/login") return children;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href || pathname.startsWith("/admin/properties") : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/admin" className="truncate font-bold text-[#0A2342]">
              백조현대부동산 관리자
            </Link>

            <nav className="hidden items-center gap-2 md:flex" aria-label="관리자 메뉴">
              {adminLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive(item.href)
                      ? "bg-[#0A2342] text-white"
                      : "text-slate-600 hover:bg-[#C9A227]/10 hover:text-[#0A2342]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/"
              target="_blank"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              홈페이지 보기
            </Link>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                로그아웃
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-menu"
          >
            메뉴
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="admin-mobile-menu" className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <nav className="grid gap-2" aria-label="모바일 관리자 메뉴">
              {adminLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    isActive(item.href) ? "bg-[#0A2342] text-white" : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                target="_blank"
                className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                홈페이지 보기
              </Link>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-600"
                >
                  로그아웃
                </button>
              </form>
            </nav>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
