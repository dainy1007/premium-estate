"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const stats = [
  { label: "등록 매물", value: "24", change: "+4 이번 달", icon: "🏠" },
  { label: "상담 문의", value: "18", change: "+7 오늘", icon: "📞" },
  { label: "오늘 방문자", value: "142", change: "+12%", icon: "👁️" },
  { label: "계약 완료", value: "9", change: "+2 이번 주", icon: "✅" },
];

const listings = [
  { id: 1, name: "대구 수성구 범어동 아파트", type: "아파트", location: "대구 수성구", price: "6억 8,000만원", status: "공개" },
  { id: 2, name: "달성군 유가읍 전세", type: "전세", location: "달성군", price: "3억원", status: "비공개" },
  { id: 3, name: "동성로 상가", type: "상가", location: "중구", price: "보증금 3000 / 월 150", status: "거래완료" },
  { id: 4, name: "달성군 토지", type: "토지", location: "달성군", price: "8억원", status: "공개" },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 rounded-[32px] border border-[#0A2342]/10 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">관리자 대시보드</h1>
          </div>
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-5 py-3 text-sm font-semibold text-[#0A2342] transition duration-300 hover:-translate-y-1 hover:bg-[#d8b53b]"
          >
            + 매물 등록
          </Link>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 40px rgba(10, 37, 64, 0.08)" }}
              className="rounded-[24px] border border-[#0A2342]/10 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#C9A227]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A227]/10 text-2xl">
                  {stat.icon}
                </div>
                <span className="text-sm font-medium text-[#C9A227]">{stat.change}</span>
              </div>
              <p className="mt-5 text-sm text-[#0A2342]/60">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#0A2342]">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 overflow-hidden rounded-[32px] border border-[#0A2342]/10 bg-white shadow-sm"
        >
          <div className="border-b border-[#0A2342]/10 px-6 py-5 sm:px-8">
            <h2 className="text-xl font-semibold text-[#0A2342]">최근 등록 매물</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F8F9FB] text-[#0A2342]/70">
                <tr>
                  <th className="px-6 py-4 font-medium">번호</th>
                  <th className="px-6 py-4 font-medium">매물명</th>
                  <th className="px-6 py-4 font-medium">거래유형</th>
                  <th className="px-6 py-4 font-medium">지역</th>
                  <th className="px-6 py-4 font-medium">가격</th>
                  <th className="px-6 py-4 font-medium">상태</th>
                  <th className="px-6 py-4 font-medium">수정</th>
                  <th className="px-6 py-4 font-medium">삭제</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id} className="border-t border-[#0A2342]/10">
                    <td className="px-6 py-4 text-[#0A2342]">{item.id}</td>
                    <td className="px-6 py-4 text-[#0A2342]">{item.name}</td>
                    <td className="px-6 py-4 text-[#0A2342]/70">{item.type}</td>
                    <td className="px-6 py-4 text-[#0A2342]/70">{item.location}</td>
                    <td className="px-6 py-4 text-[#0A2342]/70">{item.price}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "공개"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : item.status === "비공개"
                              ? "border border-slate-200 bg-slate-100 text-slate-600"
                              : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="rounded-full border border-[#0A2342]/10 px-3 py-2 text-sm font-medium text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">
                        수정
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
