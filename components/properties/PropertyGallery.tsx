"use client";

import { useEffect, useMemo, useState, type TouchEvent } from "react";
import type { PropertyImage } from "@/types/property";

type PropertyGalleryProps = {
  title: string;
  fallbackImageUrl?: string | null;
  images?: PropertyImage[];
  altBase?: string;
};

export default function PropertyGallery({ title, fallbackImageUrl, images = [], altBase }: PropertyGalleryProps) {
  const galleryImages = useMemo(() => {
    const unique = images.filter(
      (image, index, all) => image.image_url && all.findIndex((item) => item.image_url === image.image_url) === index
    );
    if (unique.length) return unique;
    if (!fallbackImageUrl) return [];
    return [{ id: 0, property_id: 0, image_url: fallbackImageUrl, storage_path: "", display_order: 0, is_cover: true, alt_text: null }];
  }, [fallbackImageUrl, images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeImage = galleryImages[activeIndex];

  const getAlt = (image: PropertyImage, index: number, suffix = "") =>
    image.alt_text || `${altBase || title} 매물사진 ${index + 1}${suffix}`;

  const goToPrevious = () => setActiveIndex((current) => current === 0 ? galleryImages.length - 1 : current - 1);
  const goToNext = () => setActiveIndex((current) => current === galleryImages.length - 1 ? 0 : current + 1);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
      if (event.key === "ArrowLeft" && galleryImages.length > 1) goToPrevious();
      if (event.key === "ArrowRight" && galleryImages.length > 1) goToNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, galleryImages.length]);

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStart === null || galleryImages.length < 2) return;
    const distance = touchStart - event.changedTouches[0].clientX;
    if (distance > 50) goToNext();
    if (distance < -50) goToPrevious();
    setTouchStart(null);
  };

  if (!activeImage) {
    return <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-[#0A2342]/10 bg-gray-100 text-gray-500 shadow-xl sm:h-[420px] sm:rounded-[32px]">등록된 이미지가 없습니다.</div>;
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="group relative overflow-hidden rounded-[24px] border border-[#0A2342]/10 bg-gray-100 shadow-xl sm:rounded-[32px]" onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={handleTouchEnd}>
        <button type="button" onClick={() => setIsLightboxOpen(true)} className="block w-full cursor-zoom-in" aria-label="이미지 크게 보기">
          <img src={activeImage.image_url} alt={getAlt(activeImage, activeIndex)} className="h-[300px] w-full select-none object-cover sm:h-[420px] lg:h-[520px]" draggable={false} />
        </button>
        {galleryImages.length > 1 && <>
          <button type="button" onClick={goToPrevious} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow-lg sm:left-4" aria-label="이전 이미지">‹</button>
          <button type="button" onClick={goToNext} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow-lg sm:right-4" aria-label="다음 이미지">›</button>
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">{activeIndex + 1} / {galleryImages.length}</div>
        </>}
      </div>

      {galleryImages.length > 1 && <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {galleryImages.map((image, index) => <button key={`${image.id}-${image.image_url}`} type="button" onClick={() => setActiveIndex(index)} className={`w-24 shrink-0 snap-start overflow-hidden rounded-2xl border-2 transition sm:w-28 ${activeIndex === index ? "border-[#C9A227] ring-2 ring-[#C9A227]/20" : "border-transparent opacity-75"}`} aria-label={`${index + 1}번째 이미지 보기`}>
          <img src={image.image_url} alt={getAlt(image, index, " 썸네일")} className="h-20 w-full object-cover" loading="lazy" />
        </button>)}
      </div>}

      {isLightboxOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-2 sm:p-4" role="dialog" aria-modal="true" onClick={() => setIsLightboxOpen(false)} onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={handleTouchEnd}>
        <button type="button" onClick={() => setIsLightboxOpen(false)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white" aria-label="닫기">×</button>
        <img src={activeImage.image_url} alt={getAlt(activeImage, activeIndex)} className="max-h-[90vh] max-w-[96vw] select-none object-contain" draggable={false} onClick={(event) => event.stopPropagation()} />
        {galleryImages.length > 1 && <>
          <button type="button" onClick={(event) => { event.stopPropagation(); goToPrevious(); }} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white sm:left-8" aria-label="이전 이미지">‹</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); goToNext(); }} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white sm:right-8" aria-label="다음 이미지">›</button>
          <div className="absolute bottom-5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">{activeIndex + 1} / {galleryImages.length}</div>
        </>}
      </div>}
    </div>
  );
}
