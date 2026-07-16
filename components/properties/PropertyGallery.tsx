"use client";

import { useMemo, useState, type TouchEvent } from "react";
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
        <img
          src={activeImage.image_url}
          alt={activeImage.alt_text || title}
          className="h-[420px] w-full select-none object-cover"
          draggable={false}
        />

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
    </div>
  );
}
