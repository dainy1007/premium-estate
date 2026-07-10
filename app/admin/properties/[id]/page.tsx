import Link from "next/link";
import { notFound } from "next/navigation";
import { properties } from "../../../../data/properties";

interface AdminPropertyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPropertyDetailPage({
  params,
}: AdminPropertyDetailPageProps) {
  const { id } = await params;
  const property = properties.find((item) => item.id === Number(id));

  if (!property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl font-bold">{property.title}</h1>
            <p className="mt-3 text-sm text-[#0A2342]/70">
              {property.location} · {property.area} · {property.type}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
            >
              목록으로
            </Link>
            <Link
              href={`/admin/properties/${property.id}/edit`}
              className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:-translate-y-1 hover:bg-[#d8b53b]"
            >
              수정하기
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[32px] border border-[#0A2342]/10 bg-white shadow-sm">
            <img
              src={property.image}
              alt={property.title}
              className="h-[420px] w-full object-cover"
            />
          </div>

          <div className="rounded-[32px] border border-[#0A2342]/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">매물 요약</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">가격</p>
                <p className="mt-1 font-semibold">{property.price}</p>
              </div>

              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">지역</p>
                <p className="mt-1 font-semibold">{property.location}</p>
              </div>

              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">면적</p>
                <p className="mt-1 font-semibold">{property.area}</p>
              </div>

              <div className="rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-sm text-[#0A2342]/60">유형</p>
                <p className="mt-1 font-semibold">{property.type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}