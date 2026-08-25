import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.NAVER_SYNC_SECRET;
const BUCKET = "property-images";
const MAX_PROPERTY_IMAGES = 20;

function jsonError(error: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(details ? { details } : {}) }, { status });
}

function firstFormValue(form: FormData, names: string[]) {
  for (const name of names) {
    const value = form.get(name);
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return null;
}

function safeName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "photo.jpg";
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey) return jsonError("Supabase server configuration is missing.", 500);
  if (!syncSecret) return jsonError("NAVER_SYNC_SECRET is not configured.", 503);
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${syncSecret}`) return jsonError("Unauthorized", 401);

  let form: FormData;
  try { form = await request.formData(); } catch { return jsonError("Invalid multipart form data."); }

  const propertyIdRaw = firstFormValue(form, ["property_id", "propertyId", "id"]);
  const articleNoRaw = firstFormValue(form, ["article_no", "articleNo", "article_no_str", "naver_article_no"]);
  const displayOrderRaw = firstFormValue(form, ["display_order", "displayOrder", "order", "index"]);
  const resetRaw = firstFormValue(form, ["reset", "is_reset", "clear_existing"]);
  const file = firstFormValue(form, ["file", "photo", "image", "image_file"]);

  const propertyId = Number(propertyIdRaw);
  const articleNo = String(articleNoRaw ?? "").trim();
  const rawOrder = Number(displayOrderRaw ?? 0);
  // PC 동기화 스크립트는 0부터 시작(0..19)한다. DB/화면에서는 1부터 시작(1..20)하도록 변환한다.
  const displayOrder = rawOrder + 1;
  const resetText = String(resetRaw ?? "").trim().toLowerCase();
  const reset = ["1", "true", "yes", "y"].includes(resetText);
  const receivedKeys = Array.from(new Set(Array.from(form.keys())));

  if (!Number.isInteger(propertyId) || propertyId <= 0) return jsonError("Invalid property_id.", 400, { receivedKeys, propertyIdRaw: String(propertyIdRaw ?? "") });
  if (!/^\d{9,12}$/.test(articleNo)) return jsonError("Invalid article_no.", 400, { receivedKeys, articleNo });
  if (!Number.isInteger(rawOrder) || rawOrder < 0 || rawOrder >= MAX_PROPERTY_IMAGES) return jsonError(`display_order must be between 0 and ${MAX_PROPERTY_IMAGES - 1}.`, 400, { receivedKeys, displayOrderRaw: String(displayOrderRaw ?? "") });
  if (!(file instanceof File) || file.size === 0) return jsonError("Photo file is required.", 400, { receivedKeys, fileType: typeof file });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: property, error: propertyError } = await supabase.from("properties").select("id, admin_memo").eq("id", propertyId).maybeSingle();
  if (propertyError) return jsonError(propertyError.message, 500);
  if (!property) return jsonError("Property not found.", 404);
  if (property.admin_memo && property.admin_memo !== `naver:${articleNo}`) return jsonError("article_no does not match property.", 409, { propertyId, expected: property.admin_memo, received: `naver:${articleNo}` });

  if (reset) {
    const { data: existing, error: existingError } = await supabase.from("property_images").select("storage_path").eq("property_id", propertyId);
    if (existingError) return jsonError(existingError.message, 500);
    const oldPaths = (existing ?? []).map((row) => row.storage_path).filter((value): value is string => Boolean(value));
    const { error: deleteRowsError } = await supabase.from("property_images").delete().eq("property_id", propertyId);
    if (deleteRowsError) return jsonError(deleteRowsError.message, 500);
    if (oldPaths.length > 0) await supabase.storage.from(BUCKET).remove(oldPaths);
  }

  const extFromType = file.type === "image/webp" ? ".webp" : file.type === "image/png" ? ".png" : ".jpg";
  const originalName = safeName(file.name || `photo${extFromType}`);
  const filename = `${articleNo}-${Date.now()}-${crypto.randomUUID()}-${originalName}`;
  const storagePath = `${propertyId}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, { contentType: file.type || "image/jpeg", cacheControl: "31536000", upsert: false });
  if (uploadError) return jsonError(uploadError.message, 500);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const imageUrl = publicData.publicUrl;
  const { error: insertError } = await supabase.from("property_images").insert({ property_id: propertyId, image_url: imageUrl, storage_path: storagePath, display_order: displayOrder, is_cover: displayOrder === 1, alt_text: `매물 ${articleNo} 사진 ${displayOrder}` });
  if (insertError) { await supabase.storage.from(BUCKET).remove([storagePath]); return jsonError(insertError.message, 500); }

  if (displayOrder === 1) {
    const { error: coverError } = await supabase.from("properties").update({ image_url: imageUrl }).eq("id", propertyId);
    if (coverError) return jsonError(coverError.message, 500);
  }

  return NextResponse.json({ ok: true, property_id: propertyId, article_no: articleNo, received_display_order: rawOrder, display_order: displayOrder, image_url: imageUrl, storage_path: storagePath });
}
