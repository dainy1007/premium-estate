import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대구 달성군 매물 찾기 | 유가읍·현풍읍·구지면 부동산",
  description:
    "대구 달성군 유가읍·현풍읍·구지면과 대구테크노폴리스의 원룸, 미니투룸, 투룸, 상가, 아파트, 오피스텔, 창고·공장, 토지 매물을 확인하세요.",
  keywords: [
    "유가읍부동산",
    "현풍부동산",
    "구지부동산",
    "대구테크노폴리스부동산",
    "현풍원룸",
    "유가읍미니투룸",
    "테크노폴리스상가",
    "백조현대부동산중개",
  ],
  alternates: {
    canonical: "https://www.baekjohd.com/properties",
  },
  openGraph: {
    title: "대구 달성군 매물 찾기 | 백조현대부동산중개",
    description:
      "유가읍·현풍읍·구지면과 대구테크노폴리스의 등록 매물을 조건별로 찾아보세요.",
    url: "https://www.baekjohd.com/properties",
    siteName: "백조현대부동산중개",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
