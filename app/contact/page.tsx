import Link from "next/link";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const metadata = {
  title: "상담 문의 | 백조현대부동산중개",
  description: "대구 달성군·테크노폴리스 부동산 매매, 임대, 투자 상담을 접수해 주세요.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FB] text-[#0A2342]">
      <section className="bg-[#0A2342] px-6 pb-14 pt-24 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm font-semibold text-[#C9A227] hover:underline">
            ← 홈으로
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">부동산 상담 문의</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            찾으시는 매물과 희망 조건을 남겨주시면 확인 후 연락드리겠습니다.
          </p>
        </div>
      </section>

      <Contact />

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
