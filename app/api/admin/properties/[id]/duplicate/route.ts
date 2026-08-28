import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const isAdmin = await isValidAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: "server_config" }, { status: 503 });
  }

  const { id } = await context.params;
  const sourceId = Number(id);
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: source, error: sourceError } = await db
    .from("properties")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json(
      { ok: false, error: sourceError?.message ?? "property_not_found" },
      { status: 404 },
    );
  }

  const {
    id: _sourceId,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...sourceFields
  } = source as Record<string, unknown>;

  const duplicatePayload: Record<string, unknown> = {
    ...sourceFields,
    title: `${String(source.title ?? "매물").trim()} (복사본)`,
    admin_memo: null,
    is_hidden: true,
    is_featured: false,
    listing_status: "active",
  };

  const { data: duplicated, error: duplicateError } = await db
    .from("properties")
    .insert(duplicatePayload)
    .select("id")
    .single();

  if (duplicateError || !duplicated) {
    return NextResponse.json(
      { ok: false, error: duplicateError?.message ?? "duplicate_failed" },
      { status: 500 },
    );
  }

  const newId = Number(duplicated.id);

  const { data: sourceImages, error: imageReadError } = await db
    .from("property_images")
    .select("image_url,storage_path,display_order,is_cover,alt_text")
    .eq("property_id", sourceId)
    .order("display_order", { ascending: true });

  if (imageReadError) {
    await db.from("properties").delete().eq("id", newId);
    return NextResponse.json({ ok: false, error: imageReadError.message }, { status: 500 });
  }

  if (sourceImages?.length) {
    const copiedImages = sourceImages.map((image) => ({
      property_id: newId,
      image_url: image.image_url,
      storage_path: image.storage_path,
      display_order: image.display_order,
      is_cover: image.is_cover,
      alt_text: image.alt_text,
    }));

    const { error: imageInsertError } = await db.from("property_images").insert(copiedImages);
    if (imageInsertError) {
      await db.from("properties").delete().eq("id", newId);
      return NextResponse.json({ ok: false, error: imageInsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    source_id: sourceId,
    property_id: newId,
    copied_images: sourceImages?.length ?? 0,
  });
}
