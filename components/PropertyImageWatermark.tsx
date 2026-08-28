"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CENTER_SRC = "/watermarks/baekjo-watermark-center.webp";
const CORNER_SRC = "/watermarks/baekjo-watermark-corner.webp";

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
  center.src = CENTER_SRC;
  center.alt = "";
  center.setAttribute("aria-hidden", "true");
  center.dataset.baekjoWatermarkLayer = "center";
  Object.assign(center.style, {
    position: "absolute",
    left: "50%",
    top: "60%",
    transform: "translate(-50%, -50%)",
    width: "52%",
    height: "auto",
    maxHeight: "70%",
    objectFit: "contain",
    opacity: "0.38",
    pointerEvents: "none",
    zIndex: "2",
  });

  const corner = document.createElement("img");
  corner.src = CORNER_SRC;
  corner.alt = "";
  corner.setAttribute("aria-hidden", "true");
  corner.dataset.baekjoWatermarkLayer = "corner";
  Object.assign(corner.style, {
    position: "absolute",
    right: "3%",
    bottom: "3%",
    width: "27%",
    height: "auto",
    maxHeight: "35%",
    objectFit: "contain",
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
