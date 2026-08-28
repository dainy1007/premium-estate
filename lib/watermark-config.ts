// Canonical watermark specification for 백조현대부동산.
// IMPORTANT: All homepage/admin property image watermark logic must import from this file.
// Do not duplicate or alter these values unless the owner explicitly changes the watermark standard.
// REFERENCE: existing registered property photos shown on 2026-08-28 are the visual source of truth.
// Existing photos are never reprocessed. New/additional/replacement uploads must match this standard.
// Legacy geometry is intentional: scale is based on source photo width before final resize.

export const WATERMARK_SPEC_VERSION = "2026-08-28-existing-photo-standard-v3" as const;

export const WATERMARK_CONFIG = Object.freeze({
  center: Object.freeze({
    src: "/watermarks/baekjo_center.png",
    widthRatio: 0.52,
    opacity: 0.38,
    centerYRatio: 0.60,
    maxHeightRatio: 1.0,
  }),
  corner: Object.freeze({
    src: "/watermarks/baekjo_corner.png",
    widthRatio: 0.27,
    opacity: 1.0,
    rightMarginPx: 30,
    bottomMarginPx: 30,
    maxHeightRatio: 1.0,
    publicRightRatio: 0.03,
    publicBottomRatio: 0.03,
  }),
  output: Object.freeze({
    longEdgePx: 1800,
    jpegQuality: 0.90,
  }),
});
