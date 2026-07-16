import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PropertyGallery from "@/components/properties/PropertyGallery";
import PropertyShareActions from "@/components/properties/PropertyShareActions";

interface PropertyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  const { data: property, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", Number(id))
    .single();

  if (error || !property) {
    notFound();
  }

  const { data: relatedProperties } = await supabase
    .from("properties")
    .select("id, title, price, location, deal_type, type, image_url")
    .neq("id", Number(id))
    .eq("type", property.type)
    .order("created_at", { ascending: false })
    .limit(3);

  const detailItems = [
    { label: "지역", value: property.location },
    { label: "기본 면적", value: property.area },
    { label: "계약면적", value: property.contract_area },
    { label: "전용면적", value: property.exclusive_area },
    {
      label: "방",
      value: property.rooms ? `${property.rooms}개` : null,
    },
    {
      label: "욕실",
      value: property.bathrooms ? `${property.bathrooms}개` : null,
    },
    { label: "층수", value: property.floor },
    {
      label: "거래유형",
      value: property.deal_type || property.type,
    },
  ].filter((item) => item.value);

  const mapAddress = property.address || property.location;
  const encodedAddress = encodeURIComponent(mapAddress || "대구광역시 달성군 유가읍");

  return (
    <main className="min-h-screen bg-white pb-24 text-[#0A2342] md:pb-0">
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-16">
        <Link
          href="/properties"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#0A2342]/10 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
        >
          ← 매물 목록으로
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <PropertyGallery
            title={property.title}
            fallbackImageUrl={property.image_url}
            images={(property.property_images || []).sort(
              (a: { display_order: number }, b: { display_order: number }) =>
                a.display_order - b.display_order
            )}
          />

          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">
              백조현대부동산중개
            </p>

            <p className="mt-2 text-sm text-[#0A2342]/60">
              Trusted Real Estate Partner
            </p>

            <span className="mt-6 inline-flex w-fit rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-sm font-medium text-[#C9A227]">
              {property.deal_type || property.type || "매물"}
            </span>

            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
              {property.title}
            </h1>

            <p className="mt-4 text-xl font-bold text-[#C9A227]">
              {property.price || "가격 문의"}
            </p>

            <PropertyShareActions title={property.title} />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {detailItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#F8F9FB] p-4">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-1 font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            {property.address && (
              <div className="mt-4 rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-gray-500">상세 주소</p>
                <p className="mt-1 font-semibold">{property.address}</p>
              </div>
            )}

            {mapAddress && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`https://map.naver.com/p/search/${encodedAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
                >
                  네이버지도에서 보기
                </a>
                <a
                  href={`https://map.kakao.com/link/search/${encodedAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
                >
                  카카오맵에서 보기
                </a>
              </div>
            )}

            {property.description && (
              <div className="mt-4 rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-gray-500">매물 설명</p>
                <p className="mt-1 whitespace-pre-line leading-7">
                  {property.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 rounded-[32px] bg-[#0A2340] p-8 text-white shadow-xl">
          <h2 className="text-2xl font-bold">
            가치를 보는 안목,
            <br />
            신뢰를 만드는 중개
          </h2>

          <p className="mt-4 leading-8 text-white/80">
            고객의 성공적인 부동산 선택을 위해 함께 고민하고 함께
            만들어 가겠습니다.
            <br />
            상가 · 원룸 · 투룸 · 다가구 · 아파트 · 오피스텔 · 창고 ·
            공장 전문 상담을 제공합니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="tel:01077750014"
              className="rounded-full bg-[#C9A227] px-6 py-3.5 text-center font-semibold text-[#0A2342] hover:bg-[#d8b53b]"
            >
              ☎ 전화 상담 010-7775-0014
            </a>

            <Link
              href="/properties"
              className="rounded-full border border-white/30 px-6 py-3.5 text-center font-semibold text-white hover:bg-white/10"
            >
              다른 매물 보기
            </Link>
          </div>
        </div>

        {relatedProperties && relatedProperties.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.25em] text-[#C9A227]">
                  RELATED PROPERTIES
                </p>
                <h2 className="mt-2 text-3xl font-bold">비슷한 매물</h2>
              </div>
              <Link href="/properties" className="text-sm font-semibold hover:text-[#C9A227]">
                전체 매물 보기 →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {relatedProperties.map((item) => (
                <Link
                  key={item.id}
                  href={`/properties/${item.id}`}
                  className="group overflow-hidden rounded-[28px] border border-[#0A2342]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="overflow-hidden bg-[#F3F4F6]">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center text-sm text-gray-500">
                        등록된 이미지가 없습니다.
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold text-[#C9A227]">
                      {item.deal_type || item.type || "매물"}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 font-bold">{item.price || "가격 문의"}</p>
                    <p className="mt-2 text-sm text-[#0A2342]/60">{item.location || "지역 문의"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 rounded-[32px] border p-8">
          <h2 className="text-2xl font-bold">백조현대부동산중개</h2>

          <div className="mt-4 space-y-2 text-[#0A2342]/80">
            <p>대표 : 하순영</p>

            <p>
              전화 :
              <a
                href="tel:01077750014"
                className="ml-2 font-semibold text-[#C9A227]"
              >
                010-7775-0014
              </a>
            </p>

            <p>
              주소 : 대구광역시 달성군 유가읍 테크노공원로69 파크뷰타워
              105호
            </p>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0A2342]/10 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(10,35,66,0.12)] backdrop-blur md:hidden">
        <a
          href="tel:01077750014"
          className="flex w-full items-center justify-center rounded-full bg-[#C9A227] px-6 py-3.5 font-bold text-[#0A2342]"
        >
          ☎ 이 매물 전화 상담
        </a>
      </div>
    </main>
  );
}
