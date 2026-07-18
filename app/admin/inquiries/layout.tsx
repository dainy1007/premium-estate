import Link from "next/link";
import type { ReactNode } from "react";

export default function InquiriesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          <Link
            href="/admin/inquiries"
            className="rounded-lg bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
          >
            문의 관리
          </Link>
          <Link
            href="/admin/inquiries/replies"
            className="rounded-lg border border-[#0A2342] px-4 py-2 text-sm font-semibold text-[#0A2342] hover:bg-slate-50"
          >
            이메일 답변
          </Link>
          <Link
            href="/admin"
            className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            관리자 홈
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
