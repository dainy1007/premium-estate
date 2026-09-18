"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AiConsultButton() {
  const [open, setOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) { setOpen(false); setInquiryOpen(false); }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("touchstart", closeOutside); };
  }, [open]);

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) { setResult("성함, 연락처, 문의 내용을 입력해 주세요."); return; }
    setSubmitting(true); setResult("");
    const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message: message.trim() }) });
    if (!response.ok) { setResult("접수 중 오류가 발생했습니다. 다시 시도해 주세요."); setSubmitting(false); return; }
    setName(""); setPhone(""); setMessage(""); setResult("문의가 접수되었습니다. 확인 후 연락드리겠습니다."); setSubmitting(false);
  }

  return (
    <div ref={wrapperRef} className="fixed bottom-[30%] right-3 z-[60] flex max-h-[calc(100vh-3rem)] flex-col items-end md:right-6">
      {open && (
        <div className="mb-2 w-[min(295px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-2xl">
          <div className="flex items-start justify-between bg-[#0A2342] px-3.5 py-2.5 text-white"><div><p className="text-sm font-extrabold">백조 AI 상담</p><p className="mt-0.5 text-[10px] text-white/70">원하시는 메뉴를 선택해 주세요.</p></div><button type="button" onClick={() => { setOpen(false); setInquiryOpen(false); }} aria-label="AI 상담 닫기" className="ml-3 text-lg leading-none text-white/80">×</button></div>
          {!inquiryOpen ? (
            <div className="grid gap-1.5 p-2">
              <Link href="/properties" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">🏠 등록 매물 찾아보기</Link>
              <Link href="/properties/map" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">📍 지도에서 매물 찾기</Link>
              <button type="button" onClick={() => { setInquiryOpen(true); setResult(""); }} className="rounded-xl bg-[#FFF7DE] px-3 py-2 text-left text-sm font-extrabold text-[#0A2342]">✍️ 매물·상담 문의하기</button>
              <a href="tel:01077750014" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">☎ 전화 상담 연결</a>
              <a href="sms:01077750014" onClick={() => setOpen(false)} className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-semibold">💬 문자로 문의하기</a>
            </div>
          ) : (
            <form onSubmit={submitInquiry} className="p-3">
              <div className="mb-2 flex items-center justify-between"><strong className="text-sm text-[#0A2342]">매물·상담 문의</strong><button type="button" onClick={() => setInquiryOpen(false)} className="text-[11px] font-semibold text-[#0A2342]/60">← 메뉴로</button></div>
              <div className="grid grid-cols-2 gap-2"><input value={name} onChange={e => setName(e.target.value)} placeholder="성함 *" className="min-w-0 rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none focus:border-[#C9A227]"/><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="연락처 *" type="tel" className="min-w-0 rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none focus:border-[#C9A227]"/></div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="찾으시는 매물이나 문의 내용을 입력해 주세요. *" rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-2.5 py-2 text-xs leading-5 outline-none focus:border-[#C9A227]"/>
              <button disabled={submitting} type="submit" className="mt-2 w-full rounded-lg bg-[#C9A227] px-3 py-2.5 text-xs font-extrabold text-[#0A2342] disabled:opacity-60">{submitting ? "접수 중..." : "문의 접수하기"}</button>
              {result && <p className="mt-2 text-center text-[10px] leading-4 text-[#0A2342]/70">{result}</p>}
            </form>
          )}
        </div>
      )}
      <button type="button" onClick={() => { setOpen(v => !v); if (open) setInquiryOpen(false); }} aria-expanded={open} aria-label={open ? "AI 상담 닫기" : "AI 상담 열기"} className="flex h-11 items-center gap-1.5 rounded-full border-2 border-white bg-[#1769E0] px-2 text-white shadow-xl transition hover:scale-105"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base">🤖</span><span className="pr-1 text-xs font-extrabold sm:text-sm">AI 상담</span></button>
    </div>
  );
}
