const fallbackUrl = "https://premium-estate-rho.vercel.app";

export const siteConfig = {
  name: "백조현대부동산중개",
  representative: "하순영",
  title: "백조현대부동산중개 | 대구 달성군 부동산 전문",
  description:
    "대구 달성군 유가읍·현풍읍·구지면과 대구테크노폴리스의 상가, 아파트, 원룸·투룸·다가구, 오피스텔, 창고·공장, 토지 전문 부동산입니다.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || fallbackUrl).replace(/\/$/, ""),
  ogImage: "/opengraph-image",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  serviceAreas: [
    "대구광역시 달성군",
    "유가읍",
    "현풍읍",
    "구지면",
    "대구테크노폴리스",
    "창녕군",
  ],
  keywords: [
    "대구 달성군 부동산",
    "유가읍 부동산",
    "현풍읍 부동산",
    "구지면 부동산",
    "대구테크노폴리스 부동산",
    "달성군 상가 임대",
    "달성군 상가 매매",
    "달성군 아파트",
    "달성군 원룸",
    "달성군 토지",
    "달성군 창고",
    "달성군 공장",
    "백조현대부동산중개",
  ],
} as const;
