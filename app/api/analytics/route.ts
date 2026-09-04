import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
function cleanText(value: unknown, max = 500) { return String(value ?? "").trim().slice(0, max); }
function cleanPath(value: unknown) { const path = cleanText(value, 300); return path.startsWith("/") ? path.split("?")[0] : "/"; }
function sourceFrom(referrer: string, utmSource: string) {
  const explicit = utmSource.toLowerCase(); if (explicit) return explicit;
  if (!referrer) return "직접 유입";
  try { const host = new URL(referrer).hostname.toLowerCase(); if (host.includes("naver.com")) return "네이버"; if (host.includes("google.")) return "구글"; if (host.includes("daum.net") || host.includes("kakao.com")) return "다음/카카오"; if (host.includes("bing.com")) return "빙"; if (host.includes("baekjohd.com")) return "내부 이동"; return host.replace(/^www\./, ""); } catch { return "기타"; }
}
export async function POST(request: NextRequest) {
  const supabase = getClient(); if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminSession(cookie)) return NextResponse.json({ ok: true, skipped: true, reason: "admin" });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const path = cleanPath(body.path); if (path.startsWith("/admin") || path.startsWith("/api")) return NextResponse.json({ ok: true, skipped: true });
  const visitorId = cleanText(body.visitorId, 80), sessionId = cleanText(body.sessionId, 80); if (!visitorId || !sessionId) return NextResponse.json({ ok: false }, { status: 400 });
  const referrer = cleanText(body.referrer, 800), utmSource = cleanText(body.utmSource, 100), source = sourceFrom(referrer, utmSource);
  if (source === "내부 이동") return NextResponse.json({ ok: true, skipped: true, reason: "internal" });
  const { error } = await supabase.from("site_page_views").insert({ path, visitor_id: visitorId, session_id: sessionId, referrer, source, device: cleanText(body.device, 20) || "unknown", utm_source: utmSource || null, utm_medium: cleanText(body.utmMedium, 100) || null, utm_campaign: cleanText(body.utmCampaign, 150) || null });
  if (error) return NextResponse.json({ ok: false, setupNeeded: true }, { status: 503 });
  return NextResponse.json({ ok: true });
}
function startOfKstDay(daysAgo = 0) { const now = new Date(); const kst = new Date(now.getTime() + 32400000); kst.setUTCHours(0,0,0,0); kst.setUTCDate(kst.getUTCDate()-daysAgo); return new Date(kst.getTime()-32400000); }
function kstDateKey(value: string | Date) { const date = new Date(value); return new Date(date.getTime()+32400000).toISOString().slice(0,10); }

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value; if (!(await isValidAdminSession(cookie))) return NextResponse.json({ ok:false,error:"Unauthorized"},{status:401});
  const supabase=getClient(); if(!supabase) return NextResponse.json({ok:false,error:"Supabase 설정 없음"},{status:503});
  const {data,error}=await supabase.from("site_page_views").select("created_at,path,visitor_id,session_id,source,device").gte("created_at",startOfKstDay(29).toISOString()).order("created_at",{ascending:false}).limit(10000);
  if(error) return NextResponse.json({ok:false,setupNeeded:true,error:error.message},{status:503});
  const rows=data??[]; const unique=(items:typeof rows,key:"visitor_id"|"session_id")=>new Set(items.map(i=>i[key]).filter(Boolean)).size;
  const propertyIds=Array.from(new Set(rows.map(r=>String(r.path).match(/^\/properties\/(\d+)$/)?.[1]).filter(Boolean).map(Number))); const propertyTitles=new Map<number,string>();
  if(propertyIds.length){const {data:p}=await supabase.from("properties").select("id,title").in("id",propertyIds); for(const i of p??[]) propertyTitles.set(Number(i.id),String(i.title??""));}
  const pageTitle=(path:string)=>{const m=path.match(/^\/properties\/(\d+)$/); if(m)return propertyTitles.get(Number(m[1]))||`매물 #${m[1]}`; if(path==="/")return"홈페이지 메인"; if(path==="/search")return"매물 검색"; if(path==="/properties")return"전체 매물"; if(path==="/contact")return"상담 문의"; return undefined;};
  const sessionMap=new Map<string,typeof rows>(); for(const r of rows){const a=sessionMap.get(r.session_id)??[];a.push(r);sessionMap.set(r.session_id,a);}
  const sessions=[...sessionMap.entries()].map(([sessionId,items])=>{const ordered=[...items].sort((a,b)=>+new Date(a.created_at)-+new Date(b.created_at)); const first=ordered[0]; const seen=new Set<string>(); const pages:Array<{path:string;title?:string}>=[]; for(const i of ordered){if(!seen.has(i.path)){seen.add(i.path);pages.push({path:i.path,title:pageTitle(i.path)});}}
    // Conservative heuristic: only flag the highly repetitive pattern we observed: direct PC traffic that opens exactly one SEO landing page and leaves.
    const suspectedBot=(first.source==="직접 유입"||first.source==="direct") && first.device==="desktop" && ordered.length===1 && seen.size===1 && /^\/real-estate\//.test(first.path);
    return {sessionId,visitorId:first.visitor_id,startedAt:first.created_at,source:first.source||"기타",landingPath:first.path,landingTitle:pageTitle(first.path),pageViews:ordered.length,uniquePages:seen.size,device:first.device||"unknown",pages,suspectedBot};
  }).sort((a,b)=>+new Date(b.startedAt)-+new Date(a.startedAt));
  const suspectedIds=new Set(sessions.filter(s=>s.suspectedBot).map(s=>s.sessionId)); const humanRows=rows.filter(r=>!suspectedIds.has(r.session_id));
  const todayKey=kstDateKey(new Date()), yesterdayKey=kstDateKey(startOfKstDay(1)); const todayRows=humanRows.filter(r=>kstDateKey(r.created_at)===todayKey), yesterdayRows=humanRows.filter(r=>kstDateKey(r.created_at)===yesterdayKey);
  const mapStats=(base:typeof humanRows,key:"path"|"source"|"device")=>{const m=new Map<string,{views:number;visitors:Set<string>}>();for(const r of base){const k=String(r[key]||"기타"),v=m.get(k)??{views:0,visitors:new Set<string>()};v.views++;if(r.visitor_id)v.visitors.add(r.visitor_id);m.set(k,v);}return m;};
  const pageMap=mapStats(humanRows,"path"),sourceMap=mapStats(humanRows,"source"),deviceMap=mapStats(humanRows,"device");
  const daily=Array.from({length:14},(_,index)=>{const key=kstDateKey(startOfKstDay(13-index)),items=humanRows.filter(r=>kstDateKey(r.created_at)===key);return{date:key,views:items.length,visitors:unique(items,"visitor_id"),sessions:unique(items,"session_id")};});
  const topPages=[...pageMap.entries()].map(([path,v])=>({path,title:pageTitle(path),views:v.views,visitors:v.visitors.size})).sort((a,b)=>b.views-a.views).slice(0,10);
  const sources=[...sourceMap.entries()].map(([source,v])=>({source,views:v.views,visitors:v.visitors.size})).sort((a,b)=>b.views-a.views).slice(0,10);
  const devices=[...deviceMap.entries()].map(([device,v])=>({device,views:v.views,visitors:v.visitors.size})).sort((a,b)=>b.views-a.views);
  return NextResponse.json({ok:true,summary:{todayViews:todayRows.length,todayVisitors:unique(todayRows,"visitor_id"),todaySessions:unique(todayRows,"session_id"),yesterdayViews:yesterdayRows.length,yesterdayVisitors:unique(yesterdayRows,"visitor_id"),last30Views:humanRows.length,last30Visitors:unique(humanRows,"visitor_id"),last30Sessions:unique(humanRows,"session_id"),suspectedBotSessions:sessions.filter(s=>s.suspectedBot).length,suspectedBotViews:rows.length-humanRows.length},daily,topPages,sources,devices,recentSessions:sessions.filter(s=>!s.suspectedBot).slice(0,30),suspectedSessions:sessions.filter(s=>s.suspectedBot).slice(0,30)});
}
