"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import {
  MAX_PROPERTY_IMAGES,
  PROPERTY_IMAGES_BUCKET,
  syncCoverImage,
  uploadPropertyImages,
} from "@/lib/property-images";
import { formatKrwAmount, parsePropertyPriceAmount } from "@/lib/property-price";
import type { PropertyImage } from "@/types/property";

type ExistingItem = { key: string; kind: "existing"; image: PropertyImage };
type NewItem = { key: string; kind: "new"; file: File; previewUrl: string };
type ImageItem = ExistingItem | NewItem;

export default function PropertyEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [deletedImages, setDeletedImages] = useState<PropertyImage[]>([]);
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

      const sorted = (data.property_images || []).sort(
        (a: PropertyImage, b: PropertyImage) => a.display_order - b.display_order,
      );
      setImageItems(
        sorted.map((image: PropertyImage) => ({
          key: `existing-${image.id}`,
          kind: "existing" as const,
          image,
        })),
      );
      setLoading(false);
    }

    if (!Number.isNaN(id)) getProperty();
  }, [id]);

  useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [imageItems]);

  const changeSummary = useMemo(() => {
    const newCount = imageItems.filter((item) => item.kind === "new").length;
    return { newCount, deletedCount: deletedImages.length };
  }, [imageItems, deletedImages]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const availableSlots = MAX_PROPERTY_IMAGES - imageItems.length;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      alert(`이미지는 최대 ${MAX_PROPERTY_IMAGES}장까지 등록할 수 있습니다.`);
    }

    setImageItems((current) => [
      ...current,
      ...filesToAdd.map((file) => ({
        key: `new-${crypto.randomUUID()}`,
        kind: "new" as const,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = "";
  };

  const moveItem = (key: string, direction: "up" | "down") => {
    setImageItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const setAsCover = (key: string) => {
    setImageItems((current) => {
      const target = current.find((item) => item.key === key);
      return target ? [target, ...current.filter((item) => item.key !== key)] : current;
    });
  };

  const removeItem = (item: ImageItem) => {
    if (!window.confirm("이 이미지를 목록에서 제거하시겠습니까? 저장하기 전에는 DB에서 삭제되지 않습니다.")) return;
    if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
    if (item.kind === "existing") setDeletedImages((current) => [...current, item.image]);
    setImageItems((current) => current.filter((candidate) => candidate.key !== item.key));
  };

  const restoreLastDeleted = () => {
    setDeletedImages((current) => {
      const target = current.at(-1);
      if (!target) return current;
      setImageItems((items) => [
        ...items,
        { key: `existing-${target.id}`, kind: "existing", image: target },
      ]);
      return current.slice(0, -1);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const priceAmount = parsePropertyPriceAmount(form.price);
      const { error: propertyError } = await supabase
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
      if (propertyError) throw propertyError;

      const newItems = imageItems.filter((item): item is NewItem => item.kind === "new");
      const uploaded = await uploadPropertyImages(
        id,
        newItems.map((item) => item.file),
        imageItems.length + 100,
        form.title,
      );
      const uploadedByKey = new Map(newItems.map((item, index) => [item.key, uploaded[index]]));

      const finalImages = imageItems
        .map((item) => (item.kind === "existing" ? item.image : uploadedByKey.get(item.key)))
        .filter((image): image is PropertyImage => Boolean(image));

      for (const [index, image] of finalImages.entries()) {
        const { error } = await supabase
          .from("property_images")
          .update({ display_order: index, is_cover: index === 0 })
          .eq("id", image.id);
        if (error) throw error;
      }

      if (deletedImages.length > 0) {
        const { error } = await supabase
          .from("property_images")
          .delete()
          .in("id", deletedImages.map((image) => image.id));
        if (error) throw error;

        const storagePaths = deletedImages
          .map((image) => image.storage_path)
          .filter((path): path is string => Boolean(path));
        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from(PROPERTY_IMAGES_BUCKET)
            .remove(storagePaths);
          if (storageError) console.warn("스토리지 이미지 삭제 경고:", storageError);
        }
      }

      await syncCoverImage(id);
      alert("매물이 수정되었습니다.");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("매물 수정 오류:", error);
      alert("매물 수정에 실패했습니다. 변경 내용을 확인한 뒤 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><p>매물 정보를 불러오는 중입니다...</p></main>;
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-3xl font-bold">매물 수정</h1><p className="mt-2 text-sm text-[#0A2342]/60">사진 순서와 대표 이미지는 저장하기를 눌렀을 때 반영됩니다.</p></div>
          <Link href="/admin" className="rounded-full border px-5 py-3">목록으로</Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            {[["title", "매물명"], ["price", "가격"], ["location", "지역"], ["address", "주소"], ["area", "면적"]].map(([name, label]) => (
              <div key={name}>
                <label className="mb-2 block font-semibold">{label}</label>
                <input required={name === "title"} value={form[name as keyof typeof form]} onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))} className="w-full rounded-xl border px-4 py-3" />
                {name === "price" && <p className="mt-2 text-xs text-[#0A2342]/55">검색용 가격: {formatKrwAmount(parsePropertyPriceAmount(form.price))}</p>}
              </div>
            ))}
            <div><label className="mb-2 block font-semibold">설명</label><textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={8} className="w-full rounded-xl border px-4 py-3" /></div>
          </div>

          <div className="space-y-5 rounded-[24px] bg-[#0A2342] p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-semibold">이미지 관리</h2><p className="mt-2 text-sm text-white/70">첫 번째 사진이 대표 이미지입니다. {imageItems.length} / {MAX_PROPERTY_IMAGES}장</p></div>
              {(changeSummary.newCount > 0 || changeSummary.deletedCount > 0) && <div className="rounded-xl bg-white/10 px-3 py-2 text-xs">추가 {changeSummary.newCount}장 · 삭제 예정 {changeSummary.deletedCount}장</div>}
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/10 px-5 py-7 text-center hover:bg-white/15">
              <span className="font-semibold text-[#C9A227]">사진 추가</span><span className="mt-2 text-sm text-white/70">기존 사진과 함께 자유롭게 순서를 변경할 수 있습니다.</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={imageItems.length >= MAX_PROPERTY_IMAGES} />
            </label>

            {deletedImages.length > 0 && <button type="button" onClick={restoreLastDeleted} className="w-full rounded-xl border border-white/20 px-4 py-2 text-sm">마지막 삭제 취소</button>}

            <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
              {imageItems.length === 0 && <div className="rounded-2xl bg-white/10 p-8 text-center text-sm text-white/70">등록된 이미지가 없습니다.</div>}
              {imageItems.map((item, index) => {
                const src = item.kind === "existing" ? item.image.image_url : item.previewUrl;
                return (
                  <div key={item.key} className={`flex gap-3 rounded-2xl p-3 ${index === 0 ? "bg-[#C9A227]/25 ring-1 ring-[#C9A227]" : "bg-white/10"}`}>
                    <img src={src} alt={`${form.title || "매물"} 이미지 ${index + 1}`} className="h-24 w-28 rounded-xl object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div><p className="font-semibold">{index === 0 ? "대표 이미지" : `이미지 ${index + 1}`}</p><p className="mt-1 truncate text-xs text-white/55">{item.kind === "new" ? `새 사진 · ${item.file.name}` : "기존 사진"}</p></div>
                      <div className="flex flex-wrap gap-2">
                        {index !== 0 && <button type="button" onClick={() => setAsCover(item.key)} className="rounded-full bg-[#C9A227] px-3 py-1 text-xs font-semibold text-[#0A2342]">대표 지정</button>}
                        <button type="button" disabled={index === 0} onClick={() => moveItem(item.key, "up")} className="rounded-full border border-white/20 px-3 py-1 text-xs disabled:opacity-30">위로</button>
                        <button type="button" disabled={index === imageItems.length - 1} onClick={() => moveItem(item.key, "down")} className="rounded-full border border-white/20 px-3 py-1 text-xs disabled:opacity-30">아래로</button>
                        <button type="button" onClick={() => removeItem(item)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-200">삭제</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#C9A227] px-8 py-3 font-semibold text-[#0A2342] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "변경사항 저장 중..." : "변경사항 저장"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
