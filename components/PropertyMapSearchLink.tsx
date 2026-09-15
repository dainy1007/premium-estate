"use client";

import Link from "next/link";

export default function PropertyMapSearchLink() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
      <Link
        href="/properties/map"
        className="group flex items-center justify-between rounded-2xl border border-[#0A2342]/10 bg-white px-5 py-4 shadow-sm transition hover:border-[#C9A227] hover:shadow-md"
        aria-label="지도에서 등록 매물 찾기"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C9A227]/15 text-xl" aria-hidden>⌖</span>
          <div>
            <p className="font-extrabold text-[#0A2342]">지도에서 매물 찾기</p>
            <p className="mt-0.5 text-xs text-[#0A2342]/60">백조현대부동산 등록 매물을 지도에서 확인하세요</p>
          </div>
        </div>
        <span className="text-2xl text-[#C9A227] transition group-hover:translate-x-1" aria-hidden>›</span>
      </Link>
    </div>
  );
}
