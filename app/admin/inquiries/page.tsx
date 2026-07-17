"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  property_title: string | null;
  message: string;
  status: string;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    void loadInquiries();
  }, []);

  async function loadInquiries() {
    setLoading(true);
    setErrorMessage("");

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

  async function toggleStatus(inquiry: Inquiry) {
    const nextStatus = inquiry.status === "completed" ? "new" : "completed";
    setBusyId(inquiry.id);
    setErrorMessage("");

    const { error } = await supabase
      .from("inquiries")
      .update({ status: nextStatus })
      .eq("id", inquiry.id);

    if (error) {
      console.error("문의 상태 변경 오류:", error);
      setErrorMessage("문의 상태를 변경하지 못했습니다.");
      setBusyId(null);
      return;
    }

    setInquiries((current) =>
      current.map((item) =>
        item.id === inquiry.id ? { ...item, status: nextStatus } : item,
      ),
    );
    setBusyId(null);
  }

  async function deleteInquiry(inquiry: Inquiry) {
    const confirmed = window.confirm(`${inquiry.name}님의 문의를 삭제하시겠습니까?`);
    if (!confirmed) return;

    setBusyId(inquiry.id);
    setErrorMessage("");

    const { error } = await supabase.from("inquiries").delete().eq("id", inquiry.id);

    if (error) {
      console.error("문의 삭제 오류:", error);
      setErrorMessage("문의를 삭제하지 못했습니다.");
      setBusyId(null);
      return;
    }

    setInquiries((current) => current.filter((item) => item.id !== inquiry.id));
    setBusyId(null);
  }

  const filteredInquiries = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return inquiries;

    return inquiries.filter((inquiry) =>
      [
        inquiry.name,
        inquiry.phone,
        inquiry.email ?? "",
        inquiry.property_title ?? "",
        inquiry.message,
        inquiry.status === "completed" ? "처리완료" : "신규",
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [inquiries, searchText]);

  function formatDate(dateText: string) {
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
              홈페이지를 통해 접수된 고객 문의를 확인하고 처리 상태를 관리합니다.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="이름·전화번호·문의 내용 검색"
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

        {errorMessage && (
          <div className="mb-5 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            문의 목록을 불러오는 중입니다.
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
            {searchText.trim() ? "검색 결과가 없습니다." : "접수된 문의가 없습니다."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#0A2342] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold">번호</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">접수일</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">이름</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">연락처</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">이메일</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">문의 내용</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">상태</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">관리</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInquiries.map((inquiry) => {
                    const isCompleted = inquiry.status === "completed";
                    const isBusy = busyId === inquiry.id;

                    return (
                      <tr key={inquiry.id} className="align-top hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">{inquiry.id}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          {formatDate(inquiry.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-[#0A2342]">
                          {inquiry.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          <a href={`tel:${inquiry.phone}`} className="hover:text-[#C9A227]">
                            {inquiry.phone}
                          </a>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {inquiry.email ? (
                            <a href={`mailto:${inquiry.email}`} className="hover:text-[#C9A227]">
                              {inquiry.email}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="min-w-72 px-4 py-4 text-sm leading-6 text-slate-700">
                          {inquiry.message}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isCompleted ? "처리완료" : "신규"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void toggleStatus(inquiry)}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isCompleted ? "신규로 변경" : "처리완료"}
                            </button>
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
    </main>
  );
}
