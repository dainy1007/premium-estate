import Link from "next/link";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const metadata = {
  title: "상담 문의 | 백조현대부동산중개",
  description: "대구 달성군·테크노폴리스 부동산 매매, 임대, 투자 상담을 접수해 주세요.",
};

type ContactPageProps = {
  searchParams: Promise<{ property?: string; id?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const propertyTitle = String(params.property ?? "").trim().slice(0, 180);
  const propertyId = String(params.id ?? "").replace(/[^0-9]/g, "").slice(0, 20);

  return (
    <main className="relative min-h-screen bg-[#F8F9FB] text-[#0A2342]">
      <Link
        href="/"
        className="fixed left-5 top-5 z-[70] rounded-full border border-white/25 bg-white/95 px-4 py-2 text-sm font-bold text-[#0A2342] shadow-lg backdrop-blur transition hover:bg-[#C9A227]"
      >
        ← HOME
      </Link>

      <Contact propertyTitle={propertyTitle} propertyId={propertyId} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 rounded-[28px] border border-[#0A2342]/10 bg-white p-6 shadow-sm sm:grid-cols-2">
          <a
            href="tel:01077750014"
            className="rounded-2xl bg-[#C9A227] px-6 py-4 text-center font-bold text-[#0A2342]"
          >
            전화 상담 010-7775-0014
          </a>
          <Link
            href="/properties"
            className="rounded-2xl border border-[#0A2342]/15 px-6 py-4 text-center font-bold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            등록 매물 먼저 보기
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
