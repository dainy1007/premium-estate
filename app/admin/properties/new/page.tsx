"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const transactionTypes = ["매매", "전세", "월세", "상가", "토지"];

export default function NewPropertyPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "",
    deal_type: "",
    location: "",
    address: "",
    price: "",
    area: "",
    contract_area: "",
    exclusive_area: "",
    rooms: 0,
    bathrooms: 0,
    floor: "",
    description: "",
    image_url: "",
  });

const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];

  if (!file) {
    setPreviewUrl(null);
    setImageFile(null);
    return;
  }

  setImageFile(file);

  const objectUrl = URL.createObjectURL(file);
  setPreviewUrl(objectUrl);
};

  const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();

  let uploadedImageUrl = "";

  // 1. 이미지 업로드
 if (imageFile) {
  const fileName = `${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("property-images")
    .upload(fileName, imageFile);

  if (uploadError) {
    console.error(uploadError);
    alert("이미지 업로드 실패");
    return;
  }

  const { data } = supabase.storage
    .from("property-images")
    .getPublicUrl(fileName);

  uploadedImageUrl = data.publicUrl;
}

  // 2. 매물 데이터 저장
  const { error } = await supabase
    .from("properties")
    .insert([
      {
        title: form.title,
        type: form.type,
        deal_type: form.deal_type,
        location: form.location,
        address: form.address,
        price: form.price,
        area: form.area,
        contract_area: form.contract_area,
        exclusive_area: form.exclusive_area,
        rooms: form.rooms,
        bathrooms: form.bathrooms,
        floor: form.floor,
        description: form.description,
        image_url: uploadedImageUrl,
      },
    ]);

  if (error) {
    console.error("매물 등록 오류:", error);
    alert("매물 등록에 실패했습니다.");
    return;
  }

  alert("매물이 등록되었습니다.");

  window.location.href = "/admin";
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
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 범어동 프리미엄 아파트"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">거래유형</label>
                <select
                  value={form.deal_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deal_type: e.target.value,
                      type: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                >
                  <option value="">거래유형 선택</option>
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
                  value={form.location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 대구 수성구"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">주소</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 범어동 123-4"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">가격</label>
                <input
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 6억 8,000만원"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">면적</label>
                <input
                  value={form.area}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      area: e.target.value,
                    })
                  }
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
                  value={form.rooms}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rooms: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">욕실 개수</label>
                <input
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bathrooms: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">층수</label>
                <input
                  value={form.floor}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      floor: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="예: 7층 중 5층"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">설명</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
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
