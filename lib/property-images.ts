import { supabase } from "@/lib/supabase";
import type { PropertyImage } from "@/types/property";

export const MAX_PROPERTY_IMAGES = 20;
export const PROPERTY_IMAGES_BUCKET = "property-images";

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

export async function uploadPropertyImages(
  propertyId: number,
  files: File[],
  startOrder = 0,
  title = "매물 이미지"
) {
  const uploadedImages: Omit<PropertyImage, "id" | "created_at">[] = [];

  for (const [index, file] of files.entries()) {
    const storagePath = `${propertyId}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

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

  if (uploadedImages.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("property_images")
    .insert(uploadedImages)
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    await Promise.all(
      uploadedImages.map((image) =>
        supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([image.storage_path])
      )
    );

    throw error;
  }

  return data || [];
}

export async function syncCoverImage(propertyId: number) {
  const { data: images, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  const coverImage = images?.[0];

  if (images && images.length > 0) {
    await supabase
      .from("property_images")
      .update({ is_cover: false })
      .eq("property_id", propertyId);

    await supabase
      .from("property_images")
      .update({ is_cover: true, display_order: 0 })
      .eq("id", coverImage.id);
  }

  const { error: propertyError } = await supabase
    .from("properties")
    .update({ image_url: coverImage?.image_url || "" })
    .eq("id", propertyId);

  if (propertyError) {
    throw propertyError;
  }

  return coverImage || null;
}
