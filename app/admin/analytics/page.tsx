"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyticsData = {
  ok: boolean;
  setupNeeded?: boolean;
  error?: string;
  summary?: {
    todayViews: number;
    todayVisitors: number;
    todaySessions: number;
    yesterdayViews: number;
    yesterdayVisitors: number;
    last30Views: number;
    last30Visitors: number;
    last30Sessions: number;
  };
  daily?: Array<{ date: string; views: number; visitors: number; sessions: number }>;
  topPages?: Array<{ path: string; views: number; visitors: number }>;
  sources?: Array<{ source: string; views: number; visitors: number }>;
  devices?: Array<{ device: string; views: number }>;
};

const deviceLabel: Record<string, string> = {
  mobile: "모바일",
  desktop: "PC",
  tablet: "태블릿",
  unknown: "기타",
};

function StatCard({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#0A2342]">{value.toLocaleString()}</p>
      {note ? <p className="mt-2 text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("baekjo_analytics_exclude", "1");
    void fetch("/api/analytics", { cache: "no-store" })
      .then(async (response) => {
        const json = (await response.json()) as AnalyticsData;
        setData(json);
      })
      .catch(() => setData({ ok: false, error: "방문 통계를 불러오지 못했습니다." }))
      .finally(() => setLoading(false));
  }, []);

  const maxDaily = useMemo(
    () => Math.max(1, ...(data?.daily ?? []).map((item) => item.views)),
    [data?.daily],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm">
          방문 통계를 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (!data?.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-[#0A2342] sm:px-6">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[30px] bg-[#0A2342] p-8 text-white shadow-sm">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#C9A227]">VISITOR ANALYTICS</p>
            <h1 className="mt-3 text-3xl font-bold">홈페이지 방문 분석</h1>
          </section>
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <h2 className="text-lg font-bold">통계 저장소 설정이 필요합니다.</h2>
            <p className="mt-2 text-sm leading-6">
              프로젝트에 추가된 <code className="rounded bg-white px-1.5 py-1">supabase/site_page_views.sql</code>을 Supabase SQL Editor에서 한 번 실행하면 바로 집계가 시작됩니다.
            </p>
            {data?.error ? <p className="mt-3 text-xs text-amber-700">{data.error}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  const summary = data.summary!;
  const visitorChange = summary.yesterdayVisitors
    ? Math.round(((summary.todayVisitors - summary.yesterdayVisitors) / summary.yesterdayVisitors) * 100)
    : null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-[#0A2342] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[30px] bg-[#0A2342] p-7 text-white shadow-sm md:p-9">
          <p className="text-sm font-semibold tracking-[0.24em] text-[#C9A227]">VISITOR ANALYTICS</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">홈페이지 방문 분석</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                실제 홈페이지 방문, 유입경로, 인기 페이지를 확인합니다. 관리자 브라우저의 방문은 자동 제외됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              새로고침
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="오늘 방문자" value={summary.todayVisitors} note={visitorChange === null ? "어제 비교 데이터 없음" : `어제 대비 ${visitorChange >= 0 ? "+" : ""}${visitorChange}%`} />
          <StatCard label="오늘 페이지뷰" value={summary.todayViews} note={`세션 ${summary.todaySessions.toLocaleString()}회`} />
          <StatCard label="어제 방문자" value={summary.yesterdayVisitors} note={`페이지뷰 ${summary.yesterdayViews.toLocaleString()}회`} />
          <StatCard label="최근 30일 방문자" value={summary.last30Visitors} note={`세션 ${summary.last30Sessions.toLocaleString()}회`} />
          <StatCard label="최근 30일 페이지뷰" value={summary.last30Views} />
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm md:p-7">
          <div>
            <h2 className="text-xl font-bold">최근 14일 방문 추이</h2>
            <p className="mt-1 text-sm text-slate-500">막대는 페이지뷰, 숫자는 방문자 수입니다.</p>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 md:grid-cols-14">
            {(data.daily ?? []).map((item) => (
              <div key={item.date} className="flex min-w-0 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-[#0A2342]">{item.visitors}</span>
                <div className="flex h-36 w-full items-end rounded-xl bg-slate-100 p-1">
                  <div
                    className="w-full rounded-lg bg-[#C9A227]"
                    style={{ height: `${Math.max(4, (item.views / maxDaily) * 100)}%` }}
                    title={`${item.views} 페이지뷰 / ${item.visitors} 방문자`}
                  />
                </div>
                <span className="truncate text-[10px] text-slate-400">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-7">
            <h2 className="text-xl font-bold">유입경로 TOP 10</h2>
            <p className="mt-1 text-sm text-slate-500">네이버·구글·직접접속 등 실제 방문 출처입니다.</p>
            <div className="mt-5 divide-y divide-slate-100">
              {(data.sources ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">아직 방문 데이터가 없습니다.</p>
              ) : (
                (data.sources ?? []).map((item) => (
                  <div key={item.source} className="flex items-center justify-between gap-4 py-4">
                    <p className="font-semibold">{item.source}</p>
                    <p className="text-sm text-slate-500">방문자 {item.visitors.toLocaleString()} · 조회 {item.views.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-7">
            <h2 className="text-xl font-bold">인기 페이지 TOP 10</h2>
            <p className="mt-1 text-sm text-slate-500">실제로 가장 많이 열린 홈페이지 페이지입니다.</p>
            <div className="mt-5 divide-y divide-slate-100">
              {(data.topPages ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">아직 방문 데이터가 없습니다.</p>
              ) : (
                (data.topPages ?? []).map((item) => (
                  <div key={item.path} className="flex items-center justify-between gap-4 py-4">
                    <a href={item.path} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-semibold hover:underline">{item.path}</a>
                    <p className="shrink-0 text-sm text-slate-500">방문자 {item.visitors.toLocaleString()} · 조회 {item.views.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm md:p-7">
          <h2 className="text-xl font-bold">접속 기기</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {(data.devices ?? []).map((item) => (
              <div key={item.device} className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{deviceLabel[item.device] ?? item.device}</p>
                <p className="mt-1 text-2xl font-bold">{item.views.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
