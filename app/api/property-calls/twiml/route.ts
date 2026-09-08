import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PROPERTY_CALL_RESULT_LABEL, type PropertyCallResult, verifyPropertyCall } from "@/lib/property-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

function xml(body: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function resultFromDigit(digit: string): PropertyCallResult {
  if (digit === "1") return "available";
  if (digit === "2") return "completed";
  if (digit === "3") return "changed";
  if (digit === "9") return "retry";
  return "unknown";
}

async function handle(request: NextRequest) {
  const contactId = Number(request.nextUrl.searchParams.get("contactId"));
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!Number.isFinite(contactId) || !verifyPropertyCall(contactId, token)) return xml("<Hangup/>");
  const supabase = db();
  if (!supabase) return xml('<Say language="ko-KR">시스템 점검 중입니다. 다음에 다시 연락드리겠습니다.</Say><Hangup/>');

  let digit = "";
  if (request.method === "POST") {
    try { digit = String((await request.formData()).get("Digits") || ""); } catch {}
  }
  if (!digit) {
    const action = `/api/property-calls/twiml?contactId=${contactId}&token=${encodeURIComponent(token)}`;
    return xml(`<Say language="ko-KR">안녕하세요. 백조현대부동산 매물 확인 자동 안내입니다.</Say><Pause length="1"/><Gather input="dtmf" numDigits="1" timeout="8" method="POST" action="${action}"><Say language="ko-KR">현재 거래 가능하면 1번, 거래가 완료되었으면 2번, 가격이나 조건이 변경되었으면 3번, 나중에 다시 확인을 원하시면 9번을 눌러주세요.</Say></Gather><Say language="ko-KR">응답이 없어 다음에 다시 연락드리겠습니다. 감사합니다.</Say>`);
  }

  const result = resultFromDigit(digit);
  const now = new Date().toISOString();
  const { data: contact } = await supabase.from("property_call_contacts").select("property_id").eq("id", contactId).maybeSingle();
  await supabase.from("property_call_contacts").update({ last_checked_at: now, last_result: result, updated_at: now }).eq("id", contactId);
  if (contact?.property_id) {
    await supabase.from("property_call_logs").insert({ contact_id: contactId, property_id: contact.property_id, result, note: `키패드 응답 ${digit}`, answered_at: now });
  }
  const label = PROPERTY_CALL_RESULT_LABEL[result];
  return xml(`<Say language="ko-KR">${label}로 확인했습니다. 감사합니다.</Say><Hangup/>`);
}

export async function GET(request: NextRequest) { return handle(request); }
export async function POST(request: NextRequest) { return handle(request); }
