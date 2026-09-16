const publicServices = [
  { name: "인터넷등기소", detail: "등기사항증명서 열람·발급", href: "https://www.iros.go.kr/", icon: "🏛️", tone: "from-[#EAF4FF] to-[#DCEEFF]", accent: "bg-[#2878C8]" },
  { name: "SEE:REAL", detail: "부동산 종합정보 (토지·건축물·가격)", href: "https://seereal.lh.or.kr/", icon: "🏠🔎", tone: "from-[#E9FAF5] to-[#D8F4EA]", accent: "bg-[#2A9D83]" },
  { name: "실거래가 공개시스템", detail: "매매·전월세 실거래가 조회", href: "https://rt.molit.go.kr/", icon: "📊🔎", tone: "from-[#FFF3E8] to-[#FFE6D1]", accent: "bg-[#E98735]" },
  { name: "위택스", detail: "취득세·지방세 납부·조회", href: "https://www.wetax.go.kr/", icon: "🪙₩", tone: "from-[#F3EDFF] to-[#E7DCFF]", accent: "bg-[#7550B7]" },
  { name: "정부24", detail: "토지·건축물 민원 각종 민원서비스", href: "https://www.gov.kr/", icon: "📋✓", tone: "from-[#FFF0F5] to-[#FFE1EC]", accent: "bg-[#C94C7C]" },
  { name: "국세청", detail: "국세·세금정보 사업자 정보", href: "https://www.nts.go.kr/", icon: "NTS", tone: "from-[#FFF9DF] to-[#FFF0B9]", accent: "bg-[#C89A16]" },
  { name: "LH", detail: "토지·주택 정보 분양·임대 정보", href: "https://www.lh.or.kr/", icon: "LH", tone: "from-[#EFF8E9] to-[#DFF0D5]", accent: "bg-[#55933D]" },
  { name: "국토교통부", detail: "부동산 정책·정보 건축행정시스템", href: "https://www.molit.go.kr/", icon: "◉", tone: "from-[#EAF5FF] to-[#DCEEFF]", accent: "bg-[#2677B8]" },
];

export default function PublicRecordsLinks() {
  return (
    <section className="border-y border-[#0A2342]/10 bg-gradient-to-br from-white via-[#F7FAFD] to-[#EEF4F9] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <p className="text-sm font-bold tracking-[.22em] text-[#C9A227]">PUBLIC RECORDS</p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0A2342] sm:text-3xl">부동산 공적장부·민원 바로가기</h2>
            <p className="mt-2 text-sm leading-6 text-[#0A2342]/65">등기·토지·건축물·실거래가 등 부동산 관련 공공정보를 고객님이 직접 확인하실 수 있습니다.</p>
          </div>
          <p className="text-xs text-[#0A2342]/45">각 기관 공식 사이트가 새 창으로 열립니다.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {publicServices.map((service) => (
            <a
              key={service.name}
              href={service.href}
              target="_blank"
              rel="noreferrer"
              className={`group relative flex min-h-[170px] flex-col items-center overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-b px-3 pt-4 text-center shadow-[0_4px_14px_rgba(10,35,66,.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(10,35,66,.14)] ${service.tone}`}
            >
              <span aria-hidden="true" className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-white/65 px-2 text-xl font-black text-[#0A4E87] shadow-sm transition group-hover:scale-105">{service.icon}</span>
              <strong className="mt-2.5 text-[13px] font-extrabold leading-5 text-[#0A2342]">{service.name}</strong>
              <span className="mt-1 min-h-[36px] text-[10px] font-medium leading-[18px] text-[#0A2342]/62">{service.detail}</span>
              <span className={`mt-auto flex w-[calc(100%+1.5rem)] items-center justify-between px-3 py-2 text-[11px] font-bold text-white ${service.accent}`}>
                바로가기 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[#0A2342]">›</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
