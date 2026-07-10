"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { properties } from "../../../../../data/properties";

export default function PropertyEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const property = properties.find((item) => item.id === Number(id));

  const [form, setForm] = useState({
    title: "",
    price: "",
    address: "",
    area: "",
    description: "",
  });

  useEffect(() => {
    if (!property) {
      return;
    }

    setForm({
      title: property.title,
      price: property.price,
      address: property.location,
      area: property.area,
      description: "",
    });
  }, [property]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("수정 데이터:", {
      id,
      ...form,
    });

    alert("매물 수정 완료");

    router.push(`/admin/properties/${id}`);
  };

  if (!property) {
    return (
      <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">매물을 찾을 수 없습니다.</h1>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            관리자 목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#0A2342]/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl font-bold">매물 수정</h1>
          </div>
          <Link
            href={`/admin/properties/${id}`}
            className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            상세보기
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block font-semibold">매물 제목</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 outline-none focus:border-[#C9A227]"
              placeholder="예) 대구 달성군 신축 아파트"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-semibold">가격</label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 outline-none focus:border-[#C9A227]"
                placeholder="예) 매매 5억"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">주소</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 outline-none focus:border-[#C9A227]"
                placeholder="주소 입력"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-semibold">면적</label>
            <input
              name="area"
              value={form.area}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 outline-none focus:border-[#C9A227]"
              placeholder="예) 84㎡"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">설명</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="h-32 w-full rounded-2xl border border-[#0A2342]/10 bg-[#F8F9FB] px-4 py-3 outline-none focus:border-[#C9A227]"
              placeholder="매물 설명"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-6 py-3 text-sm font-semibold text-[#0A2342] transition hover:-translate-y-1 hover:bg-[#d8b53b]"
            >
              저장
            </button>
            <Link
              href={`/admin/properties/${id}`}
              className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-6 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}