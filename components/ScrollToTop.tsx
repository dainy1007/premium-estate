"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 280);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="페이지 상단으로 이동"
      title="맨 위로"
      className="fixed bottom-6 right-6 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-[#0A2342] text-xl font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#C9A227] hover:text-[#0A2342]"
    >
      ↑
    </button>
  );
}
