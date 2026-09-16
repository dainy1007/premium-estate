const publicServices = [
  { name: "인터넷등기소", detail: "등기사항증명서 열람·발급", href: "https://www.iros.go.kr/", icon: "🏛️" },
  { name: "SEE:REAL", detail: "부동산 종합정보", href: "https://seereal.lh.or.kr/", icon: "🏠🔎" },
  { name: "실거래가 공개시스템", detail: "매매·전월세 실거래", href: "https://rt.molit.go.kr/", icon: "📊🔎" },
  { name: "위택스", detail: "취득세·지방세", href: "https://www.wetax.go.kr/", icon: "₩" },
  { name: "정부24", detail: "토지·건축물 민원", href: "https://www.gov.kr/", icon: "📋✓" },
  { name: "국세청", detail: "국세·세금정보", href: "https://www.nts.go.kr/", icon: "NTS" },
  { name: "LH", detail: "토지·주택 정보", href: "https://www.lh.or.kr/", icon: "LH" },
  { name: "국토교통부", detail: "부동산 정책·정보", href: "https://www.molit.go.kr/", icon: "◉" },
];

export default function PublicRecordsLinks() {
  return (
    <section className="border-y border-[#0A2342]/10 bg-gradient-to-r from-[#F5F9FC] via-white to-[#F5F9FC] py-7 md:py-8">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.7fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[.22em] text-[#C9A227]">PUBLIC RECORDS</p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#0A2342]">부동산 공적장부·민원 바로가기</h2>
            <p className="mt-2 text-xs leading-5 text-[#0A2342]/60">등기·토지·건축물·실거래가 등 부동산 관련 공공정보를 고객님이 직접 확인하실 수 있습니다.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
            {publicServices.map((service) => (
              <a key={service.name} href={service.href} target="_blank" rel="noreferrer" className="group flex min-h-[112px] flex-col items-center rounded-xl border border-[#0A2342]/8 bg-white/80 px-2 py-2.5 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#C9A227]/60 hover:shadow-md">
                <span aria-hidden="true" className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#F6F8FA] px-1.5 text-sm font-black text-[#0A4E87]">{service.icon}</span>
                <strong className="mt-1.5 text-[11px] font-extrabold leading-4 text-[#0A2342]">{service.name}</strong>
                <span className="mt-0.5 line-clamp-1 text-[9px] text-[#0A2342]/55">{service.detail}</span>
                <span className="mt-auto flex w-full items-center justify-between border-t border-[#0A2342]/6 pt-1.5 text-[10px] font-bold text-[#0A2342]/75">바로가기 <span className="text-[#C99700]">→</span></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
