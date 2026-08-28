// Canonical watermark specification for 백조현대부동산.
// IMPORTANT: All homepage/admin property image watermark logic must import from this file.
// Do not duplicate these values in components or upload code.

export const WATERMARK_SPEC_VERSION = "2026-08-28-v1" as const;

export const WATERMARK_CONFIG = Object.freeze({
  center: Object.freeze({
    src: "/watermarks/baekjo-watermark-center.webp",
    widthRatio: 0.52,
    opacity: 0.38,
    centerYRatio: 0.60,
    maxHeightRatio: 0.58,
  }),
  corner: Object.freeze({
    src: "/watermarks/baekjo-watermark-corner.webp",
    widthRatio: 0.27,
    opacity: 1.0,
    rightMarginPx: 30,
    bottomMarginPx: 30,
    maxHeightRatio: 0.34,
    publicRightRatio: 0.03,
    publicBottomRatio: 0.03,
  }),
  output: Object.freeze({
    longEdgePx: 1800,
    jpegQuality: 0.90,
  }),
});
