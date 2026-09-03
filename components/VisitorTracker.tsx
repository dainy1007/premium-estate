"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "baekjo_visitor_id";
const SESSION_KEY = "baekjo_session_id";
const EXCLUDE_KEY = "baekjo_analytics_exclude";

function getOrCreate(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  storage.setItem(key, value);
  return value;
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // 관리자 화면을 연 브라우저는 이후 공개 페이지 방문도 통계에서 자동 제외합니다.
    if (pathname.startsWith("/admin")) {
      localStorage.setItem(EXCLUDE_KEY, "1");
      return;
    }

    if (localStorage.getItem(EXCLUDE_KEY) === "1") return;
    if (navigator.webdriver) return;

    const visitorId = getOrCreate(localStorage, VISITOR_KEY);
    const sessionId = getOrCreate(sessionStorage, SESSION_KEY);
    const url = new URL(window.location.href);

    const timer = window.setTimeout(() => {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          path: pathname,
          visitorId,
          sessionId,
          referrer: document.referrer || "",
          device: getDeviceType(),
          utmSource: url.searchParams.get("utm_source"),
          utmMedium: url.searchParams.get("utm_medium"),
          utmCampaign: url.searchParams.get("utm_campaign"),
        }),
      }).catch(() => undefined);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
