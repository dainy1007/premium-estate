"use client";

export default function AdminLoginError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-red-700">로그인 화면 오류가 발생했습니다.</p>
        <a href="/admin/login" className="mt-4 inline-block text-sm font-semibold text-[#0A2342]">
          다시 시도하기
        </a>
      </div>
    </main>
  );
}
