"use client";

import { useEffect, useState } from "react";

type PropertyShareActionsProps = { title: string };

const iconPaths: Array<[RegExp, string]> = [
  [/에어컨/, '<rect x="7" y="10" width="34" height="17" rx="3"/><path d="M11 22h26M15 31c0 3-2 4-2 7M24 31c0 3-2 4-2 7M33 31c0 3-2 4-2 7"/>'],
  [/세탁기/, '<rect x="10" y="5" width="28" height="38" rx="3"/><path d="M10 13h28"/><circle cx="24" cy="28" r="9"/><circle cx="24" cy="28" r="6"/>'],
  [/^TV$|티비|텔레비전/i, '<rect x="7" y="10" width="34" height="25" rx="2"/><path d="M18 40h12M24 35v5M19 6l5 4 5-4"/>'],
  [/신발장/, '<rect x="10" y="6" width="28" height="36" rx="2"/><path d="M24 6v36M14 25c4 0 6-5 10-3M14 25c1 4 7 5 10 3"/>'],
  [/냉장고/, '<rect x="12" y="4" width="24" height="40" rx="3"/><path d="M12 20h24M17 10v6M17 25v9"/>'],
  [/가스레인지|인덕션/, '<rect x="8" y="7" width="32" height="34" rx="2"/><circle cx="17" cy="17" r="5"/><circle cx="31" cy="17" r="5"/><circle cx="17" cy="29" r="5"/><circle cx="31" cy="29" r="5"/>'],
  [/싱크대/, '<path d="M7 24h34v18H7zM24 24v18M13 24v-5c0-7 10-7 10 0v2M23 21h5"/>'],
  [/CCTV/i, '<path d="M8 16l25-7 5 17-25 7zM33 28l5 8M38 36h5"/><circle cx="16" cy="24" r="3"/>'],
  [/도어락|현관보안/, '<rect x="13" y="5" width="22" height="38" rx="3"/><path d="M18 11h12M19 18h2m6 0h2m-10 6h2m6 0h2m-10 6h2m6 0h2M19 37h10"/>'],
  [/인터폰/, '<rect x="8" y="7" width="32" height="34" rx="3"/><rect x="22" y="12" width="12" height="9" rx="1"/><path d="M14 13v20M27 27h7M27 32h7"/>'],
  [/옷장|붙박이장|장롱|수납장/, '<rect x="8" y="5" width="32" height="38" rx="2"/><path d="M24 5v38M20 24h1M27 24h1M12 9h24"/>'],
  [/인터넷|와이파이/, '<path d="M8 19c9-8 23-8 32 0M13 25c6-6 16-6 22 0M19 31c3-3 7-3 10 0"/><circle cx="24" cy="37" r="2"/>'],
  [/건조대/, '<path d="M9 39L18 9m21 30L30 9M14 24h20M16 18h16M12 30h24"/>'],
];

function iconSvg(name: string) {
  const match = iconPaths.find(([pattern]) => pattern.test(name));
  const paths = match?.[1] ?? '<circle cx="24" cy="24" r="17"/><path d="M16 24l5 5 11-12"/>';
  return `<svg viewBox="0 0 48 48" aria-hidden="true" style="width:42px;height:42px;fill:none;stroke:#0A2342;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">${paths}</svg>`;
}

function cleanOptionName(value: string) {
  return value.replace(/^•\s*/, "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

export default function PropertyShareActions({ title }: PropertyShareActionsProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const target = paragraphs.find((p) => (p.textContent || "").includes("옵션\n"));
    if (!target || target.dataset.optionIconsApplied === "1") return;
    const original = target.textContent || "";
    const optionStart = original.indexOf("옵션\n");
    const featureStart = original.indexOf("\n\n매물 특징", optionStart);
    if (optionStart < 0 || featureStart < 0) return;

    const before = original.slice(0, optionStart).trimEnd();
    const optionText = original.slice(optionStart + 3, featureStart).trim();
    const after = original.slice(featureStart + 2).trimStart();
    const options = optionText.split(/\n|\s{2,}/).map(cleanOptionName).filter(Boolean);
    if (!options.length) return;

    const wrapper = document.createElement("div");
    wrapper.className = "mt-3 break-keep text-[15px] leading-7 text-[#0A2342]/90 sm:text-base";

    const beforeText = document.createElement("p");
    beforeText.className = "whitespace-pre-line";
    beforeText.textContent = before;
    wrapper.appendChild(beforeText);

    const heading = document.createElement("p");
    heading.className = "mt-6 font-semibold text-[#0A2342]";
    heading.textContent = "옵션";
    wrapper.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4";
    for (const option of options) {
      const card = document.createElement("div");
      card.className = "flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-[#0A2342]/10 bg-white px-2 py-3 text-center shadow-sm";
      card.innerHTML = `${iconSvg(option)}<span style="margin-top:6px;font-size:12px;font-weight:600;line-height:1.25;color:#0A2342">${option.replace(/[<>&]/g, "")}</span>`;
      grid.appendChild(card);
    }
    wrapper.appendChild(grid);

    const afterText = document.createElement("p");
    afterText.className = "mt-6 whitespace-pre-line";
    afterText.textContent = after;
    wrapper.appendChild(afterText);

    target.dataset.optionIconsApplied = "1";
    target.replaceWith(wrapper);
  }, []);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) { await navigator.share({ title, url: window.location.href }); return; }
    await copyUrl();
  };

  const inquire = () => {
    const propertyId = window.location.pathname.match(/\/properties\/(\d+)/)?.[1] ?? "";
    const params = new URLSearchParams({ property: title });
    if (propertyId) params.set("id", propertyId);
    window.location.href = `/contact?${params.toString()}#contact`;
  };

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button type="button" onClick={inquire} className="rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-bold text-[#0A2342] shadow-sm transition hover:brightness-95">💬 이 매물 문의하기</button>
      <button type="button" onClick={share} className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">↗ 공유하기</button>
      <button type="button" onClick={copyUrl} className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">{copied ? "복사 완료" : "🔗 주소 복사"}</button>
    </div>
  );
}
