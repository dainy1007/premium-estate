import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!await isValidAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value))
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: "server_config" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: property, error: readError } = await db.from("properties").select("id,is_hidden,listing_status").eq("id", id).single();
  if (readError || !property) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (property.is_hidden || property.listing_status === "completed" || property.listing_status === "reserved")
    return NextResponse.json({ ok: false, error: "inactive_property" }, { status: 409 });
  const bumped_at = new Date().toISOString();
  const { error } = await db.from("properties").update({ bumped_at }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, bumped_at });
}
