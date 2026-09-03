import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cleanText(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanPath(value: unknown) {
  const path = cleanText(value, 300);
  return path.startsWith("/") ? path : "/";
}

function sourceFrom(referrer: string, utmSource: string) {
  const explicit = utmSource.toLowerCase();
  if (explicit) return explicit;
  if (!referrer) return "직접 유입";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("naver.com")) return "네이버";
    if (host.includes("google.")) return "구글";
    if (host.includes("daum.net") || host.includes("kakao.com")) return "다음/카카오";
    if (host.includes("bing.com")) return "빙";
    if (host.includes("baekjohd.com")) return "내부 이동";
    return host.replace(/^www\./, "");
  } catch {
    return "기타";
  }
}

export async function POST(request: NextRequest) {
  const supabase = getClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = cleanPath(body.path);
  if (path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const visitorId = cleanText(body.visitorId, 80);
  const sessionId = cleanText(body.sessionId, 80);
  if (!visitorId || !sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  const referrer = cleanText(body.referrer, 800);
  const utmSource = cleanText(body.utmSource, 100);
  const payload = {
    path,
    visitor_id: visitorId,
    session_id: sessionId,
    referrer,
    source: sourceFrom(referrer, utmSource),
    device: cleanText(body.device, 20) || "unknown",
    utm_source: utmSource || null,
    utm_medium: cleanText(body.utmMedium, 100) || null,
    utm_campaign: cleanText(body.utmCampaign, 150) || null,
  };

  const { error } = await supabase.from("site_page_views").insert(payload);
  if (error) {
    console.warn("analytics insert failed:", error.message);
    return NextResponse.json({ ok: false, setupNeeded: true }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}

function startOfKstDay(daysAgo = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000);
}

function kstDateKey(value: string | Date) {
  const date = new Date(value);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await isValidAdminSession(cookie))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase 설정 없음" }, { status: 503 });

  const since30 = startOfKstDay(29).toISOString();
  const { data, error } = await supabase
    .from("site_page_views")
    .select("created_at,path,visitor_id,session_id,source,device")
    .gte("created_at", since30)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    return NextResponse.json(
      { ok: false, setupNeeded: true, error: error.message },
      { status: 503 },
    );
  }

  const rows = data ?? [];
  const todayKey = kstDateKey(new Date());
  const yesterdayKey = kstDateKey(startOfKstDay(1));
  const todayRows = rows.filter((row) => kstDateKey(row.created_at) === todayKey);
  const yesterdayRows = rows.filter((row) => kstDateKey(row.created_at) === yesterdayKey);

  const unique = (items: typeof rows, key: "visitor_id" | "session_id") =>
    new Set(items.map((item) => item[key]).filter(Boolean)).size;

  const pageMap = new Map<string, { views: number; visitors: Set<string> }>();
  const sourceMap = new Map<string, { views: number; visitors: Set<string> }>();
  const deviceMap = new Map<string, number>();

  for (const row of rows) {
    const page = pageMap.get(row.path) ?? { views: 0, visitors: new Set<string>() };
    page.views += 1;
    if (row.visitor_id) page.visitors.add(row.visitor_id);
    pageMap.set(row.path, page);

    const sourceName = row.source || "기타";
    const source = sourceMap.get(sourceName) ?? { views: 0, visitors: new Set<string>() };
    source.views += 1;
    if (row.visitor_id) source.visitors.add(row.visitor_id);
    sourceMap.set(sourceName, source);

    const device = row.device || "unknown";
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + 1);
  }

  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = startOfKstDay(13 - index);
    const key = kstDateKey(date);
    const items = rows.filter((row) => kstDateKey(row.created_at) === key);
    return {
      date: key,
      views: items.length,
      visitors: unique(items, "visitor_id"),
      sessions: unique(items, "session_id"),
    };
  });

  const topPages = [...pageMap.entries()]
    .map(([path, value]) => ({ path, views: value.views, visitors: value.visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const sources = [...sourceMap.entries()]
    .map(([source, value]) => ({ source, views: value.views, visitors: value.visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const devices = [...deviceMap.entries()]
    .map(([device, views]) => ({ device, views }))
    .sort((a, b) => b.views - a.views);

  return NextResponse.json({
    ok: true,
    summary: {
      todayViews: todayRows.length,
      todayVisitors: unique(todayRows, "visitor_id"),
      todaySessions: unique(todayRows, "session_id"),
      yesterdayViews: yesterdayRows.length,
      yesterdayVisitors: unique(yesterdayRows, "visitor_id"),
      last30Views: rows.length,
      last30Visitors: unique(rows, "visitor_id"),
      last30Sessions: unique(rows, "session_id"),
    },
    daily,
    topPages,
    sources,
    devices,
  });
}
