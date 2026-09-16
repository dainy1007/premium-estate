import Link from "next/link";

const seoLinks = [
  ["현풍 원룸", "/real-estate/hyunpung-one-room"], ["현풍 미니투룸", "/real-estate/hyunpung-mini-two-room"], ["현풍 투룸", "/real-estate/hyunpung-two-room"], ["유가읍 원룸", "/real-estate/yuga-one-room"], ["유가읍 미니투룸", "/real-estate/yuga-mini-two-room"], ["유가읍 투룸", "/real-estate/yuga-two-room"], ["테크노폴리스 원룸", "/real-estate/techno-one-room"], ["테크노폴리스 미니투룸", "/real-estate/techno-mini-two-room"], ["디지스트 원룸", "/real-estate/dgist-one-room"], ["디지스트 미니투룸", "/real-estate/dgist-mini-two-room"], ["테크노폴리스 상가", "/real-estate/techno-commercial"], ["현풍 상가", "/real-estate/hyunpung-commercial"], ["유가읍 상가", "/real-estate/yuga-commercial"], ["구지 원룸", "/real-estate/guji-one-room"], ["구지 상가", "/real-estate/guji-commercial"], ["구지 쿠팡물류 원룸", "/real-estate/guji-coupang-one-room"], ["엘엔에프 원룸", "/real-estate/guji-lnf-one-room"], ["현풍 창고·공장", "/real-estate/hyunpung-warehouse-factory"], ["유가읍 창고·공장", "/real-estate/yuga-warehouse-factory"], ["구지 창고·공장", "/real-estate/guji-warehouse-factory"], ["현풍 토지", "/real-estate/hyunpung-land"], ["유가읍 토지", "/real-estate/yuga-land"], ["구지 토지", "/real-estate/guji-land"],
] as const;

export default function Footer() {
  return (
    <footer className="bg-[#0A2342] px-5 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-[.8fr_1.5fr]">
          <div><h2 className="text-xl font-bold">백조현대부동산중개</h2><p className="mt-2 text-sm leading-6 text-white/70">대표 하순영<br />대구광역시 달성군 유가읍 테크노공원로69 파크뷰타워 105호</p><a href="tel:01077750014" className="mt-2 inline-block font-semibold text-[#C9A227]">010-7775-0014</a><p className="mt-3 text-sm text-white/60">좋은 인연이 좋은 공간을 만듭니다.</p></div>
          <nav aria-label="지역별 매물 바로가기"><p className="text-sm font-semibold text-[#C9A227]">지역·유형별 매물</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/75">{seoLinks.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-white hover:underline">{label}</Link>)}<Link href="/properties" className="font-semibold text-white transition hover:text-[#C9A227]">전체 매물</Link></div></nav>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} 백조현대부동산중개. All rights reserved.</p><div className="flex gap-4"><a href="tel:01077750014" className="text-white/75 hover:text-white">전화문의</a><a href="/#contact" className="text-white/75 hover:text-white">문자상담</a><a href="https://map.kakao.com/link/search/%EB%8C%80%EA%B5%AC%EA%B4%91%EC%97%AD%EC%8B%9C%20%EB%8B%AC%EC%84%B1%EA%B5%B0%20%EC%9C%A0%EA%B0%80%EC%9D%8D%20%ED%85%8C%ED%81%AC%EB%85%B8%EA%B3%B5%EC%9B%90%EB%A1%9C%2069%20%ED%8C%8C%ED%81%AC%EB%B7%B0%ED%83%80%EC%9B%8C%20105%ED%98%B8" target="_blank" rel="noreferrer" className="text-white/75 hover:text-white">오시는길</a></div></div>
      </div>
    </footer>
  );
}
