const publicServices = [
  { name: "인터넷등기소", detail: "등기사항증명서 열람·발급", href: "https://www.iros.go.kr/", icon: "🏛️", card: "bg-[#EAF5FC]", button: "bg-[#2E91C7]" },
  { name: "SEE:REAL", detail: "부동산 종합정보 (토지·건축물·가격)", href: "https://seereal.lh.or.kr/", icon: "🏠🔎", card: "bg-[#E9F7F1]", button: "bg-[#2DAF8D]" },
  { name: "실거래가 공개시스템", detail: "매매·전월세 실거래가 조회", href: "https://rt.molit.go.kr/", icon: "📊🔎", card: "bg-[#FFF2E6]", button: "bg-[#E98B35]" },
  { name: "위택스", detail: "취득세·지방세 납부·조회", href: "https://www.wetax.go.kr/", icon: "₩", card: "bg-[#F1EAFB]", button: "bg-[#8054C0]" },
  { name: "정부24", detail: "토지·건축물 민원 각종 민원서비스", href: "https://www.gov.kr/", icon: "📋✓", card: "bg-[#FCEAF0]", button: "bg-[#D4517B]" },
  { name: "국세청", detail: "국세·세금정보 사업자 정보", href: "https://www.nts.go.kr/", icon: "NTS", card: "bg-[#FFF6D8]", button: "bg-[#D2A20E]" },
  { name: "LH", detail: "토지·주택 정보 분양·임대 정보", href: "https://www.lh.or.kr/", icon: "LH", card: "bg-[#EDF6E7]", button: "bg-[#65A342]" },
  { name: "국토교통부", detail: "부동산 정책·정보 건축행정시스템", href: "https://www.molit.go.kr/", icon: "◉", card: "bg-[#E9F4FC]", button: "bg-[#2784BE]" },
];

export default function PublicRecordsLinks() {
  return (
    <section className="border-y border-[#0A2342]/10 bg-gradient-to-r from-[#F4F9FD] via-white to-[#F4F9FD] py-7 md:py-8">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.7fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[.22em] text-[#C9A227]">PUBLIC RECORDS</p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#0A2342]">부동산 공적장부·민원 바로가기</h2>
            <p className="mt-2 text-xs leading-5 text-[#0A2342]/60">등기·토지·건축물·실거래가 등 부동산 관련 공공정보를 고객님이 직접 확인하실 수 있습니다.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {publicServices.map((service) => (
              <a key={service.name} href={service.href} target="_blank" rel="noreferrer" className={`group flex min-h-[142px] flex-col items-center overflow-hidden rounded-xl border border-white/90 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md ${service.card}`}>
                <div className="flex flex-1 flex-col items-center px-2 pt-3">
                  <span aria-hidden="true" className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-white/75 px-1.5 text-sm font-black text-[#07518A] shadow-sm">{service.icon}</span>
                  <strong className="mt-2 text-[11px] font-extrabold leading-4 text-[#0A2342]">{service.name}</strong>
                  <span className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#0A2342]/60">{service.detail}</span>
                </div>
                <span className={`mt-2 flex w-full items-center justify-between px-2.5 py-2 text-[10px] font-extrabold text-white ${service.button}`}>바로가기 <span>→</span></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
