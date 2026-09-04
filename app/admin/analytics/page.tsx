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
  topPages?: Array<{ path: string; views: number; visitors: number; title?: string }>;
  sources?: Array<{ source: string; views: number; visitors: number }>;
  devices?: Array<{ device: string; views: number; visitors?: number }>;
  recentSessions?: Array<{
    sessionId: string;
    visitorId: string;
    startedAt: string;
    source: string;
    landingPath: string;
    landingTitle?: string;
    pageViews: number;
    uniquePages: number;
    device: string;
    pages: Array<{ path: string; title?: string }>;
  }>;
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

function pageLabel(item: { path: string; title?: string }) {
  if (item.title) return item.title;
  if (item.path === "/") return "홈페이지 메인";
  if (item.path === "/search") return "매물 검색";
  return item.path;
}

function sourceLabel(source: string) {
  if (source === "naver") return "네이버";
  if (source === "google") return "구글";
  if (source === "direct") return "직접 유입";
  return source || "기타";
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
            {data?.setupNeeded ? "방문 통계 테이블 설정이 필요합니다." : data?.error || "방문 통계를 불러오지 못했습니다."}
          </div>
        </div>
      </main>
    );
  }

  const summary = data.summary!;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-[#0A2342] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[30px] bg-[#0A2342] p-7 text-white shadow-sm md:p-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-[#C9A227]">VISITOR ANALYTICS</p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">홈페이지 방문 분석</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">실제 홈페이지 방문, 유입경로, 인기 페이지를 확인합니다. 관리자 브라우저의 방문은 자동 제외됩니다.</p>
            </div>
            <button type="button" onClick={() => location.reload()} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">새로고침</button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="오늘 방문자" value={summary.todayVisitors} note={summary.yesterdayVisitors ? `어제 대비 ${Math.round(((summary.todayVisitors - summary.yesterdayVisitors) / summary.yesterdayVisitors) * 100)}%` : "어제 비교 데이터 없음"} />
          <StatCard label="오늘 페이지뷰" value={summary.todayViews} note={`세션 ${summary.todaySessions.toLocaleString()}회`} />
          <StatCard label="어제 방문자" value={summary.yesterdayVisitors} note={`페이지뷰 ${summary.yesterdayViews.toLocaleString()}회`} />
          <StatCard label="최근 30일 방문자" value={summary.last30Visitors} note={`세션 ${summary.last30Sessions.toLocaleString()}회`} />
          <StatCard label="최근 30일 페이지뷰" value={summary.last30Views} />
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm md:p-7">
          <h2 className="text-xl font-bold">최근 14일 방문 추이</h2>
          <p className="mt-1 text-sm text-slate-500">막대는 페이지뷰, 숫자는 방문자 수입니다.</p>
          <div className="mt-6 grid grid-cols-7 gap-2 md:grid-cols-14">
            {(data.daily ?? []).map((item) => (
              <div key={item.date} className="flex min-w-0 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">{item.visitors}</span>
                <div className="flex h-40 w-full items-end rounded-2xl bg-slate-100 p-1">
                  <div className="w-full rounded-xl bg-[#C9A227]" style={{ height: `${Math.max(4, (item.views / maxDaily) * 100)}%` }} title={`페이지뷰 ${item.views} · 방문자 ${item.visitors}`} />
                </div>
                <span className="text-[11px] text-slate-400">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-7">
            <h2 className="text-xl font-bold">유입경로 TOP 10</h2>
            <p className="mt-1 text-sm text-slate-500">네이버·구글·직접접속 등 실제 방문 출처입니다.</p>
            <div className="mt-5 divide-y divide-slate-100">
              {(data.sources ?? []).map((item) => (
                <div key={item.source} className="flex items-center justify-between gap-4 py-4">
                  <span className="font-semibold">{sourceLabel(item.source)}</span>
                  <span className="text-sm text-slate-500">방문자 {item.visitors} · 조회 {item.views}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-sm md:p-7">
            <h2 className="text-xl font-bold">인기 페이지 TOP 10</h2>
            <p className="mt-1 text-sm text-slate-500">실제로 가장 많이 열린 홈페이지 페이지입니다.</p>
            <div className="mt-5 divide-y divide-slate-100">
              {(data.topPages ?? []).map((item) => (
                <div key={item.path} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{pageLabel(item)}</p>
                    {item.title ? <p className="mt-1 truncate text-xs text-slate-400">{item.path}</p> : null}
                  </div>
                  <span className="shrink-0 text-sm text-slate-500">방문자 {item.visitors} · 조회 {item.views}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold">최근 방문 흐름</h2>
              <p className="mt-1 text-sm text-slate-500">방문 시간, 첫 방문 페이지, 한 세션에서 본 페이지 수를 확인합니다.</p>
            </div>
            <p className="text-xs text-slate-400">개인정보 없이 익명 세션 기준으로 표시됩니다.</p>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {(data.recentSessions ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">최근 방문 데이터가 없습니다.</p>
            ) : (
              (data.recentSessions ?? []).map((session) => (
                <div key={session.sessionId} className="py-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(session.startedAt))} · {sourceLabel(session.source)} · {deviceLabel[session.device] ?? session.device}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">첫 페이지: {pageLabel({ path: session.landingPath, title: session.landingTitle })}</p>
                    </div>
                    <div className="text-sm text-slate-500">조회 {session.pageViews}회 · 페이지 {session.uniquePages}개</div>
                  </div>
                  {session.pages.length > 1 ? (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">이동: {session.pages.map((page) => pageLabel(page)).join(" → ")}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm md:p-7">
          <h2 className="text-xl font-bold">접속 기기</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data.devices ?? []).map((item) => (
              <div key={item.device} className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{deviceLabel[item.device] ?? item.device}</p>
                <p className="mt-2 text-2xl font-bold">방문자 {(item.visitors ?? 0).toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-400">조회 {item.views.toLocaleString()}회</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
