"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deriveLocationFromAddress } from "@/lib/property-normalize";
import type { Property } from "@/types/property";

// 대구테크노폴리스(유가읍) 중심. 좌표 오류가 생기더라도 아래 주소 재검색으로 다시 고정합니다.
const FALLBACK_CENTER = { lat: 35.6920, lng: 128.4611 };
const SERVICE_AREA_ADDRESS = "대구광역시 달성군 유가읍 테크노공원로 69";

export default function PropertyMapPage() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [type, setType] = useState("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("properties").select("*, property_images(*)").order("created_at", { ascending: false });
      setProperties(((data || []) as Property[]).filter((p) => p.is_hidden !== true && p.listing_status !== "completed"));
      setLoading(false);
    })();
  }, []);

  const types = useMemo(() => ["전체", ...Array.from(new Set(properties.map((p) => p.type).filter(Boolean) as string[]))], [properties]);
  const visible = useMemo(() => type === "전체" ? properties : properties.filter((p) => p.type === type), [properties, type]);

  const renderMap = useCallback(() => {
    const km = window.kakao?.maps;
    const el = containerRef.current;
    if (!km || !el) return;

    el.innerHTML = "";
    const map = new km.Map(el, { center: new km.LatLng(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng), level: 7 });
    const geocoder = new km.services.Geocoder();

    // 화면을 다른 지역에 두지 않고 실제 영업권인 유가·현풍·구지 생활권으로 다시 고정합니다.
    geocoder.addressSearch(SERVICE_AREA_ADDRESS, (centerResult: Array<{ x: string; y: string }>, centerStatus: string) => {
      if (centerStatus === km.services.Status.OK && centerResult[0]) {
        map.setCenter(new km.LatLng(Number(centerResult[0].y), Number(centerResult[0].x)));
        map.setLevel(7);
      }
    });

    visible.forEach((property) => {
      const address = String(property.address || "").trim();
      if (!address) return;
      geocoder.addressSearch(address, (result: Array<{ x: string; y: string }>, status: string) => {
        if (status !== km.services.Status.OK || !result[0]) return;
        const position = new km.LatLng(Number(result[0].y), Number(result[0].x));
        const marker = new km.Marker({ map, position });
        const infoWindow = new km.InfoWindow({
          content: `<div style="padding:8px 10px;font-size:12px;white-space:nowrap"><a href="/properties/${property.id}" style="color:#0A2342;font-weight:700;text-decoration:none">${deriveLocationFromAddress(address) || property.location || "매물"} · ${property.type || "매물"} →</a></div>`,
        });
        km.event.addListener(marker, "click", () => infoWindow.open(map, marker));
      });
    });
  }, [visible]);

  const initialize = useCallback(() => {
    if (initializedRef.current || !containerRef.current || !window.kakao?.maps) return;
    initializedRef.current = true;
    window.kakao.maps.load(renderMap);
  }, [renderMap]);

  useEffect(() => {
    if (!loading && initializedRef.current) renderMap();
  }, [loading, renderMap]);

  return <main className="min-h-screen bg-[#F8F9FB] pb-20 text-[#0A2342]">
    {appKey && <Script id="property-kakao-map-sdk" src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`} strategy="afterInteractive" onLoad={initialize} onReady={initialize} />}
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3"><div><Link href="/" className="text-sm font-semibold text-[#C9A227]">← 홈</Link><h1 className="mt-2 text-2xl font-extrabold">지도에서 매물 찾기</h1><p className="mt-1 text-sm text-[#0A2342]/60">유가읍·현풍읍·구지면 중심의 백조현대부동산 공개 매물만 표시됩니다.</p></div><Link href="/properties" className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2 text-sm font-semibold">목록검색</Link></div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{types.map((v) => <button key={v} onClick={() => setType(v)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${type === v ? "border-[#C9A227] bg-[#C9A227]/15" : "border-[#0A2342]/15 bg-white"}`}>{v}</button>)}</div>
      {!appKey ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm">지도 설정을 확인해 주세요.</div> : <div ref={containerRef} className="h-[68vh] min-h-[480px] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm" />}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm font-semibold">현재 공개 매물 {visible.length}개</p><div className="mt-3 flex flex-wrap gap-2">{visible.slice(0, 12).map((p) => <Link key={p.id} href={`/properties/${p.id}`} className="rounded-full bg-[#F8F9FB] px-3 py-2 text-xs font-semibold">{deriveLocationFromAddress(p.address) || p.location} · {p.type || "매물"}</Link>)}</div></div>
    </div>
  </main>;
}
