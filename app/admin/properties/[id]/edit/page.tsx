"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import {
  MAX_PROPERTY_IMAGES,
  PROPERTY_IMAGES_BUCKET,
  syncCoverImage,
  uploadPropertyImages,
} from "@/lib/property-images";
import { formatKrwAmount, parsePropertyPriceAmount } from "@/lib/property-price";
import type { PropertyImage } from "@/types/property";

type NewImage = { id: string; file: File; previewUrl: string };

export default function PropertyEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    address: "",
    location: "",
    area: "",
    description: "",
  });

  useEffect(() => {
    async function getProperty() {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("매물 불러오기 오류:", error);
        setLoading(false);
        return;
      }

      setForm({
        title: data.title || "",
        price: data.price || "",
        address: data.address || "",
        location: data.location || data.address || "",
        area: data.area || "",
        description: data.description || "",
      });

      setImages(
        (data.property_images || []).sort(
          (a: PropertyImage, b: PropertyImage) => a.display_order - b.display_order
        )
      );
      setLoading(false);
    }

    if (!Number.isNaN(id)) {
      getProperty();
    }
  }, [id]);

  const totalImageCount = images.length + newImages.length;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    setNewImages((current) => {
      const availableSlots = MAX_PROPERTY_IMAGES - images.length - current.length;
      const filesToAdd = selectedFiles.slice(0, availableSlots);

      if (selectedFiles.length > availableSlots) {
        alert(`이미지는 최대 ${MAX_PROPERTY_IMAGES}장까지 등록할 수 있습니다.`);
      }

      return [
        ...current,
        ...filesToAdd.map((file) => ({
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
    });

    event.target.value = "";
  };

  const moveImage = (imageId: number, direction: "up" | "down") => {
    setImages((current) => {
      const index = current.findIndex((image) => image.id === imageId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || swapIndex < 0 || swapIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const deleteExistingImage = async (image: PropertyImage) => {
    const ok = window.confirm("이미지를 삭제하시겠습니까?");

    if (!ok) return;

    const { error } = await supabase.from("property_images").delete().eq("id", image.id);

    if (error) {
      console.error("이미지 삭제 오류:", error);
      alert("이미지 삭제에 실패했습니다.");
      return;
    }

    if (image.storage_path) {
      await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([image.storage_path]);
    }

    setImages((current) => current.filter((item) => item.id !== image.id));
    await syncCoverImage(id);
  };

  const removeNewImage = (imageId: string) => {
    setNewImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const priceAmount = parsePropertyPriceAmount(form.price);

    const { error } = await supabase
      .from("properties")
      .update({
        title: form.title,
        price: form.price,
        price_amount: priceAmount,
        address: form.address,
        area: form.area,
        description: form.description,
        location: form.location || form.address,
      })
      .eq("id", id);

    if (error) {
      console.error("수정 오류:", error);
      alert("매물 수정에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    try {
      await Promise.all(
        images.map((image, index) =>
          supabase
            .from("property_images")
            .update({ display_order: index, is_cover: index === 0 })
            .eq("id", image.id)
        )
      );

      await uploadPropertyImages(
        id,
        newImages.map((image) => image.file),
        images.length,
        form.title
      );
      await syncCoverImage(id);
    } catch (imageError) {
      console.error("이미지 저장 오류:", imageError);
      alert("매물 정보는 저장되었지만 이미지 저장에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    alert("매물이 수정되었습니다.");
    router.push("/admin");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>매물 정보를 불러오는 중입니다...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">매물 수정</h1>
          <Link href="/admin" className="rounded-full border px-5 py-3">목록으로</Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            {[
              ["title", "매물명"],
              ["price", "가격"],
              ["location", "지역"],
              ["address", "주소"],
              ["area", "면적"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="mb-2 block font-semibold">{label}</label>
                <input
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))}
                  className="w-full rounded-xl border px-4 py-3"
                />
                {name === "price" && (
                  <p className="mt-2 text-xs text-[#0A2342]/55">
                    검색용 가격: {formatKrwAmount(parsePropertyPriceAmount(form.price))}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="mb-2 block font-semibold">설명</label>
              <textarea
                name="description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={6}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="space-y-5 rounded-[24px] bg-[#0A2342] p-5 text-white">
            <div>
              <h2 className="text-xl font-semibold">이미지 관리</h2>
              <p className="mt-2 text-sm text-white/70">대표 이미지는 목록의 첫 번째 이미지입니다. 총 {totalImageCount} / {MAX_PROPERTY_IMAGES}장</p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/10 px-5 py-8 text-center hover:bg-white/15">
              <span className="font-semibold text-[#C9A227]">사진 추가</span>
              <span className="mt-2 text-sm text-white/70">여러 이미지를 한 번에 선택할 수 있습니다.</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>

            <div className="space-y-3">
              {images.map((image, index) => (
                <div key={image.id} className="flex gap-3 rounded-2xl bg-white/10 p-3">
                  <img src={image.image_url} alt={image.alt_text || `이미지 ${index + 1}`} className="h-24 w-28 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col justify-between">
                    <p className="text-sm font-semibold">{index === 0 ? "대표 이미지" : `이미지 ${index + 1}`}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => moveImage(image.id, "up")} className="rounded-full border border-white/20 px-3 py-1 text-xs">위로</button>
                      <button type="button" onClick={() => moveImage(image.id, "down")} className="rounded-full border border-white/20 px-3 py-1 text-xs">아래로</button>
                      <button type="button" onClick={() => deleteExistingImage(image)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-200">삭제</button>
                    </div>
                  </div>
                </div>
              ))}

              {newImages.map((image, index) => (
                <div key={image.id} className="relative overflow-hidden rounded-2xl bg-white/10 p-3">
                  <img src={image.previewUrl} alt={`새 이미지 ${index + 1}`} className="h-32 w-full rounded-xl object-cover" />
                  <span className="absolute left-5 top-5 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-[#0A2342]">업로드 예정</span>
                  <button type="button" onClick={() => removeNewImage(image.id)} className="absolute right-5 top-5 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">삭제</button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[#C9A227] px-8 py-3 font-semibold text-[#0A2342] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
