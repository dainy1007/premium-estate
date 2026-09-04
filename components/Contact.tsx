"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type ContactProps = {
  propertyTitle?: string;
  propertyId?: string;
};

export default function Contact({ propertyTitle = "", propertyId = "" }: ContactProps) {
  const propertyLabel = propertyTitle.trim();
  const initialMessage = propertyLabel
    ? `[매물 문의${propertyId ? ` #${propertyId}` : ""}] ${propertyLabel}\n\n이 매물에 대해 문의드립니다.`
    : "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setResultMessage("성함, 연락처, 문의 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setResultMessage("");

    const { error } = await supabase.from("inquiries").insert({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      message: message.trim(),
      property_title: propertyLabel || null,
      status: "new",
    });

    if (error) {
      console.error("문의 접수 오류:", error);
      setResultMessage("문의 접수 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsSubmitting(false);
      return;
    }

    setName("");
    setPhone("");
    setEmail("");
    setMessage(propertyLabel ? initialMessage : "");
    setResultMessage("문의가 정상적으로 접수되었습니다. 확인 후 연락드리겠습니다.");
    setIsSubmitting(false);
  }

  return (
    <section id="contact" className="bg-[#0A2342] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold text-[#C9A227]">CONTACT</p>
          <h2 className="text-3xl font-bold">{propertyLabel ? "이 매물 바로 문의" : "부동산 상담 문의"}</h2>
          {propertyLabel ? (
            <div className="mt-4 rounded-2xl border border-[#C9A227]/35 bg-white/5 p-4">
              <p className="text-xs font-semibold text-[#C9A227]">문의 매물{propertyId ? ` · #${propertyId}` : ""}</p>
              <p className="mt-2 break-keep font-bold text-white">{propertyLabel}</p>
              <p className="mt-2 text-sm leading-6 text-white/65">성함과 연락처를 남겨주시면 해당 매물을 확인해 빠르게 연락드리겠습니다.</p>
            </div>
          ) : (
            <p className="mt-4 leading-7 text-white/70">
              <span className="block">매매, 임대, 투자 상담이 필요하시면 문의를 남겨주세요.</span>
              <span className="block">확인 후 빠르게 연락드리겠습니다.</span>
            </p>
          )}

          <div className="mt-8 space-y-5 text-sm leading-6 text-white/85">
            <div>
              <p className="font-semibold text-white">상담 가능 분야</p>
              <p className="mt-1 text-white/70">매매 · 전세 · 월세 · 상가 · 토지 · 창고/공장</p>
            </div>
            <div>
              <p className="font-semibold text-white">주요 상담 지역</p>
              <p className="mt-1 text-white/70">현풍 · 유가 · 구지 · 대구테크노폴리스</p>
            </div>
          </div>

          <a
            href="tel:01077750014"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-[#C9A227] px-6 py-3 font-bold text-[#E1B723] transition hover:bg-[#C9A227] hover:text-[#0A2342]"
          >
            전화 상담 바로가기 010-7775-0014
          </a>

          <p className="mt-5 text-sm leading-6 text-white/55">
            문의 내용을 남겨주시면 확인 후 순차적으로 연락드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 text-[#0A2342] shadow-xl">
          {propertyLabel && (
            <div className="mb-5 rounded-xl bg-[#FFF9E8] px-4 py-3 text-sm font-semibold text-[#0A2342]">
              선택 매물: {propertyLabel}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              성함 <span className="text-red-500">*</span>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="성함을 입력해 주세요" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]" />
            </label>
            <label className="text-sm font-medium">
              연락처 <span className="text-red-500">*</span>
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-0000-0000" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium">
            이메일
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="선택 입력" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]" />
          </label>
          <label className="mt-4 block text-sm font-medium">
            문의 내용 <span className="text-red-500">*</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="문의하실 내용을 입력해 주세요" rows={5} className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]" />
          </label>
          <button type="submit" disabled={isSubmitting} className="mt-5 w-full rounded-lg bg-[#C9A227] px-5 py-3 font-bold text-[#0A2342] disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "접수 중..." : propertyLabel ? "이 매물 문의 접수하기" : "문의 접수하기"}
          </button>
          {resultMessage && <p className="mt-4 text-center text-sm font-medium">{resultMessage}</p>}
        </form>
      </div>
    </section>
  );
}
