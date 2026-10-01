import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const VAPID_PUBLIC_KEY = "BPP-b6IjZYkLoYQZ-gTMz1MhQqTy6IDVPhTq5O83N82BdU8u9JhE0djEh-vO5dq0Z5wVzCQ3gconX1SClvxtG44";

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type StoredPushSubscription = { endpoint: string; p256dh: string; auth: string };
type PushMessage = { title: string; body: string; url: string };
export type PushResult = { sent: number; failed: number; expired: number; subscribers: number; configured: boolean };

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PRIVATE_KEY);
}

export async function savePushSubscription(subscription: StoredPushSubscription) {
  const { error } = await adminDb().from("admin_push_subscriptions").upsert({ ...subscription, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function removePushSubscription(endpoint: string) {
  const { error } = await adminDb().from("admin_push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

async function sendPush(message: PushMessage, endpoint?: string): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, expired: 0, subscribers: 0, configured: isPushConfigured() };
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return result;
  webpush.setVapidDetails("mailto:admin@baekjohd.com", VAPID_PUBLIC_KEY, privateKey);
  let query = adminDb().from("admin_push_subscriptions").select("endpoint,p256dh,auth");
  if (endpoint) query = query.eq("endpoint", endpoint);
  const { data, error } = await query;
  if (error) throw error;
  result.subscribers = data?.length ?? 0;
  await Promise.all((data ?? []).map(async (sub: StoredPushSubscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(message),
        { TTL: 3600, urgency: "high", timeout: 10000 },
      );
      result.sent += 1;
    } catch (error: unknown) {
      const statusCode = error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : undefined;
      if (statusCode === 404 || statusCode === 410) {
        result.expired += 1;
        try { await removePushSubscription(sub.endpoint); }
        catch { console.error("Expired push subscription cleanup failed"); }
      } else {
        result.failed += 1;
        console.error("Web push failed", { statusCode });
      }
    }
  }));
  return result;
}

export async function sendInquiryPush(name: string, message: string) {
  return sendPush({
    title: "백조현대부동산 새 상담 문의",
    body: name + "님 · " + message.slice(0, 60),
    url: "/admin/inquiries",
  });
}

export async function sendTestPush(endpoint: string) {
  return sendPush({
    title: "백조현대부동산 알림 테스트",
    body: "이 알림이 보이면 휴대폰 문의 알림을 받을 수 있습니다.",
    url: "/admin/inquiries",
  }, endpoint);
}
