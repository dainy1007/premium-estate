import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendInquiryPush } from "@/lib/push-server";

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "문의 내용을 확인해 주세요." }, { status: 400 }); }
  const name = String(body?.name ?? "").trim().slice(0, 80);
  const phone = String(body?.phone ?? "").trim().slice(0, 40);
  const message = String(body?.message ?? "").trim().slice(0, 2000);
  const email = String(body?.email ?? "").trim().slice(0, 254) || null;
  const propertyTitle = String(body?.property_title ?? "").trim().slice(0, 200) || "홈페이지 매물 문의";
  if (!name || !phone || !message) return NextResponse.json({ error: "필수 항목을 입력해 주세요." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "server configuration" }, { status: 500 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("inquiries").insert({ name, phone, email, message, property_title: propertyTitle, status: "new" });
  if (error) return NextResponse.json({ error: "문의 저장 실패" }, { status: 500 });
  let push = { sent: 0, failed: 0, expired: 0, subscribers: 0, configured: false };
  try { push = await sendInquiryPush(name, message); console.log("Inquiry push result", push); } catch (error) { console.error("Inquiry push notification failed", error); }
  return NextResponse.json({ ok: true, push });
}
