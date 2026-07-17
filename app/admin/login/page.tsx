type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/admin") ? params.next : "/admin";
  const errorMessage =
    params.error === "password"
      ? "비밀번호가 올바르지 않습니다."
      : params.error === "config"
        ? "관리자 비밀번호 환경변수가 설정되지 않았습니다."
        : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold text-[#C9A227]">
          백조현대부동산중개
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0A2342]">
          관리자 로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          관리자 페이지를 이용하려면 비밀번호를 입력해 주세요.
        </p>

        <form action="/api/admin/login" method="post" className="mt-8">
          <input type="hidden" name="next" value={nextPath} />

          <label className="block text-sm font-semibold text-slate-700">
            관리자 비밀번호
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
            />
          </label>

          {errorMessage && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-[#0A2342] px-5 py-3 font-bold text-white transition hover:bg-[#12365f]"
          >
            로그인
          </button>
        </form>

        <a
          href="/"
          className="mt-5 block text-center text-sm font-medium text-slate-500 hover:text-[#0A2342]"
        >
          홈페이지로 돌아가기
        </a>
      </div>
    </main>
  );
}
