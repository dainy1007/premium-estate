import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";

type SmsItem = { to?: string; text?: string };

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function authHeader(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function POST(request: NextRequest) {
  const valid = await isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!valid) return NextResponse.json({ ok: false, error: "관리자 로그인이 필요합니다." }, { status: 401 });

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = digits(process.env.SOLAPI_SENDER || "");
  if (!apiKey || !apiSecret || !sender) {
    return NextResponse.json({
      ok: false,
      error: "문자 발송 설정이 아직 완료되지 않았습니다.",
      setupRequired: true,
    }, { status: 503 });
  }

  let body: { messages?: SmsItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const messages = (body.messages || []).map((item) => ({
    to: digits(item.to || ""),
    from: sender,
    text: String(item.text || "").trim(),
  })).filter((item) => item.to.length >= 10 && item.text);

  if (!messages.length) return NextResponse.json({ ok: false, error: "발송할 문자가 없습니다." }, { status: 400 });
  if (messages.length > 100) return NextResponse.json({ ok: false, error: "한 번에 최대 100건까지 발송할 수 있습니다." }, { status: 400 });

  const response = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: {
      Authorization: authHeader(apiKey, apiSecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ ok: false, error: result?.errorMessage || result?.message || "문자 발송에 실패했습니다.", detail: result }, { status: response.status });
  }

  return NextResponse.json({ ok: true, count: messages.length, result });
}
