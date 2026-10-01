import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";
import { sendTestPush } from "@/lib/push-server";

export async function POST(request: Request) {
  const store = await cookies();
  if (!(await isValidAdminSession(store.get(ADMIN_COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "알림 등록 정보를 확인해 주세요." }, { status: 400 }); }
  const endpoint = String(body?.endpoint ?? "");
  if (!endpoint || endpoint.length > 4096) {
    return NextResponse.json({ error: "먼저 휴대폰 알림을 연결해 주세요." }, { status: 400 });
  }
  try {
    // Only the saved subscription for this browser receives the test notification.
    const push = await sendTestPush(endpoint);
    if (!push.configured) return NextResponse.json({ error: "알림 서버 설정을 확인해 주세요." }, { status: 503 });
    if (!push.subscribers || push.expired) return NextResponse.json({ error: "알림 연결이 만료되었습니다. 다시 연결해 주세요." }, { status: 410 });
    if (!push.sent) return NextResponse.json({ error: "테스트 알림 전송에 실패했습니다. 다시 시도해 주세요." }, { status: 502 });
    return NextResponse.json({ ok: true, push });
  } catch {
    console.error("Test push notification failed");
    return NextResponse.json({ error: "테스트 알림을 보낼 수 없습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
