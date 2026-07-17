import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";
export const alt = `${siteConfig.name} - 대구 달성군 부동산 전문`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 52%, #0f766e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {siteConfig.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.04em",
            }}
          >
            <span>가치를 보는 안목,</span>
            <span>신뢰를 만드는 중개</span>
          </div>
          <div style={{ display: "flex", fontSize: 30, opacity: 0.9 }}>
            달성군 · 유가읍 · 현풍읍 · 구지면 · 대구테크노폴리스
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          상가 · 아파트 · 원룸 · 오피스텔 · 창고 · 공장 · 토지
        </div>
      </div>
    ),
    size
  );
}
