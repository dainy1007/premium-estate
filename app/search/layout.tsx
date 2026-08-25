import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물 검색",
  description: "백조현대부동산중개 매물 검색 결과입니다.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
