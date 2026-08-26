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

const OUTPUT_LONG_EDGE = 1800;
const OUTPUT_JPEG_QUALITY = 0.84;
const CENTER_WATERMARK_ALPHA = 0.38;
const CORNER_WATERMARK_ALPHA = 0.95;

export type NewPropertyImage = {
  file: File;
  previewUrl: string;
  id: string;
};

export function sanitizeFileName(fileName: string) {
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return `${baseName || "property"}.jpg`;
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지 변환에 실패했습니다."));
    }, type, quality);
  });
}

async function loadImageBitmap(file: File) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`${file.name}: 이미지를 읽을 수 없습니다.`));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawCenteredWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(34, Math.round(width * 0.055));
  ctx.save();
  ctx.globalAlpha = CENTER_WATERMARK_ALPHA;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(10,35,66,0.28)";
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.06));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px sans-serif`;
  const text = "백조현대부동산";
  const y = height * 0.60;
  ctx.strokeText(text, width / 2, y);
  ctx.fillText(text, width / 2, y);
  ctx.restore();
}

function drawCornerWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(18, Math.round(width * 0.021));
  const paddingX = Math.max(20, Math.round(width * 0.025));
  const paddingY = Math.max(18, Math.round(height * 0.03));

  ctx.save();
  ctx.globalAlpha = CORNER_WATERMARK_ALPHA;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(10,35,66,0.5)";
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.08));
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `700 ${fontSize}px sans-serif`;
  const text = "백조현대부동산";
  ctx.strokeText(text, width - paddingX, height - paddingY);
  ctx.fillText(text, width - paddingX, height - paddingY);
  ctx.restore();
}

async function preparePropertyImage(file: File) {
  if (typeof document === "undefined") return file;

  const source = await loadImageBitmap(file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  const scale = Math.min(1, OUTPUT_LONG_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error(`${file.name}: 이미지 처리 기능을 사용할 수 없습니다.`);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  drawCenteredWatermark(ctx, width, height);
  drawCornerWatermark(ctx, width, height);

  if ("close" in source && typeof source.close === "function") source.close();

  const blob = await canvasToBlob(canvas, "image/jpeg", OUTPUT_JPEG_QUALITY);
  const outputName = sanitizeFileName(file.name);
  return new File([blob], outputName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
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
    for (const [index, originalFile] of validFiles.entries()) {
      const file = await preparePropertyImage(originalFile);
      const uniqueId = crypto.randomUUID();
      const storagePath = `${propertyId}/${Date.now()}-${uniqueId}-${sanitizeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: "image/jpeg",
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
