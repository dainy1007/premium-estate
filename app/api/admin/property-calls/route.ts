import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";
import { isPropertyCallConfigured, normalizeKoreanPhone } from "@/lib/property-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

async function authorized(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSession(cookie);
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const supabase = db();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase 설정 없음" }, { status: 503 });

  const [{ data: contacts, error }, { data: properties }] = await Promise.all([
    supabase.from("property_call_contacts").select("id,property_id,contact_name,phone,enabled,last_called_at,last_checked_at,next_check_at,last_result,last_note").order("next_check_at", { ascending: true }),
    supabase.from("properties").select("id,title,location,price,is_hidden,listing_status").order("id", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ ok: false, setupNeeded: true, error: error.message }, { status: 503 });
  return NextResponse.json({ ok: true, configured: isPropertyCallConfigured(), contacts: contacts ?? [], properties: properties ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const supabase = db();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase 설정 없음" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 }); }
  const propertyId = Number(body.propertyId);
  const phone = normalizeKoreanPhone(body.phone);
  if (!Number.isFinite(propertyId) || !phone) return NextResponse.json({ ok: false, error: "매물과 전화번호를 확인해 주세요." }, { status: 400 });
  const payload = {
    property_id: propertyId,
    contact_name: String(body.contactName ?? "").trim().slice(0, 80) || null,
    phone,
    enabled: body.enabled !== false,
    next_check_at: body.nextCheckAt ? String(body.nextCheckAt) : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("property_call_contacts").upsert(payload, { onConflict: "property_id,phone" }).select().single();
  if (error) return NextResponse.json({ ok: false, setupNeeded: true, error: error.message }, { status: 503 });
  return NextResponse.json({ ok: true, contact: data });
}

export async function PATCH(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const supabase = db();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase 설정 없음" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const id = Number(body.id);
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: "대상 없음" }, { status: 400 });
  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.enabled === "boolean") changes.enabled = body.enabled;
  if (body.nextCheckAt) changes.next_check_at = String(body.nextCheckAt);
  if (body.note !== undefined) changes.last_note = String(body.note ?? "").slice(0, 500) || null;
  const { error } = await supabase.from("property_call_contacts").update(changes).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  return NextResponse.json({ ok: true });
}
