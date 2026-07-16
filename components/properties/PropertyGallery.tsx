"use client";

import { useEffect, useMemo, useState, type TouchEvent } from "react";
import type { PropertyImage } from "@/types/property";

type PropertyGalleryProps = {
  title: string;
  fallbackImageUrl?: string | null;
  images?: PropertyImage[];
};

export default function PropertyGallery({
  title,
  fallbackImageUrl,
  images = [],
}: PropertyGalleryProps) {
  const galleryImages = useMemo(() => {
    if (images.length > 0) {
      return images;
    }

    if (fallbackImageUrl) {
      return [
        {
          id: 0,
          property_id: 0,
          image_url: fallbackImageUrl,
          storage_path: "",
          display_order: 0,
          is_cover: true,
          alt_text: title,
        },
      ];
    }

    return [];
  }, [fallbackImageUrl, images, title]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeImage = galleryImages[activeIndex];

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  };

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

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === null || galleryImages.length < 2) return;

    const swipeDistance = touchStart - event.changedTouches[0].clientX;

    if (swipeDistance > 50) {
      goToNext();
    }

    if (swipeDistance < -50) {
      goToPrevious();
    }

    setTouchStart(null);
  };

  if (!activeImage) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-[32px] border border-[#0A2342]/10 bg-gray-100 text-gray-500 shadow-xl">
        등록된 이미지가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="group relative overflow-hidden rounded-[32px] border border-[#0A2342]/10 shadow-xl"
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="block w-full cursor-zoom-in"
          aria-label="이미지 크게 보기"
        >
          <img
            src={activeImage.image_url}
            alt={activeImage.alt_text || title}
            className="h-[420px] w-full select-none object-cover"
            draggable={false}
          />
        </button>

        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
          클릭해서 크게 보기
        </div>

        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[#0A2342] shadow-lg transition hover:bg-white"
              aria-label="이전 이미지"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[#0A2342] shadow-lg transition hover:bg-white"
              aria-label="다음 이미지"
            >
              ›
            </button>
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
              {activeIndex + 1} / {galleryImages.length}
            </div>
          </>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {galleryImages.map((image, index) => (
            <button
              key={`${image.id}-${image.image_url}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-2xl border-2 transition ${
                activeIndex === index
                  ? "border-[#C9A227] ring-2 ring-[#C9A227]/20"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${title} 썸네일 ${index + 1}`}
                className="h-20 w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 이미지 크게 보기`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25"
            aria-label="크게 보기 닫기"
          >
            ×
          </button>

          <img
            src={activeImage.image_url}
            alt={activeImage.alt_text || title}
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white transition hover:bg-white/25 md:left-8"
                aria-label="이전 이미지"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white transition hover:bg-white/25 md:right-8"
                aria-label="다음 이미지"
              >
                ›
              </button>
              <div className="absolute bottom-5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                {activeIndex + 1} / {galleryImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
