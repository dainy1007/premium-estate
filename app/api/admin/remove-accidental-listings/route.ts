import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.NAVER_SYNC_SECRET;

const TARGETS = [
  { id: 80, marker: "naver:2645825103" },
  { id: 81, marker: "naver:2645305331" },
];

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey || !syncSecret) {
    return NextResponse.json({ ok: false, error: "server_config" }, { status: 503 });
  }
  if ((req.headers.get("authorization") ?? "") !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const results: Array<Record<string, unknown>> = [];

  for (const target of TARGETS) {
    const { data, error: findError } = await db
      .from("properties")
      .select("id,admin_memo,title")
      .eq("id", target.id)
      .maybeSingle();

    if (findError) {
      results.push({ id: target.id, status: "error", error: findError.message });
      continue;
    }
    if (!data) {
      results.push({ id: target.id, status: "missing" });
      continue;
    }
    if ((data.admin_memo ?? "") !== target.marker) {
      results.push({ id: target.id, status: "skipped_marker_mismatch", admin_memo: data.admin_memo, title: data.title });
      continue;
    }

    const { error: imageError } = await db.from("property_images").delete().eq("property_id", target.id);
    if (imageError) {
      results.push({ id: target.id, status: "error", error: `property_images: ${imageError.message}` });
      continue;
    }
    const { error: deleteError } = await db.from("properties").delete().eq("id", target.id).eq("admin_memo", target.marker);
    if (deleteError) {
      results.push({ id: target.id, status: "error", error: deleteError.message });
      continue;
    }
    results.push({ id: target.id, status: "deleted" });
  }

  return NextResponse.json({ ok: true, results });
}
