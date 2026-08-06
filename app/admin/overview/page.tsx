"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PropertySummary = {
  id: number;
  title: string;
  location: string | null;
  price: string | null;
  created_at: string | null;
  is_featured?: boolean;
  is_hidden?: boolean;
  listing_status?: string | null;
};

type InquirySummary = {
  id: number;
  name: string;
  phone: string;
  property_title: string | null;
  status: string | null;
  created_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function inquiryLabel(status: string | null) {
  if (status === "completed") return "처리완료";
  if (status === "in_progress") return "상담중";
  return "신규";
}

export default function AdminOverviewPage() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [inquiries, setInquiries] = useState<InquirySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [managementEnabled, setManagementEnabled] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);
      setErrorMessage("");

      const propertyResult = await supabase
        .from("properties")
        .select("id, title, location, price, created_at, is_featured, is_hidden, listing_status")
        .order("created_at", { ascending: false })
        .limit(50);

      let propertyData: PropertySummary[] = [];
      if (propertyResult.error) {
        const fallback = await supabase
          .from("properties")
          .select("id, title, location, price, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (fallback.error) {
          console.error("운영 현황 매물 조회 오류:", fallback.error);
          setErrorMessage("운영 현황을 불러오지 못했습니다.");
          setLoading(false);
          return;
        }
        propertyData = (fallback.data ?? []) as PropertySummary[];
        setManagementEnabled(false);
      } else {
        propertyData = (propertyResult.data ?? []) as PropertySummary[];
        setManagementEnabled(true);
      }

      const inquiryResult = await supabase
        .from("inquiries")
        .select("id, name, phone, property_title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (inquiryResult.error) {
        console.warn("최근 문의 조회 경고:", inquiryResult.error);
      }

      setProperties(propertyData);
      setInquiries((inquiryResult.data ?? []) as InquirySummary[]);
      setLoading(false);
    }

    void loadOverview();
  }, []);

  const stats = useMemo(
    () => ({
      total: properties.length,
      visible: properties.filter(
        (item) => item.is_hidden !== true && item.listing_status !== "completed",
      ).length,
      featured: properties.filter((item) => item.is_featured === true).length,
      completed: properties.filter((item) => item.listing_status === "completed").length,
      newInquiries: inquiries.filter((item) => !item.status || item.status === "new").length,
    }),
    [inquiries, properties],
  );

  const recentProperties = properties.slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-[#0A2342] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[30px] bg-[#0A2342] p-7 text-white shadow-sm md:p-9">
          <p className="text-sm font-semibold tracking-[0.28em] text-[#C9A227]">OPERATIONS OVERVIEW</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">오늘의 운영 현황</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                최근 등록 매물과 고객 문의를 한 화면에서 빠르게 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/properties/new" className="rounded-full bg-[#C9A227] px-5 py-3 text-sm font-semibold text-[#0A2342]">
                + 매물 등록
              </Link>
              <Link href="/admin/inquiries" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                문의 관리
              </Link>
            </div>
          </div>
        </section>

        {!managementEnabled && !loading && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Supabase 상태 관리 SQL 적용 전이라 추천·숨김·계약완료 통계는 기본값으로 표시됩니다.
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="최근 조회 매물" value={stats.total} />
          <StatCard label="현재 노출중" value={stats.visible} />
          <StatCard label="추천 매물" value={stats.featured} />
          <StatCard label="계약완료" value={stats.completed} />
          <StatCard label="최근 신규 문의" value={stats.newInquiries} accent />
        </section>

        {loading ? (
          <div className="mt-6 rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm">
            운영 현황을 불러오는 중입니다.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">최근 등록 매물</h2>
                  <p className="mt-1 text-sm text-slate-500">최근 등록 순으로 최대 8건을 표시합니다.</p>
                </div>
                <Link href="/admin" className="text-sm font-semibold text-[#9B7900] hover:underline">
                  전체 관리 →
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {recentProperties.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">등록된 매물이 없습니다.</p>
                ) : (
                  recentProperties.map((property) => (
                    <div key={property.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{property.title}</p>
                          {property.is_featured && <Badge>추천</Badge>}
                          {property.is_hidden && <Badge muted>숨김</Badge>}
                          {property.listing_status === "completed" && <Badge completed>계약완료</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {property.location || "지역 미입력"} · {property.price || "가격 문의"} · {formatDate(property.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Link href={`/admin/properties/${property.id}/edit`} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:border-[#C9A227]">
                          수정
                        </Link>
                        <Link href={`/properties/${property.id}`} target="_blank" className="rounded-full bg-[#0A2342] px-4 py-2 text-xs font-semibold text-white">
                          보기
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">최근 고객 문의</h2>
                  <p className="mt-1 text-sm text-slate-500">최근 접수된 문의 최대 8건입니다.</p>
                </div>
                <Link href="/admin/inquiries" className="text-sm font-semibold text-[#9B7900] hover:underline">
                  전체 보기 →
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {inquiries.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">최근 문의가 없습니다.</p>
                ) : (
                  inquiries.map((inquiry) => (
                    <Link key={inquiry.id} href="/admin/inquiries" className="block py-4 transition hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{inquiry.name}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {inquiryLabel(inquiry.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{inquiry.phone}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                        {inquiry.property_title || "일반 문의"} · {formatDate(inquiry.created_at)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-[24px] p-6 shadow-sm ${accent ? "bg-[#C9A227] text-[#0A2342]" : "bg-white"}`}>
      <p className={`text-sm ${accent ? "text-[#0A2342]/70" : "text-slate-500"}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Badge({ children, muted = false, completed = false }: { children: React.ReactNode; muted?: boolean; completed?: boolean }) {
  const className = completed
    ? "bg-blue-100 text-blue-800"
    : muted
      ? "bg-slate-200 text-slate-700"
      : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}
