export default function Footer() {
  return (
    <footer className="bg-[#0A2342] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              백조현대부동산중개
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/70">
              대표 하순영
              <br />
              대구광역시 달성군 유가읍 테크노공원로69
              파크뷰타워 105호
            </p>

            <a
              href="tel:01077750014"
              className="mt-3 inline-block font-semibold text-[#C9A227]"
            >
              010-7775-0014
            </a>
          </div>

          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} 백조현대부동산중개.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}