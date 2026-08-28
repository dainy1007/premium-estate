import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/watermarks/baekjo_center.png",
          destination: "/watermarks/baekjo-watermark-center.webp",
        },
        {
          source: "/watermarks/baekjo_corner.png",
          destination: "/watermarks/baekjo-watermark-corner.webp",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
