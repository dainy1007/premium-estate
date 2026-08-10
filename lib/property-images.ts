import { supabase } from "@/lib/supabase";
import type { PropertyImage } from "@/types/property";

export const MAX_PROPERTY_IMAGES = 20;
export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_PROPERTY_IMAGE_SIZE = 15 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type NewPropertyImage = {
  file: File;
  previewUrl: string;
  id: string;
};

export function sanitizeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return `${baseName || "property"}.${extension}`;
}

export function validatePropertyImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return `${file.name}: JPG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.`;
  }

  if (file.size > MAX_PROPERTY_IMAGE_SIZE) {
    return `${file.name}: 이미지 한 장의 최대 용량은 15MB입니다.`;
  }

  return null;
}

export function getValidPropertyImages(files: File[]) {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const error = validatePropertyImage(file);
    if (error) errors.push(error);
    else validFiles.push(file);
  }

  return { validFiles, errors };
}

export async function uploadPropertyImages(
  propertyId: number,
  files: File[],
  startOrder = 0,
  title = "매물 이미지"
) {
  const { validFiles, errors } = getValidPropertyImages(files);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const uploadedImages: Omit<PropertyImage, "id" | "created_at">[] = [];
  const uploadedStoragePaths: string[] = [];

  try {
    for (const [index, file] of validFiles.entries()) {
      const uniqueId = crypto.randomUUID();
      const storagePath = `${propertyId}/${Date.now()}-${uniqueId}-${sanitizeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      uploadedStoragePaths.push(storagePath);

      const { data } = supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .getPublicUrl(storagePath);

      uploadedImages.push({
        property_id: propertyId,
        image_url: data.publicUrl,
        storage_path: storagePath,
        display_order: startOrder + index,
        is_cover: startOrder + index === 0,
        alt_text: `${title} ${startOrder + index + 1}`,
      });
    }

    if (uploadedImages.length === 0) return [];

    const { data, error } = await supabase
      .from("property_images")
      .insert(uploadedImages)
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    if (uploadedStoragePaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .remove(uploadedStoragePaths);

      if (cleanupError) {
        console.warn("실패한 이미지 업로드 정리 오류:", cleanupError);
      }
    }

    throw error;
  }
}

export async function syncCoverImage(propertyId: number) {
  const { data: images, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order", { ascending: true });

  if (error) throw error;

  const coverImage = images?.[0];

  if (images && images.length > 0) {
    const { error: resetError } = await supabase
      .from("property_images")
      .update({ is_cover: false })
      .eq("property_id", propertyId);

    if (resetError) throw resetError;

    const { error: coverError } = await supabase
      .from("property_images")
      .update({ is_cover: true, display_order: 0 })
      .eq("id", coverImage.id);

    if (coverError) throw coverError;
  }

  const { error: propertyError } = await supabase
    .from("properties")
    .update({ image_url: coverImage?.image_url || "" })
    .eq("id", propertyId);

  if (propertyError) throw propertyError;

  return coverImage || null;
}
