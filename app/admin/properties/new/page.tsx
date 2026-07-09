"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";

const transactionTypes = ["매매", "전세", "월세", "상가", "토지"];

export default function NewPropertyPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    console.log("매물 등록 요청");
  };

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-[#0A2342]/10 bg-white p-6 shadow-sm sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl font-bold">매물 등록</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            취소
          </Link>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-6 rounded-[24px] border border-[#0A2342]/10 bg-[#F8F9FB] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">매물명</label>
                <input
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 범어동 프리미엄 아파트"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">거래유형</label>
                <select className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]">
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">지역</label>
                <input
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 대구 수성구"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">주소</label>
                <input
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 범어동 123-4"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">가격</label>
                <input
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 6억 8,000만원"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">면적</label>
                <input
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 84㎡"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">방 개수</label>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">욕실 개수</label>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">층수</label>
                <input
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="12"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">설명</label>
              <textarea
                rows={5}
                className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                placeholder="매물에 대한 상세 설명을 입력해주세요."
              />
            </div>
          </div>

          <div className="space-y-6 rounded-[24px] border border-[#0A2342]/10 bg-[#0A2342] p-6 text-white">
            <div>
              <h2 className="text-xl font-semibold">이미지 업로드</h2>
              <p className="mt-2 text-sm leading-7 text-white/80">
                매물 이미지를 업로드하면 미리보기를 확인할 수 있습니다.
              </p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/25 bg-white/10 px-6 py-10 text-center transition hover:bg-white/15">
              <span className="text-sm font-semibold text-[#C9A227]">사진 선택</span>
              <span className="mt-2 text-sm text-white/70">JPEG, PNG 파일을 업로드할 수 있습니다.</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/10 p-3">
              {previewUrl ? (
                <img src={previewUrl} alt="미리보기" className="h-56 w-full rounded-[18px] object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-[18px] border border-dashed border-white/20 text-sm text-white/60">
                  이미지 미리보기 영역
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                취소
              </Link>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:-translate-y-1 hover:bg-[#d8b53b]"
              >
                등록하기
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </main>
  );
}
