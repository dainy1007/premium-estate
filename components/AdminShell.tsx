"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return children;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <a href="/admin" className="font-bold text-[#0A2342]">
              백조현대부동산 관리자
            </a>
            <nav className="hidden gap-4 text-sm font-medium text-slate-600 sm:flex">
              <a href="/admin" className="hover:text-[#C9A227]">매물 관리</a>
              <a href="/admin/inquiries" className="hover:text-[#C9A227]">문의 관리</a>
            </nav>
          </div>

          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
