"use client";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";

const OFFICE_NAME = "백조현대부동산중개";
const OFFICE_ADDRESS = "대구광역시 달성군 유가읍 테크노공원로 69";
const OFFICE_DETAIL = "파크뷰타워 105호";
const OFFICE_PHONE = "010-7775-0014";
const FALLBACK_LAT = 35.6939;
const FALLBACK_LNG = 128.4598;

type MapStatus = "loading" | "ready" | "error" | "missing-key";
type Coordinates = { latitude: number; longitude: number };

type KakaoMaps = {
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

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  const [status, setStatus] = useState<MapStatus>(
    appKey ? "loading" : "missing-key",
  );
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: FALLBACK_LAT,
    longitude: FALLBACK_LNG,
  });

  const initializeMap = useCallback(() => {
    if (initializedRef.current) return;

    const container = mapContainerRef.current;
    const kakaoMaps = window.kakao?.maps;

    if (!container || !kakaoMaps) {
      console.error("[KakaoMap] SDK 또는 지도 컨테이너를 찾지 못했습니다.");
      setStatus("error");
      return;
    }

    initializedRef.current = true;

    kakaoMaps.load(() => {
      try {
        const fallbackPosition = new kakaoMaps.LatLng(
          FALLBACK_LAT,
          FALLBACK_LNG,
        );
        const map = new kakaoMaps.Map(container, {
          center: fallbackPosition,
          level: 3,
        });
        const geocoder = new kakaoMaps.services.Geocoder();

        geocoder.addressSearch(OFFICE_ADDRESS, (result, searchStatus) => {
          if (searchStatus !== kakaoMaps.services.Status.OK || !result[0]) {
            console.error("[KakaoMap] 주소 검색 실패:", searchStatus, result);
            setStatus("error");
            return;
          }

          const latitude = Number(result[0].y);
          const longitude = Number(result[0].x);
          const position = new kakaoMaps.LatLng(latitude, longitude);

          setCoordinates({ latitude, longitude });
          map.setCenter(position);

          const marker = new kakaoMaps.Marker({ map, position });
          const infoWindow = new kakaoMaps.InfoWindow({
            content:
              '<div style="width:220px;padding:12px;text-align:center;font-size:14px;line-height:1.5;color:#0A2342"><strong>백조현대부동산중개</strong><br/><span style="font-size:12px;color:#666">파크뷰타워 105호</span></div>',
          });

          infoWindow.open(map, marker);
          setStatus("ready");
        });
      } catch (error) {
        console.error("[KakaoMap] 지도 초기화 실패:", error);
        setStatus("error");
      }
    });
  }, []);

  const encodedName = encodeURIComponent(OFFICE_NAME);
  const encodedAddress = encodeURIComponent(`${OFFICE_ADDRESS} ${OFFICE_DETAIL}`);
  const kakaoMapUrl = `https://map.kakao.com/link/search/${encodedAddress}`;
  const directionsUrl = `https://map.kakao.com/link/to/${encodedName},${coordinates.latitude},${coordinates.longitude}`;

  return (
    <section className="bg-white px-6 py-20">
      {appKey && (
        <Script
          id="kakao-map-sdk"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`}
          strategy="afterInteractive"
          onLoad={() => {
            console.info("[KakaoMap] SDK 로드 완료");
            initializeMap();
          }}
          onError={(error) => {
            console.error("[KakaoMap] SDK 로드 실패:", error);
            setStatus("error");
          }}
        />
      )}

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
                  {status === "missing-key" &&
                    "카카오맵 JavaScript 키가 설정되지 않았습니다."}
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
              {OFFICE_ADDRESS}
              <br />
              {OFFICE_DETAIL}
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
