"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function Contact() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
    setMessage("");
    setResultMessage("문의가 정상적으로 접수되었습니다. 확인 후 연락드리겠습니다.");
    setIsSubmitting(false);
  }

  return (
    <section id="contact" className="bg-[#0A2342] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold text-[#C9A227]">CONTACT</p>
          <h2 className="text-3xl font-bold">부동산 상담 문의</h2>
          <p className="mt-4 leading-7 text-white/70">
            매매, 임대, 투자 상담이 필요하시면 문의를 남겨주세요. 확인 후 빠르게 연락드리겠습니다.
          </p>

          <div className="mt-8 space-y-3 text-sm text-white/80">
            <p>📍 백조현대부동산중개</p>
            <p>대구광역시 달성군 유가읍</p>
          </div>

          <a
            href="https://map.kakao.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0A2342]"
          >
            지도 보기
          </a>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 text-[#0A2342] shadow-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              성함 <span className="text-red-500">*</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="성함을 입력해 주세요"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]"
              />
            </label>

            <label className="text-sm font-medium">
              연락처 <span className="text-red-500">*</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="010-0000-0000"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium">
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="선택 입력"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            문의 내용 <span className="text-red-500">*</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="문의하실 내용을 입력해 주세요"
              rows={5}
              className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#C9A227]"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full rounded-lg bg-[#C9A227] px-5 py-3 font-bold text-[#0A2342] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "접수 중..." : "문의 접수하기"}
          </button>

          {resultMessage && <p className="mt-4 text-center text-sm font-medium">{resultMessage}</p>}
        </form>
      </div>
    </section>
  );
}
