const publicServices = [
  { name: "인터넷등기소", detail: "등기사항증명서", href: "https://www.iros.go.kr/", icon: "등기", iconTone: "bg-[#173A63] text-white", tone: "bg-[#F4F7FB] border-[#0A2342]/16" },
  { name: "SEE:REAL", detail: "부동산 종합정보", href: "https://seereal.lh.or.kr/", icon: "SR", iconTone: "bg-[#2F7C6D] text-white", tone: "bg-[#F7F8F2] border-[#C9A227]/25" },
  { name: "실거래가 공개시스템", detail: "매매·전월세 실거래", href: "https://rt.molit.go.kr/", icon: "실거래", iconTone: "bg-[#C99700] text-white", tone: "bg-[#FBF7EE] border-[#C9A227]/28" },
  { name: "위택스", detail: "취득세·지방세", href: "https://www.wetax.go.kr/", icon: "W", iconTone: "bg-[#2875B8] text-white", tone: "bg-[#F3F7F8] border-[#0A2342]/14" },
  { name: "정부24", detail: "토지·건축물 민원", href: "https://www.gov.kr/", icon: "24", iconTone: "bg-[#2458A6] text-white", tone: "bg-[#F8F6F1] border-[#C9A227]/22" },
  { name: "국세청", detail: "국세·세금정보", href: "https://www.nts.go.kr/", icon: "국세", iconTone: "bg-[#315A87] text-white", tone: "bg-[#F4F7FB] border-[#0A2342]/16" },
  { name: "LH", detail: "토지·주택 정보", href: "https://www.lh.or.kr/", icon: "LH", iconTone: "bg-[#1677B8] text-white", tone: "bg-[#F7F8F2] border-[#C9A227]/25" },
  { name: "국토교통부", detail: "부동산 정책·정보", href: "https://www.molit.go.kr/", icon: "국토", iconTone: "bg-[#0A496F] text-white", tone: "bg-[#F3F7F8] border-[#0A2342]/14" },
];

export default function PublicRecordsLinks() {
  return (
    <section className="border-y border-[#0A2342]/10 bg-[#F8F9FB] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <p className="text-sm font-semibold tracking-[.2em] text-[#C9A227]">PUBLIC RECORDS</p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">부동산 공적장부·민원 바로가기</h2>
            <p className="mt-2 text-sm leading-6 text-[#0A2342]/65">등기·토지·건축물·실거래가 등 부동산 관련 공공정보를 고객님이 직접 확인하실 수 있습니다.</p>
          </div>
          <p className="text-xs text-[#0A2342]/45">각 기관 공식 사이트가 새 창으로 열립니다.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {publicServices.map((service) => (
            <a key={service.name} href={service.href} target="_blank" rel="noreferrer" className={`group relative flex min-h-[132px] flex-col items-center justify-center overflow-hidden rounded-2xl border px-3 py-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#C9A227]/70 hover:bg-[#FFF9E8] hover:shadow-md ${service.tone}`}>
              <span className="absolute inset-x-0 top-0 h-1 bg-[#C9A227]/65 opacity-70 transition group-hover:opacity-100" />
              <span aria-hidden="true" className={`mb-2.5 flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-[12px] font-black tracking-tight shadow-sm transition group-hover:scale-105 ${service.iconTone}`}>{service.icon}</span>
              <strong className="text-sm font-extrabold leading-5 text-[#0A2342] transition group-hover:text-[#9B7700]">{service.name}</strong>
              <span className="mt-1 text-[10px] font-medium leading-4 text-[#0A2342]/62">{service.detail}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
