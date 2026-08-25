import Link from "next/link";

const seoLinks = [
  ["현풍 원룸", "/real-estate/hyunpung-one-room"],
  ["현풍 미니투룸", "/real-estate/hyunpung-mini-two-room"],
  ["현풍 투룸", "/real-estate/hyunpung-two-room"],
  ["유가읍 원룸", "/real-estate/yuga-one-room"],
  ["유가읍 미니투룸", "/real-estate/yuga-mini-two-room"],
  ["유가읍 투룸", "/real-estate/yuga-two-room"],
  ["테크노폴리스 원룸", "/real-estate/techno-one-room"],
  ["테크노폴리스 미니투룸", "/real-estate/techno-mini-two-room"],
  ["디지스트 원룸", "/real-estate/dgist-one-room"],
  ["디지스트 미니투룸", "/real-estate/dgist-mini-two-room"],
  ["테크노폴리스 상가", "/real-estate/techno-commercial"],
  ["현풍 상가", "/real-estate/hyunpung-commercial"],
  ["유가읍 상가", "/real-estate/yuga-commercial"],
  ["구지 원룸", "/real-estate/guji-one-room"],
  ["구지 상가", "/real-estate/guji-commercial"],
] as const;

export default function Footer() {
  return (
    <footer className="bg-[#0A2342] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-xl font-bold">백조현대부동산중개</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              대표 하순영
              <br />
              대구광역시 달성군 유가읍 테크노공원로69 파크뷰타워 105호
            </p>
            <a href="tel:01077750014" className="mt-3 inline-block font-semibold text-[#C9A227]">
              010-7775-0014
            </a>
          </div>

          <nav aria-label="지역별 매물 바로가기">
            <p className="text-sm font-semibold text-[#C9A227]">지역·유형별 매물</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/75">
              {seoLinks.map(([label, href]) => (
                <Link key={href} href={href} className="transition hover:text-white hover:underline">
                  {label}
                </Link>
              ))}
              <Link href="/properties" className="font-semibold text-white transition hover:text-[#C9A227]">
                전체 매물
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} 백조현대부동산중개. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
