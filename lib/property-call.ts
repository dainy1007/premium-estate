import crypto from "node:crypto";

export type PropertyCallResult = "available" | "completed" | "changed" | "retry" | "unknown";

export const PROPERTY_CALL_RESULT_LABEL: Record<PropertyCallResult, string> = {
  available: "거래 가능",
  completed: "거래 완료",
  changed: "조건 변경",
  retry: "재통화 필요",
  unknown: "확인 필요",
};

export function propertyCallConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: process.env.TWILIO_FROM_NUMBER || "",
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, ""),
    cronSecret: process.env.PROPERTY_CALL_CRON_SECRET || "",
    webhookSecret: process.env.PROPERTY_CALL_WEBHOOK_SECRET || "",
  };
}

export function isPropertyCallConfigured() {
  const c = propertyCallConfig();
  return Boolean(c.accountSid && c.authToken && c.fromNumber && c.siteUrl && c.cronSecret && c.webhookSecret);
}

export function normalizeKoreanPhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("82")) return `+${digits}`;
  if (digits.startsWith("0") && (digits.length === 10 || digits.length === 11)) return `+82${digits.slice(1)}`;
  return "";
}

export function signPropertyCall(contactId: number) {
  const secret = propertyCallConfig().webhookSecret;
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(String(contactId)).digest("hex");
}

export function verifyPropertyCall(contactId: number, token: string) {
  const expected = signPropertyCall(contactId);
  if (!expected || !token || expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export async function placeTwilioCall(to: string, contactId: number) {
  const c = propertyCallConfig();
  if (!isPropertyCallConfigured()) throw new Error("전화 자동화 환경변수가 설정되지 않았습니다.");
  const token = signPropertyCall(contactId);
  const url = `${c.siteUrl}/api/property-calls/twiml?contactId=${contactId}&token=${encodeURIComponent(token)}`;
  const body = new URLSearchParams({ To: to, From: c.fromNumber, Url: url });
  const basic = Buffer.from(`${c.accountSid}:${c.authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Calls.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json = await response.json() as { sid?: string; message?: string };
  if (!response.ok || !json.sid) throw new Error(json.message || "자동전화 발신에 실패했습니다.");
  return json.sid;
}
