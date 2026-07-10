"use client";

export default function Map() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">

        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.35em] text-[#C9A227]">
            LOCATION
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#0A2342]">
            찾아오시는 길
          </h2>

          <p className="mt-4 text-gray-600">
            백조현대부동산중개
          </p>
        </div>


        <div className="mt-10 overflow-hidden rounded-3xl shadow-lg">
          <iframe
            src="https://map.kakao.com/"
            width="100%"
            height="450"
            style={{ border: 0 }}
            loading="lazy"
          ></iframe>
        </div>


        <div className="mt-8 rounded-2xl bg-[#0A2342] p-6 text-white">
          <h3 className="text-xl font-semibold">
            백조현대부동산중개
          </h3>

          <p className="mt-3 text-white/80">
            대구광역시 달성군 유가읍 테크노공원로69
            <br />
            파크뷰타워 105호
          </p>

          <a
            href="tel:01077750014"
            className="mt-4 inline-block text-[#C9A227]"
          >
            ☎ 010-7775-0014
          </a>
        </div>

      </div>
    </section>
  );
}