"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PushState = "checking" | "ready" | "enabled" | "unsupported" | "blocked" | "setup" | "error";

class PushSetupError extends Error {}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
}

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) throw new Error("관리자 로그인 후 다시 연결해 주세요.");
    throw new Error(data.error || "알림 연결에 실패했습니다. 다시 시도해 주세요.");
  }
  return data;
}

async function connectPush(reconnect = false) {
  const config = await responseData(await fetch("/api/admin/push", { cache: "no-store" }));
  if (!config.configured) throw new PushSetupError("알림 서버 설정을 확인해 주세요.");
  await navigator.serviceWorker.register("/push-sw.js", { updateViaCache: "none" });
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  const previousEndpoint = reconnect ? subscription?.endpoint : undefined;
  if (reconnect && subscription) {
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(config.publicKey) });
  }
  // A browser subscription alone does not prove that the server can reach it.
  await responseData(await fetch("/api/admin/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...subscription.toJSON(), previousEndpoint }),
  }));
}

export default function AdminPushButton() {
  const isLogin = usePathname() === "/admin/login";
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLogin) return;
    let active = true;
    void (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (active) setState("unsupported");
        return;
      }
      if (Notification.permission !== "granted") {
        if (active) setState(Notification.permission === "denied" ? "blocked" : "ready");
        return;
      }
      await connectPush();
      if (active) setState("enabled");
    })().catch((error: unknown) => {
      if (!active) return;
      setState(error instanceof PushSetupError ? "setup" : "error");
      setMessage(error instanceof Error ? error.message : "알림 연결을 다시 확인해 주세요.");
    });
    return () => { active = false; };
  }, [isLogin]);

  async function enable(reconnect = false) {
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "ready");
        return;
      }
      await connectPush(reconnect);
      setState("enabled");
      setMessage("이 휴대폰에서 알림 테스트로 수신을 확인해 주세요.");
    } catch (error: unknown) {
      setState(error instanceof PushSetupError ? "setup" : "error");
      setMessage(error instanceof Error ? error.message : "알림 연결에 실패했습니다. 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) throw new Error("알림 연결이 없습니다. 다시 연결해 주세요.");
      const response = await fetch("/api/admin/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (response.status === 410) setState("error");
      await responseData(response);
      setMessage("테스트 알림을 전송했습니다. 휴대폰 알림창을 확인해 주세요.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "테스트 알림 전송에 실패했습니다.");
    } finally { setBusy(false); }
  }

  if (isLogin) return null;
  const buttonClass = "rounded-lg border border-[#C9A227] bg-[#C9A227]/10 px-3 py-2 text-sm font-bold text-[#0A2342] disabled:opacity-50";
  return <div className="max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
    {state === "unsupported" ? <p className="text-sm text-slate-600">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
      : state === "blocked" ? <p className="max-w-64 text-sm font-semibold text-red-600">브라우저에서 이 사이트의 알림을 허용한 뒤 새로고침해 주세요.</p>
      : state === "enabled" ? <>
        <p className="text-sm font-bold text-emerald-700">🔔 휴대폰 문의 알림 연결됨</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => void test()} disabled={busy} className={buttonClass}>알림 테스트</button>
          <button type="button" onClick={() => void enable(true)} disabled={busy} className={buttonClass}>다시 연결</button>
        </div>
      </> : <button type="button" onClick={() => void enable(state === "error")} disabled={busy || state === "checking"} className={buttonClass}>
        🔔 {busy ? "연결 중…" : state === "checking" ? "알림 확인 중…" : state === "error" ? "휴대폰 알림 다시 연결" : "휴대폰 문의 알림 받기"}
      </button>}
    {message && <p role="status" aria-live="polite" className="mt-2 max-w-64 text-sm text-slate-600">{message}</p>}
  </div>;
}
