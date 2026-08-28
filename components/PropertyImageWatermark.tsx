"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { WATERMARK_CONFIG } from "@/lib/watermark-config";

function isPropertyPhoto(img: HTMLImageElement) {
  const src = img.currentSrc || img.src || "";
  return src.includes("property-images") && !src.includes("/watermarks/");
}

function applyWatermark(img: HTMLImageElement) {
  if (!isPropertyPhoto(img) || img.dataset.baekjoWatermarked === "1") return;
  const parent = img.parentElement;
  if (!parent) return;

  img.dataset.baekjoWatermarked = "1";

  const style = window.getComputedStyle(parent);
  if (style.position === "static") parent.style.position = "relative";
  if (style.overflow === "visible") parent.style.overflow = "hidden";

  const center = document.createElement("img");
  center.src = WATERMARK_CONFIG.center.src;
  center.alt = "";
  center.setAttribute("aria-hidden", "true");
  center.dataset.baekjoWatermarkLayer = "center";
  Object.assign(center.style, {
    position: "absolute",
    left: "50%",
    top: `${WATERMARK_CONFIG.center.centerYRatio * 100}%`,
    transform: "translate(-50%, -50%)",
    width: `${WATERMARK_CONFIG.center.widthRatio * 100}%`,
    height: "auto",
    maxHeight: `${WATERMARK_CONFIG.center.maxHeightRatio * 100}%`,
    objectFit: "contain",
    opacity: String(WATERMARK_CONFIG.center.opacity),
    pointerEvents: "none",
    zIndex: "2",
  });

  const corner = document.createElement("img");
  corner.src = WATERMARK_CONFIG.corner.src;
  corner.alt = "";
  corner.setAttribute("aria-hidden", "true");
  corner.dataset.baekjoWatermarkLayer = "corner";
  Object.assign(corner.style, {
    position: "absolute",
    right: `${WATERMARK_CONFIG.corner.publicRightRatio * 100}%`,
    bottom: `${WATERMARK_CONFIG.corner.publicBottomRatio * 100}%`,
    width: `${WATERMARK_CONFIG.corner.widthRatio * 100}%`,
    height: "auto",
    maxHeight: `${WATERMARK_CONFIG.corner.maxHeightRatio * 100}%`,
    objectFit: "contain",
    opacity: String(WATERMARK_CONFIG.corner.opacity),
    pointerEvents: "none",
    zIndex: "2",
  });

  parent.append(center, corner);
}

function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>("img").forEach(applyWatermark);
}

export default function PropertyImageWatermark() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    scan();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node instanceof HTMLImageElement) applyWatermark(node);
          scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
