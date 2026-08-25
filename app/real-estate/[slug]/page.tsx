import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { getSeoLanding, seoLandings } from "@/lib/seo-landings";
import { siteConfig } from "@/lib/site-config";
import type { Property } from "@/types/property";

interface SeoLandingPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 1800;

export function generateStaticParams() {
  return seoLandings.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: SeoLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landing = getSeoLanding(slug);

  if (!landing) {
    return { robots: { index: false, follow: false } };
  }

  const canonical = `${siteConfig.url}/real-estate/${landing.slug}`;

  return {
    title: landing.title,
    description: landing.description,
    keywords: [...landing.keywords, "백조현대부동산중개", "대구 달성군 부동산"],
    alternates: { canonical },
    openGraph: {
      title: landing.title,
      description: landing.description,
      url: canonical,
      siteName: siteConfig.name,
      locale: "ko_KR",
      type: "website",
      images: [{ url: siteConfig.ogImage, alt: landing.heading }],
    },
    robots: { index: true, follow: true },
  };
}

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase().replace(/\s+/g, "");
  return terms.some((term) => normalized.includes(term.toLowerCase().replace(/\s+/g, "")));
}

async function getMatchingProperties(locationTerms: string[], propertyTerms: string[]) {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as Property[])
    .filter((property) => property.is_hidden !== true)
    .filter((property) => {
      const locationText = [property.location, property.address, property.title, property.description]
        .filter(Boolean)
        .join(" ");
      const propertyText = [property.type, property.title, property.description]
        .filter(Boolean)
        .join(" ");
      return includesAny(locationText, locationTerms) && includesAny(propertyText, propertyTerms);
    })
    .slice(0, 24);
}

export default async function SeoLandingPage({ params }: SeoLandingPageProps) {
  const { slug } = await params;
  const landing = getSeoLanding(slug);
  if (!landing) notFound();

  const properties = await getMatchingProperties(landing.locationTerms, landing.propertyTerms);
  const canonical = `${siteConfig.url}/real-estate/${landing.slug}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "매물", item: `${siteConfig.url}/properties` },
      { "@type": "ListItem", position: 3, name: landing.heading, item: canonical },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-[#0A2342]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
        <nav className="mb-6 text-sm text-[#0A2342]/60" aria-label="breadcrumb">
          <Link href="/" className="hover:text-[#C9A227]">홈</Link>
          <span className="mx-2">/</span>
          <Link href="/properties" className="hover:text-[#C9A227]">매물</Link>
          <span className="mx-2">/</span>
          <span>{landing.heading}</span>
        </nav>

        <div className="rounded-[32px] bg-[#F8F9FB] p-7 md:p-10">
          <p className="text-sm font-semibold tracking-[0.24em] text-[#C9A227]">BAEKJO REAL ESTATE</p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">{landing.heading}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#0A2342]/75 md:text-lg">{landing.intro}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {landing.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-[#0A2342]/10 bg-white px-3 py-1.5 text-sm">#{keyword}</span>
            ))}
          </div>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#C9A227]">CURRENT LISTINGS</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">현재 등록 매물</h2>
            </div>
            <Link href="/properties" className="text-sm font-semibold hover:text-[#C9A227]">전체 매물 보기 →</Link>
          </div>

          {properties.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`} className="group overflow-hidden rounded-[28px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-56 overflow-hidden bg-[#F3F4F6]">
                    {property.image_url ? (
                      <img src={property.image_url} alt={`${landing.heading} - ${property.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">등록된 이미지가 없습니다.</div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold text-[#C9A227]">{property.deal_type || property.type || "매물"}</p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-bold">{property.title}</h3>
                    <p className="mt-3 font-bold">{property.price || "가격 문의"}</p>
                    <p className="mt-2 text-sm text-[#0A2342]/60">{property.location || "대구 달성군"}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-[#0A2342]/10 bg-[#F8F9FB] p-8">
              <p className="font-semibold">현재 조건에 맞는 공개 매물이 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-[#0A2342]/65">매물은 수시로 변경됩니다. 전화 상담으로 최신 매물 여부를 확인해 주세요.</p>
            </div>
          )}
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          {landing.faq.map((item) => (
            <article key={item.question} className="rounded-3xl border border-[#0A2342]/10 p-6">
              <h2 className="text-lg font-bold">{item.question}</h2>
              <p className="mt-3 leading-7 text-[#0A2342]/70">{item.answer}</p>
            </article>
          ))}
        </section>

        <section className="mt-14 rounded-[32px] bg-[#0A2342] p-8 text-white md:p-10">
          <h2 className="text-2xl font-bold">지역·유형별 매물 더 보기</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {seoLandings.filter((item) => item.slug !== landing.slug).map((item) => (
              <Link key={item.slug} href={`/real-estate/${item.slug}`} className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                {item.heading}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
