import type { Metadata } from "next";
import Link from "next/link";
import { getLatestProperties } from "@/lib/property";
import { buildImageAlt, buildSeoTitle } from "@/lib/property-seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.baekjohd.com";

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
    canonical: `${SITE_URL}/properties`,
  },
  openGraph: {
    title: "대구 달성군 매물 찾기 | 백조현대부동산중개",
    description:
      "유가읍·현풍읍·구지면과 대구테크노폴리스의 등록 매물을 조건별로 찾아보세요.",
    url: `${SITE_URL}/properties`,
    siteName: "백조현대부동산중개",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PropertiesLayout({ children }: { children: React.ReactNode }) {
  const latestProperties = await getLatestProperties(6);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "대구 달성군 부동산 매물",
    description: "유가읍·현풍읍·구지면과 대구테크노폴리스의 공개 부동산 매물 목록입니다.",
    url: `${SITE_URL}/properties`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: latestProperties.map((property, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: buildSeoTitle(property),
        url: `${SITE_URL}/properties/${property.id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c") }}
      />
      {children}
      {latestProperties.length > 0 && (
        <section className="bg-white px-6 py-16 text-[#0A2342]">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.22em] text-[#C9A227]">LATEST LISTINGS</p>
                <h2 className="mt-2 text-3xl font-bold">최근 등록 매물</h2>
                <p className="mt-3 text-[#0A2342]/65">유가읍·현풍읍·구지면과 대구테크노폴리스의 최근 공개 매물입니다.</p>
              </div>
              <Link href="/" className="text-sm font-semibold hover:text-[#C9A227]">홈으로 →</Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {latestProperties.map((property) => {
                const images = [...(property.property_images || [])].sort(
                  (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order,
                );
                const cover = images[0]?.image_url || property.image_url;
                const seoTitle = buildSeoTitle(property);

                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="group overflow-hidden rounded-[26px] border border-[#0A2342]/10 bg-[#F8F9FB] transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="h-52 overflow-hidden bg-[#EEF1F5]">
                      {cover ? (
                        <img
                          src={cover}
                          alt={buildImageAlt(property, 1)}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#0A2342]/45">이미지 준비중</div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-sm font-semibold text-[#C9A227]">{property.deal_type || property.type || "매물"}</p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-bold">{seoTitle}</h3>
                      <p className="mt-3 font-bold">{property.price || "가격 문의"}</p>
                      <p className="mt-2 text-sm text-[#0A2342]/60">{property.address || property.location || "대구 달성군"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
