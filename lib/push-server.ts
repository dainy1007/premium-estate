import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const VAPID_PUBLIC_KEY = "BFXDtHbQqG2qy2T9LTQBdKyxX6MkddcBNgEiLHMYlMVxyTVEDfcBKWUblon2DFT4JePEB9HRJLtR1vPM2oM1C6w";

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type StoredPushSubscription = { endpoint: string; p256dh: string; auth: string };

export async function savePushSubscription(subscription: StoredPushSubscription) {
  const { error } = await adminDb().from("admin_push_subscriptions").upsert(subscription, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function removePushSubscription(endpoint: string) {
  await adminDb().from("admin_push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function sendInquiryPush(name: string, message: string) {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return { sent: 0, configured: false };
  webpush.setVapidDetails("mailto:admin@baekjohd.com", VAPID_PUBLIC_KEY, privateKey);
  const { data, error } = await adminDb().from("admin_push_subscriptions").select("endpoint,p256dh,auth");
  if (error) throw error;
  let sent = 0;
  for (const sub of data ?? []) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({
        title: "백조현대부동산 새 상담 문의",
        body: `${name}님 · ${message.slice(0, 60)}`,
        url: "/admin/inquiries"
      }));
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await removePushSubscription(sub.endpoint);
      else console.error("Web push failed", error);
    }
  }
  return { sent, configured: true };
}
