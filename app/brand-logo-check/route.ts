import { createHash } from "crypto";
import c0 from "../../lib/brand-logo/chunk0";
import c1 from "../../lib/brand-logo/chunk1";
import c2 from "../../lib/brand-logo/chunk2";
import c3 from "../../lib/brand-logo/chunk3";
import c4 from "../../lib/brand-logo/chunk4";
import c5 from "../../lib/brand-logo/chunk5";
import c6 from "../../lib/brand-logo/chunk6";
import c7 from "../../lib/brand-logo/chunk7";
import c8 from "../../lib/brand-logo/chunk8";

export const runtime = "nodejs";

const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

export async function GET() {
  const chunks = [c0,c1,c2,c3,c4,c5,c6,c7,c8];
  const base64 = chunks.join("");
  const bytes = Buffer.from(base64, "base64");
  return Response.json({
    chunks: chunks.map((value) => ({ length: value.length, sha256: sha(value) })),
    base64Length: base64.length,
    base64Sha256: sha(base64),
    bytesLength: bytes.length,
    bytesSha256: sha(bytes),
  });
}
