"use client";

import { useEffect, useState } from "react";

function decodeKey(value:string){const padding="=".repeat((4-value.length%4)%4);const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}

export default function AdminPushButton(){
 const [state,setState]=useState<"checking"|"ready"|"enabled"|"unsupported"|"blocked"|"setup">("checking");
 useEffect(()=>{void (async()=>{if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){setState("unsupported");return;}if(Notification.permission==="denied"){setState("blocked");return;}const reg=await navigator.serviceWorker.register("/push-sw.js");const sub=await reg.pushManager.getSubscription();setState(sub?"enabled":"ready");})().catch(()=>setState("ready"));},[]);
 async function enable(){try{const permission=await Notification.requestPermission();if(permission!=="granted"){setState(permission==="denied"?"blocked":"ready");return;}const keyResponse=await fetch("/api/admin/push",{cache:"no-store"});if(!keyResponse.ok)throw new Error("key");const {publicKey,configured}=await keyResponse.json();if(!configured){setState("setup");return;}const reg=await navigator.serviceWorker.register("/push-sw.js");let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(publicKey)});const save=await fetch("/api/admin/push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sub.toJSON())});if(!save.ok)throw new Error("save");setState("enabled");}catch{setState("ready");}}
 if(state==="unsupported")return <span className="text-xs text-slate-500">이 기기는 푸시 알림 미지원</span>;
 if(state==="blocked")return <span className="text-xs font-semibold text-red-600">브라우저 알림이 차단됨</span>;
 if(state==="setup")return <span className="text-xs font-semibold text-amber-700">푸시 서버 설정 대기중</span>;
 if(state==="enabled")return <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">🔔 휴대폰 문의 알림 켜짐</span>;
 return <button type="button" onClick={enable} disabled={state==="checking"} className="rounded-lg border border-[#C9A227] bg-[#C9A227]/10 px-3 py-2 text-xs font-bold text-[#0A2342] disabled:opacity-50">🔔 {state==="checking"?"알림 확인중":"휴대폰 문의 알림 받기"}</button>;
}
