"use client";

import { useEffect, useRef, useState } from "react";

const OFFICE_NAME = "백조현대부동산중개";
const OFFICE_ADDRESS = "대구광역시 달성군 유가읍 테크노공원로 69 파크뷰타워 105호";
const OFFICE_PHONE = "010-7775-0014";

type MapStatus = "loading" | "ready" | "error" | "missing-key";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (latitude: number, longitude: number) => unknown;
        Map: new (
          container: HTMLElement,
          options: { center: unknown; level: number },
        ) => {
          setCenter: (position: unknown) => void;
        };
        Marker: new (options: { map: unknown; position: unknown }) => unknown;
        InfoWindow: new (options: { content: string }) => {
          open: (map: unknown, marker: unknown) => void;
        };
        services: {
          Status: { OK: string };
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (
                result: Array<{ x: string; y: string }>,
                status: string,
              ) => void,
            ) => void;
          };
        };
      };
    };
  }
}

function loadKakaoMapScript(appKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(resolve);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-map="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao?.maps.load(resolve);
      });
      existingScript.addEventListener("error", () => reject(new Error("script")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMap = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.onload = () => window.kakao?.maps.load(resolve);
    script.onerror = () => reject(new Error("script"));
    document.head.appendChild(script);
  });
}

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

    if (!appKey) {
      setStatus("missing-key");
      return;
    }

    let cancelled = false;

    async function initializeMap() {
      try {
        await loadKakaoMapScript(appKey);

        if (cancelled || !mapContainerRef.current || !window.kakao?.maps) {
          return;
        }

        const { maps } = window.kakao;
        const fallbackPosition = new maps.LatLng(35.6939, 128.4598);
        const map = new maps.Map(mapContainerRef.current, {
          center: fallbackPosition,
          level: 3,
        });
        const geocoder = new maps.services.Geocoder();

        geocoder.addressSearch(OFFICE_ADDRESS, (result, searchStatus) => {
          if (cancelled) return;

          if (searchStatus !== maps.services.Status.OK || !result[0]) {
            setStatus("error");
            return;
          }

          const position = new maps.LatLng(
            Number(result[0].y),
            Number(result[0].x),
          );
          map.setCenter(position);

          const marker = new maps.Marker({ map, position });
          const infoWindow = new maps.InfoWindow({
            content:
              '<div style="width:210px;padding:12px;text-align:center;font-size:14px;line-height:1.5;color:#0A2342"><strong>백조현대부동산중개</strong><br/><span style="font-size:12px;color:#666">파크뷰타워 105호</span></div>',
          });
          infoWindow.open(map, marker);
          setStatus("ready");
        });
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, []);

  const encodedName = encodeURIComponent(OFFICE_NAME);
  const encodedAddress = encodeURIComponent(OFFICE_ADDRESS);
  const kakaoMapUrl = `https://map.kakao.com/link/search/${encodedAddress}`;
  const directionsUrl = `https://map.kakao.com/link/to/${encodedName},35.6939,128.4598`;

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.35em] text-[#C9A227]">
            LOCATION
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#0A2342]">
            찾아오시는 길
          </h2>
          <p className="mt-4 text-gray-600">{OFFICE_NAME}</p>
        </div>

        <div className="relative mt-10 min-h-[450px] overflow-hidden rounded-3xl bg-slate-100 shadow-lg">
          <div ref={mapContainerRef} className="h-[450px] w-full" />

          {status !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-6 text-center">
              <div>
                <p className="font-semibold text-[#0A2342]">
                  {status === "loading" && "카카오맵을 불러오는 중입니다."}
                  {status === "missing-key" && "카카오맵 API 키가 설정되지 않았습니다."}
                  {status === "error" && "지도를 불러오지 못했습니다."}
                </p>
                {status !== "loading" && (
                  <a
                    href={kakaoMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-[#C9A227] underline underline-offset-4"
                  >
                    카카오맵에서 위치 확인하기
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-[#0A2342] p-6 text-white md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h3 className="text-xl font-semibold">{OFFICE_NAME}</h3>
            <p className="mt-3 leading-7 text-white/80">
              대구광역시 달성군 유가읍 테크노공원로 69
              <br />
              파크뷰타워 105호
            </p>
            <a
              href="tel:01077750014"
              className="mt-4 inline-block font-semibold text-[#C9A227]"
            >
              ☎ {OFFICE_PHONE}
            </a>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-0">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#C9A227] px-5 py-3 text-center font-semibold text-[#0A2342] transition hover:brightness-110"
            >
              길찾기
            </a>
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/30 px-5 py-3 text-center font-semibold text-white transition hover:bg-white/10"
            >
              카카오맵에서 보기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
