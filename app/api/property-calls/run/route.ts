import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";
import { isPropertyCallConfigured, normalizeKoreanPhone, placeTwilioCall, propertyCallConfig } from "@/lib/property-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

async function authorized(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const configuredSecret = propertyCallConfig().cronSecret;
  if (configuredSecret && bearer === configuredSecret) return true;
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSession(cookie);
}

async function run(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isPropertyCallConfigured()) return NextResponse.json({ ok: false, setupNeeded: true, error: "전화 서비스 환경변수 설정이 필요합니다." }, { status: 503 });
  const supabase = db();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase 설정 없음" }, { status: 503 });

  const now = new Date();
  const { data: contacts, error } = await supabase.from("property_call_contacts")
    .select("id,property_id,phone,enabled,next_check_at")
    .eq("enabled", true)
    .or(`next_check_at.is.null,next_check_at.lte.${now.toISOString()}`)
    .order("next_check_at", { ascending: true, nullsFirst: true })
    .limit(20);
  if (error) return NextResponse.json({ ok: false, setupNeeded: true, error: error.message }, { status: 503 });

  const propertyIds = Array.from(new Set((contacts ?? []).map(c => Number(c.property_id))));
  const { data: properties } = propertyIds.length
    ? await supabase.from("properties").select("id,title,is_hidden,listing_status").in("id", propertyIds)
    : { data: [] as Array<{ id: number; title: string; is_hidden?: boolean; listing_status?: string }> };
  const propertyMap = new Map((properties ?? []).map(p => [Number(p.id), p]));
  const results: Array<{ contactId: number; propertyId: number; ok: boolean; skipped?: string; error?: string }> = [];

  for (const contact of contacts ?? []) {
    const contactId = Number(contact.id), propertyId = Number(contact.property_id);
    const property = propertyMap.get(propertyId);
    if (!property || property.is_hidden || property.listing_status === "completed") {
      await supabase.from("property_call_contacts").update({ enabled: false, updated_at: now.toISOString() }).eq("id", contactId);
      results.push({ contactId, propertyId, ok: true, skipped: "비노출/계약완료 매물" });
      continue;
    }
    const phone = normalizeKoreanPhone(contact.phone);
    if (!phone) {
      results.push({ contactId, propertyId, ok: false, error: "전화번호 형식 오류" });
      continue;
    }
    try {
      const callSid = await placeTwilioCall(phone, contactId);
      const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await Promise.all([
        supabase.from("property_call_contacts").update({ last_called_at: now.toISOString(), next_check_at: next, updated_at: now.toISOString() }).eq("id", contactId),
        supabase.from("property_call_logs").insert({ contact_id: contactId, property_id: propertyId, provider_call_id: callSid, called_at: now.toISOString() }),
      ]);
      results.push({ contactId, propertyId, ok: true });
    } catch (e) {
      results.push({ contactId, propertyId, ok: false, error: e instanceof Error ? e.message : "발신 실패" });
    }
  }
  return NextResponse.json({ ok: true, attempted: results.length, success: results.filter(r => r.ok && !r.skipped).length, results });
}

export async function POST(request: NextRequest) { return run(request); }
export async function GET(request: NextRequest) { return run(request); }
