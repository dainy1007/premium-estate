"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: number;
  created_at: string;
  updated_at: string | null;
  name: string;
  email: string | null;
  phone: string;
  property_title: string | null;
  message: string;
  status: string;
  reply: string | null;
  reply_sent_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function InquiryRepliesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    void loadInquiries();
  }, []);

  async function loadInquiries() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("inquiries")
      .select(
        "id, created_at, updated_at, name, email, phone, property_title, message, status, reply, reply_sent_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("이메일 답변 문의 조회 오류:", error);
      setErrorMessage(
        "문의 목록을 불러오지 못했습니다. reply_sent_at 컬럼이 추가되었는지 확인해 주세요.",
      );
      setLoading(false);
      return;
    }

    const nextInquiries = (data ?? []) as Inquiry[];
    setInquiries(nextInquiries);

    if (selectedId === null && nextInquiries.length > 0) {
      const firstWithEmail = nextInquiries.find((item) => item.email) ?? nextInquiries[0];
      selectInquiry(firstWithEmail);
    }

    setLoading(false);
  }

  function selectInquiry(inquiry: Inquiry) {
    setSelectedId(inquiry.id);
    setReply(inquiry.reply ?? "");
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function sendReply() {
    const inquiry = inquiries.find((item) => item.id === selectedId);
    if (!inquiry) return;

    if (!inquiry.email) {
      setErrorMessage("고객 이메일이 없는 문의입니다.");
      return;
    }

    if (!reply.trim()) {
      setErrorMessage("답변 내용을 입력해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `${inquiry.name}님(${inquiry.email})에게 답변 이메일을 발송하시겠습니까?`,
    );
    if (!confirmed) return;

    setSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/inquiries/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: inquiry.id, reply: reply.trim() }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        sentAt?: string;
        error?: string;
        emailSent?: boolean;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            (result.emailSent
              ? "이메일은 발송됐지만 이력 저장에 실패했습니다."
              : "이메일 발송에 실패했습니다."),
        );
      }

      const sentAt = result.sentAt ?? new Date().toISOString();
      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id
            ? {
                ...item,
                reply: reply.trim(),
                reply_sent_at: sentAt,
                status: "completed",
                updated_at: sentAt,
              }
            : item,
        ),
      );
      setSuccessMessage(`${inquiry.name}님에게 답변 이메일을 발송했습니다.`);
    } catch (error) {
      console.error("문의 답변 이메일 발송 오류:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "이메일 발송 중 오류가 발생했습니다.",
      );
    } finally {
      setSending(false);
    }
  }

  const filteredInquiries = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return inquiries;

    return inquiries.filter((inquiry) =>
      [
        inquiry.name,
        inquiry.email ?? "",
        inquiry.phone,
        inquiry.property_title ?? "",
        inquiry.message,
        inquiry.reply ?? "",
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [inquiries, searchText]);

  const selectedInquiry = inquiries.find((item) => item.id === selectedId) ?? null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#C9A227]">백조현대부동산 관리자</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0A2342]">문의 답변 이메일</h1>
          <p className="mt-2 text-sm text-slate-600">
            고객 문의를 선택하고 저장된 답변을 이메일로 발송합니다.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-5 rounded-xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="고객·이메일·매물 검색"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#C9A227]"
              />
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <p className="p-6 text-center text-sm text-slate-500">문의 목록을 불러오는 중입니다.</p>
              ) : filteredInquiries.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">표시할 문의가 없습니다.</p>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <button
                    key={inquiry.id}
                    type="button"
                    onClick={() => selectInquiry(inquiry)}
                    className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                      selectedId === inquiry.id ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0A2342]">{inquiry.name}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {inquiry.email ?? "이메일 없음"}
                        </p>
                      </div>
                      {inquiry.reply_sent_at && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          발송완료
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {inquiry.property_title ?? inquiry.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(inquiry.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            {!selectedInquiry ? (
              <div className="flex min-h-96 items-center justify-center text-slate-500">
                왼쪽에서 문의를 선택해 주세요.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#C9A227]">문의 #{selectedInquiry.id}</p>
                    <h2 className="mt-1 text-2xl font-bold text-[#0A2342]">
                      {selectedInquiry.name}님 답변
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedInquiry.email ?? "고객 이메일이 입력되지 않았습니다."}
                    </p>
                  </div>
                  {selectedInquiry.reply_sent_at && (
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      최근 발송: {formatDate(selectedInquiry.reply_sent_at)}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-[#0A2342]">문의 매물</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedInquiry.property_title ?? "일반 문의"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold text-[#0A2342]">고객 문의</p>
                  <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                    {selectedInquiry.message}
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-[#0A2342]">이메일 답변 내용</span>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={12}
                    maxLength={5000}
                    placeholder="고객에게 발송할 답변을 입력하세요."
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-300 px-4 py-4 text-sm leading-7 outline-none focus:border-[#C9A227]"
                  />
                  <span className="mt-2 block text-right text-xs text-slate-400">
                    {reply.length.toLocaleString()} / 5,000자
                  </span>
                </label>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    발송 성공 시 문의 상태가 처리완료로 변경되고 발송 시간이 저장됩니다.
                  </p>
                  <button
                    type="button"
                    disabled={sending || !selectedInquiry.email || !reply.trim()}
                    onClick={() => void sendReply()}
                    className="rounded-xl bg-[#0A2342] px-6 py-3 text-sm font-semibold text-white hover:bg-[#12345f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "발송 중..." : "답변 이메일 발송"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
