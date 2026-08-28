// Canonical watermark specification for 백조현대부동산.
// IMPORTANT: All homepage/admin property image watermark logic must import from this file.
// REFERENCE: existing automation pipeline (watermark_images.py -> sync_naver_to_website.py).
// Existing photos are never reprocessed. New/additional/replacement uploads must match this standard.

export const WATERMARK_SPEC_VERSION = "2026-08-28-legacy-website-pipeline-v4" as const;

export const WATERMARK_CONFIG = Object.freeze({
  center: Object.freeze({
    src: "/watermarks/baekjo_center.png",
    widthRatio: 0.52,
    opacity: 0.38,
    centerYRatio: 0.60,
  }),
  corner: Object.freeze({
    src: "/watermarks/baekjo_corner.png",
    widthRatio: 0.27,
    opacity: 1.0,
    rightMarginPx: 30,
    bottomMarginPx: 30,
  }),
  processing: Object.freeze({
    watermarkLongEdgePx: 2400,
  }),
  output: Object.freeze({
    longEdgePx: 1800,
    jpegQuality: 0.84,
  }),
});
