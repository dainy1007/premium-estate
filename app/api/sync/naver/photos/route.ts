import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.NAVER_SYNC_SECRET;
const BUCKET = "property-images";
const MAX_PROPERTY_IMAGES = 20;

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "photo.jpg";
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError("Supabase server configuration is missing.", 500);
  }
  if (!syncSecret) return jsonError("NAVER_SYNC_SECRET is not configured.", 503);

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${syncSecret}`) return jsonError("Unauthorized", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Invalid multipart form data.");
  }

  const propertyId = Number(form.get("property_id"));
  const articleNo = String(form.get("article_no") ?? "").trim();
  const displayOrder = Number(form.get("display_order") ?? 1);
  const reset = String(form.get("reset") ?? "") === "1";
  const file = form.get("file");

  if (!Number.isInteger(propertyId) || propertyId <= 0) return jsonError("Invalid property_id.");
  if (!/^\d{9,12}$/.test(articleNo)) return jsonError("Invalid article_no.");
  if (!Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > MAX_PROPERTY_IMAGES) {
    return jsonError(`display_order must be between 1 and ${MAX_PROPERTY_IMAGES}.`);
  }
  if (!(file instanceof File) || file.size === 0) return jsonError("Photo file is required.");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, admin_memo")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) return jsonError(propertyError.message, 500);
  if (!property) return jsonError("Property not found.", 404);
  if (property.admin_memo && property.admin_memo !== `naver:${articleNo}`) {
    return jsonError("article_no does not match property.", 409);
  }

  if (reset) {
    const { data: existing, error: existingError } = await supabase
      .from("property_images")
      .select("storage_path")
      .eq("property_id", propertyId);

    if (existingError) return jsonError(existingError.message, 500);

    const oldPaths = (existing ?? [])
      .map((row) => row.storage_path)
      .filter((value): value is string => Boolean(value));

    const { error: deleteRowsError } = await supabase
      .from("property_images")
      .delete()
      .eq("property_id", propertyId);
    if (deleteRowsError) return jsonError(deleteRowsError.message, 500);

    if (oldPaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(oldPaths);
    }
  }

  const extFromType = file.type === "image/webp" ? ".webp" : file.type === "image/png" ? ".png" : ".jpg";
  const originalName = safeName(file.name || `photo${extFromType}`);
  const filename = `${articleNo}-${Date.now()}-${crypto.randomUUID()}-${originalName}`;
  const storagePath = `${propertyId}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) return jsonError(uploadError.message, 500);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const imageUrl = publicData.publicUrl;

  const { error: insertError } = await supabase.from("property_images").insert({
    property_id: propertyId,
    image_url: imageUrl,
    storage_path: storagePath,
    display_order: displayOrder,
    is_cover: displayOrder === 1,
    alt_text: `매물 ${articleNo} 사진 ${displayOrder}`,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return jsonError(insertError.message, 500);
  }

  if (displayOrder === 1) {
    const { error: coverError } = await supabase
      .from("properties")
      .update({ image_url: imageUrl })
      .eq("id", propertyId);
    if (coverError) return jsonError(coverError.message, 500);
  }

  return NextResponse.json({
    ok: true,
    property_id: propertyId,
    article_no: articleNo,
    display_order: displayOrder,
    image_url: imageUrl,
    storage_path: storagePath,
  });
}
