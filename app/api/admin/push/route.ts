import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";
import { savePushSubscription, VAPID_PUBLIC_KEY } from "@/lib/push-server";

async function authorized() {
  const store = await cookies();
  return isValidAdminSession(store.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY, configured: Boolean(process.env.VAPID_PRIVATE_KEY) });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json();
  const endpoint = String(body?.endpoint ?? "");
  const p256dh = String(body?.keys?.p256dh ?? "");
  const auth = String(body?.keys?.auth ?? "");
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  await savePushSubscription({ endpoint, p256dh, auth });
  return NextResponse.json({ ok: true });
}
