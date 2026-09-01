import c0a from "../../lib/brand-logo/chunk0a";
import c0b from "../../lib/brand-logo/chunk0b";
import c1 from "../../lib/brand-logo/chunk1";
import c2 from "../../lib/brand-logo/chunk2";
import c3 from "../../lib/brand-logo/chunk3";
import c4 from "../../lib/brand-logo/chunk4";
import c5 from "../../lib/brand-logo/chunk5";
import c6 from "../../lib/brand-logo/chunk6";
import c7 from "../../lib/brand-logo/chunk7";
import c8 from "../../lib/brand-logo/chunk8";

export const runtime = "nodejs";

export async function GET() {
  const base64 = [c0a, c0b, c1, c2, c3, c4, c5, c6, c7, c8].join("");
  const bytes = Buffer.from(base64, "base64");

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
