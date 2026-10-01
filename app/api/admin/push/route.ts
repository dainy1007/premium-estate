import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";
import { isPushConfigured, removePushSubscription, savePushSubscription, VAPID_PUBLIC_KEY } from "@/lib/push-server";

async function authorized() {
  const store = await cookies();
  return isValidAdminSession(store.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY, configured: isPushConfigured() });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPushConfigured()) return NextResponse.json({ error: "알림 서버 설정을 확인해 주세요." }, { status: 503 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "알림 등록 정보를 확인해 주세요." }, { status: 400 }); }
  const endpoint = String(body?.endpoint ?? "");
  const p256dh = String(body?.keys?.p256dh ?? "");
  const auth = String(body?.keys?.auth ?? "");
  if (!endpoint.startsWith("https://") || endpoint.length > 4096 || !p256dh || !auth) return NextResponse.json({ error: "알림 등록 정보를 확인해 주세요." }, { status: 400 });
  try {
    await savePushSubscription({ endpoint, p256dh, auth });
    const previousEndpoint = String(body?.previousEndpoint ?? "");
    if (previousEndpoint && previousEndpoint !== endpoint) await removePushSubscription(previousEndpoint);
  } catch {
    console.error("Push subscription save failed");
    return NextResponse.json({ error: "휴대폰 알림 등록에 실패했습니다. 다시 연결해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
