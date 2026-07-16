"use client";

import { useState } from "react";

type PropertyShareActionsProps = {
  title: string;
};

export default function PropertyShareActions({ title }: PropertyShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href });
      return;
    }

    await copyUrl();
  };

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={share}
        className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
      >
        ↗ 공유하기
      </button>
      <button
        type="button"
        onClick={copyUrl}
        className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
      >
        {copied ? "복사 완료" : "🔗 주소 복사"}
      </button>
    </div>
  );
}
