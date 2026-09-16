"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AiConsultButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("touchstart", closeOutside); };
  }, [open]);

  return (
    <div ref={wrapperRef} className="fixed right-3 top-1/2 z-[60] flex max-h-[calc(100vh-5rem)] -translate-y-1/2 flex-col items-end md:right-6">
      {open && (
        <div className="mb-2 w-[min(270px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-2xl">
          <div className="flex items-start justify-between bg-[#0A2342] px-3.5 py-2.5 text-white"><div><p className="text-sm font-extrabold">백조 AI 상담</p><p className="mt-0.5 text-[10px] text-white/70">원하시는 메뉴를 선택해 주세요.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="AI 상담 닫기" className="ml-3 text-lg leading-none text-white/80">×</button></div>
          <div className="grid gap-1.5 p-2"><Link href="/properties" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">🏠 등록 매물 찾아보기</Link><Link href="/properties/map" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">📍 지도에서 매물 찾기</Link><a href="tel:01077750014" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">☎ 전화 상담 연결</a><a href="sms:01077750014" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">💬 문자로 문의하기</a></div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "AI 상담 닫기" : "AI 상담 열기"} className="flex h-11 items-center gap-1.5 rounded-full border-2 border-white bg-[#1769E0] px-2 text-white shadow-xl transition hover:scale-105"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base">🤖</span><span className="pr-1 text-xs font-extrabold sm:text-sm">AI 상담</span></button>
    </div>
  );
}
