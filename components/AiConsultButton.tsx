"use client";

import Link from "next/link";
import { useState } from "react";

export default function AiConsultButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-36 right-4 z-[60] md:bottom-8 md:right-6">
      {open && (
        <div className="mb-3 w-[290px] overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-2xl">
          <div className="bg-[#0A2342] px-4 py-3 text-white"><p className="font-extrabold">백조 AI 상담</p><p className="mt-0.5 text-xs text-white/70">원하시는 메뉴를 선택해 주세요.</p></div>
          <div className="grid gap-2 p-3">
            <Link href="/properties" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-4 py-3 text-sm font-semibold">🏠 등록 매물 찾아보기</Link>
            <Link href="/properties/map" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-4 py-3 text-sm font-semibold">📍 지도에서 매물 찾기</Link>
            <a href="tel:01077750014" className="rounded-xl bg-[#F8F9FB] px-4 py-3 text-sm font-semibold">☎ 전화 상담 연결</a>
            <a href="sms:01077750014" className="rounded-xl bg-[#F8F9FB] px-4 py-3 text-sm font-semibold">💬 문자로 문의하기</a>
          </div>
          <p className="px-4 pb-3 text-[10px] leading-4 text-[#0A2342]/45">현재는 빠른 상담 메뉴이며, 추후 매물 조건을 대화로 검색하는 AI 기능을 연결할 수 있습니다.</p>
        </div>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="AI 상담 열기" className="flex items-center gap-2 rounded-full border-2 border-white bg-[#1769E0] px-3 py-2.5 text-white shadow-xl transition hover:scale-105">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xl">🤖</span><span className="pr-1 text-sm font-extrabold">AI 상담</span>
      </button>
    </div>
  );
}
