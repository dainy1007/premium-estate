"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type InquiryStatus = "new" | "in_progress" | "completed";

type Inquiry = {
  id: number;
  created_at: string;
  updated_at: string | null;
  name: string;
  phone: string;
  email: string | null;
  property_title: string | null;
  message: string;
  status: InquiryStatus | string;
  admin_memo: string | null;
  reply: string | null;
};

const statusOptions: Array<{
  value: InquiryStatus;
  label: string;
  badgeClass: string;
}> = [
  { value: "new", label: "신규", badgeClass: "bg-amber-100 text-amber-800" },
  { value: "in_progress", label: "상담중", badgeClass: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "처리완료", badgeClass: "bg-emerald-100 text-emerald-800" },
];

function normalizeStatus(status: string): InquiryStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "new";
}

function getStatusOption(status: string) {
  const normalized = normalizeStatus(status);
  return statusOptions.find((option) => option.value === normalized) ?? statusOptions[0];
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [draftStatus, setDraftStatus] = useState<InquiryStatus>("new");
  const [draftMemo, setDraftMemo] = useState("");
  const [draftReply, setDraftReply] = useState("");

  useEffect(() => {
    void loadInquiries();
  }, []);

  async function loadInquiries() {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("문의 목록 조회 오류:", error);
      setErrorMessage("문의 목록을 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setInquiries((data ?? []) as Inquiry[]);
    setLoading(false);
  }

  function openInquiry(inquiry: Inquiry) {
    setSelectedInquiry(inquiry);
    setDraftStatus(normalizeStatus(inquiry.status));
    setDraftMemo(inquiry.admin_memo ?? "");
    setDraftReply(inquiry.reply ?? "");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeInquiry() {
    if (busyId !== null) return;
    setSelectedInquiry(null);
  }

  async function saveInquiry() {
    if (!selectedInquiry) return;

    setBusyId(selectedInquiry.id);
    setErrorMessage("");
    setSuccessMessage("");

    const updatedAt = new Date().toISOString();
    const payload = {
      status: draftStatus,
      admin_memo: draftMemo.trim() || null,
      reply: draftReply.trim() || null,
      updated_at: updatedAt,
    };

    const { error } = await supabase
      .from("inquiries")
      .update(payload)
      .eq("id", selectedInquiry.id);

    if (error) {
      console.error("문의 저장 오류:", error);
      setErrorMessage("문의 처리 내용을 저장하지 못했습니다.");
      setBusyId(null);
      return;
    }

    const updatedInquiry: Inquiry = {
      ...selectedInquiry,
      ...payload,
    };

    setInquiries((current) =>
      current.map((item) => (item.id === selectedInquiry.id ? updatedInquiry : item)),
    );
    setSelectedInquiry(updatedInquiry);
    setSuccessMessage("문의 처리 내용이 저장되었습니다.");
    setBusyId(null);
  }

  async function quickChangeStatus(inquiry: Inquiry, status: InquiryStatus) {
    setBusyId(inquiry.id);
    setErrorMessage("");
    setSuccessMessage("");

    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from("inquiries")
      .update({ status, updated_at: updatedAt })
      .eq("id", inquiry.id);

    if (error) {
      console.error("문의 상태 변경 오류:", error);
      setErrorMessage("문의 상태를 변경하지 못했습니다.");
      setBusyId(null);
      return;
    }

    setInquiries((current) =>
      current.map((item) =>
        item.id === inquiry.id ? { ...item, status, updated_at: updatedAt } : item,
      ),
    );
    setBusyId(null);
  }

  async function deleteInquiry(inquiry: Inquiry) {
    const confirmed = window.confirm(`${inquiry.name}님의 문의를 삭제하시겠습니까?`);
    if (!confirmed) return;

    setBusyId(inquiry.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.from("inquiries").delete().eq("id", inquiry.id);

    if (error) {
      console.error("문의 삭제 오류:", error);
      setErrorMessage("문의를 삭제하지 못했습니다.");
      setBusyId(null);
      return;
    }

    setInquiries((current) => current.filter((item) => item.id !== inquiry.id));
    if (selectedInquiry?.id === inquiry.id) setSelectedInquiry(null);
    setBusyId(null);
  }

  const counts = useMemo(() => {
    return inquiries.reduce(
      (result, inquiry) => {
        result[normalizeStatus(inquiry.status)] += 1;
        return result;
      },
      { new: 0, in_progress: 0, completed: 0 } as Record<InquiryStatus, number>,
    );
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return inquiries.filter((inquiry) => {
      if (statusFilter !== "all" && normalizeStatus(inquiry.status) !== statusFilter) {
        return false;
      }

      if (!keyword) return true;

      return [
        inquiry.name,
        inquiry.phone,
        inquiry.email ?? "",
        inquiry.property_title ?? "",
        inquiry.message,
        inquiry.admin_memo ?? "",
        inquiry.reply ?? "",
        getStatusOption(inquiry.status).label,
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [inquiries, searchText, statusFilter]);

  function formatDate(dateText: string | null) {
    if (!dateText) return "-";

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateText));
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#C9A227]">백조현대부동산 관리자</p>
            <h1 className="mt-2 text-3xl font-bold text-[#0A2342]">문의 관리</h1>
            <p className="mt-2 text-sm text-slate-600">
              홈페이지에서 접수된 고객 문의를 확인하고 상담 진행 상황을 기록합니다.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="이름·전화번호·문의·메모 검색"
              className="min-w-72 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A227]"
            />
            <button
              type="button"
              onClick={() => void loadInquiries()}
              className="rounded-xl bg-[#0A2342] px-5 py-3 text-sm font-semibold text-white hover:bg-[#12345f]"
            >
              새로고침
            </button>
          </div>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-2xl bg-white p-5 text-left shadow-sm ring-2 transition ${
              statusFilter === "all" ? "ring-[#0A2342]" : "ring-transparent"
            }`}
          >
            <p className="text-sm text-slate-500">전체 문의</p>
            <p className="mt-2 text-3xl font-bold text-[#0A2342]">{inquiries.length}</p>
          </button>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-2xl bg-white p-5 text-left shadow-sm ring-2 transition ${
                statusFilter === option.value ? "ring-[#0A2342]" : "ring-transparent"
              }`}
            >
              <p className="text-sm text-slate-500">{option.label}</p>
              <p className="mt-2 text-3xl font-bold text-[#0A2342]">{counts[option.value]}</p>
            </button>
          ))}
        </section>

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

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            문의 목록을 불러오는 중입니다.
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
            {searchText.trim() || statusFilter !== "all"
              ? "조건에 맞는 문의가 없습니다."
              : "접수된 문의가 없습니다."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#0A2342] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold">접수일</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">고객</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">문의 매물</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">문의 내용</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">상태</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">관리</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInquiries.map((inquiry) => {
                    const status = getStatusOption(inquiry.status);
                    const isBusy = busyId === inquiry.id;

                    return (
                      <tr key={inquiry.id} className="align-top hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          {formatDate(inquiry.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          <p className="font-semibold text-[#0A2342]">{inquiry.name}</p>
                          <a href={`tel:${inquiry.phone}`} className="mt-1 block hover:text-[#C9A227]">
                            {inquiry.phone}
                          </a>
                          {inquiry.email && (
                            <a
                              href={`mailto:${inquiry.email}`}
                              className="mt-1 block text-xs hover:text-[#C9A227]"
                            >
                              {inquiry.email}
                            </a>
                          )}
                        </td>
                        <td className="max-w-56 px-4 py-4 text-sm text-slate-700">
                          {inquiry.property_title ?? "일반 문의"}
                        </td>
                        <td className="max-w-md px-4 py-4 text-sm leading-6 text-slate-700">
                          <p className="line-clamp-3 whitespace-pre-wrap">{inquiry.message}</p>
                          {(inquiry.admin_memo || inquiry.reply) && (
                            <p className="mt-2 text-xs font-semibold text-blue-700">관리 기록 있음</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => openInquiry(inquiry)}
                              className="rounded-lg bg-[#0A2342] px-3 py-2 text-xs font-semibold text-white hover:bg-[#12345f]"
                            >
                              상세보기
                            </button>
                            {normalizeStatus(inquiry.status) === "new" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void quickChangeStatus(inquiry, "in_progress")}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                상담 시작
                              </button>
                            )}
                            {normalizeStatus(inquiry.status) !== "completed" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void quickChangeStatus(inquiry, "completed")}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                처리완료
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void deleteInquiry(inquiry)}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-detail-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInquiry();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-[#C9A227]">문의 #{selectedInquiry.id}</p>
                <h2 id="inquiry-detail-title" className="mt-1 text-2xl font-bold text-[#0A2342]">
                  {selectedInquiry.name}님 문의
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  접수 {formatDate(selectedInquiry.created_at)} · 마지막 수정 {formatDate(selectedInquiry.updated_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInquiry}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                닫기
              </button>
            </div>

            <div className="space-y-6 p-6">
              <section className="grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">연락처</p>
                  <a href={`tel:${selectedInquiry.phone}`} className="mt-1 block font-semibold text-[#0A2342]">
                    {selectedInquiry.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">이메일</p>
                  {selectedInquiry.email ? (
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="mt-1 block break-all font-semibold text-[#0A2342]"
                    >
                      {selectedInquiry.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-slate-500">입력 없음</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">문의 매물</p>
                  <p className="mt-1 font-semibold text-[#0A2342]">
                    {selectedInquiry.property_title ?? "일반 문의"}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-[#0A2342]">고객 문의 내용</h3>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-700">
                  {selectedInquiry.message}
                </div>
              </section>

              <label className="block">
                <span className="text-sm font-bold text-[#0A2342]">처리 상태</span>
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as InquiryStatus)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0A2342]">관리자 메모</span>
                <textarea
                  value={draftMemo}
                  onChange={(event) => setDraftMemo(event.target.value)}
                  rows={5}
                  placeholder="통화 내용, 고객 희망 조건, 재연락 일정 등 내부 메모를 입력하세요."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-[#C9A227]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0A2342]">고객 답변 초안</span>
                <textarea
                  value={draftReply}
                  onChange={(event) => setDraftReply(event.target.value)}
                  rows={6}
                  placeholder="전화·문자·이메일로 안내할 답변 내용을 기록하세요. 현재는 저장용이며 자동 발송되지는 않습니다."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-[#C9A227]"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  답변은 관리자 기록으로만 저장되며 고객에게 자동 발송되지 않습니다.
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={busyId === selectedInquiry.id}
                  onClick={() => void deleteInquiry(selectedInquiry)}
                  className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  문의 삭제
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeInquiry}
                    className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={busyId === selectedInquiry.id}
                    onClick={() => void saveInquiry()}
                    className="flex-1 rounded-xl bg-[#0A2342] px-6 py-3 text-sm font-semibold text-white hover:bg-[#12345f] disabled:opacity-50 sm:flex-none"
                  >
                    {busyId === selectedInquiry.id ? "저장 중..." : "처리 내용 저장"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
