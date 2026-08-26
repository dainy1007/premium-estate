import { supabase } from "@/lib/supabase";
import type { PropertyImage } from "@/types/property";

export const MAX_PROPERTY_IMAGES = 20;
export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_PROPERTY_IMAGE_SIZE = 15 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const OUTPUT_LONG_EDGE = 1800;
const OUTPUT_JPEG_QUALITY = 0.90;
const CENTER_SCALE = 0.52;
const CENTER_ALPHA = 0.38;
const CENTER_Y_RATIO = 0.60;
const CORNER_SCALE = 0.27;
const CORNER_ALPHA = 1.0;
const CORNER_RIGHT_MARGIN = 30;
const CORNER_BOTTOM_MARGIN = 30;
const CENTER_WATERMARK_SRC = "/watermarks/baekjo_center.png";
const CORNER_WATERMARK_SRC = "/watermarks/baekjo_corner.png";

export type NewPropertyImage = { file: File; previewUrl: string; id: string };

export function sanitizeFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 48);
  return `${baseName || "property"}.jpg`;
}

export function validatePropertyImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) return `${file.name}: JPG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.`;
  if (file.size > MAX_PROPERTY_IMAGE_SIZE) return `${file.name}: 이미지 한 장의 최대 용량은 15MB입니다.`;
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
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("이미지 변환에 실패했습니다.")), type, quality);
  });
}

async function loadImageBitmap(file: File) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file, { imageOrientation: "from-image" });
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`${file.name}: 이미지를 읽을 수 없습니다.`));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const watermarkCache = new Map<string, Promise<HTMLImageElement>>();
function loadWatermark(src: string) {
  if (!watermarkCache.has(src)) {
    watermarkCache.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "sync";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`워터마크 이미지를 불러오지 못했습니다: ${src}`));
      img.src = src;
    }));
  }
  return watermarkCache.get(src)!;
}

function drawWatermarkImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  scale: number,
  alpha: number,
  mode: "center" | "corner"
) {
  const targetWidth = Math.max(1, Math.round(width * scale));
  const ratio = image.naturalHeight / Math.max(1, image.naturalWidth);
  const targetHeight = Math.max(1, Math.round(targetWidth * ratio));

  let x = Math.round((width - targetWidth) / 2);
  let y = Math.round(height * CENTER_Y_RATIO - targetHeight / 2);

  if (mode === "corner") {
    x = Math.max(0, width - targetWidth - CORNER_RIGHT_MARGIN);
    y = Math.max(0, height - targetHeight - CORNER_BOTTOM_MARGIN);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, x, y, targetWidth, targetHeight);
  ctx.restore();
}

async function preparePropertyImage(file: File) {
  if (typeof document === "undefined") return file;

  const source = await loadImageBitmap(file);
  const [centerWatermark, cornerWatermark] = await Promise.all([
    loadWatermark(CENTER_WATERMARK_SRC),
    loadWatermark(CORNER_WATERMARK_SRC),
  ]);

  const sourceWidth = source.width;
  const sourceHeight = source.height;

  // 자동화 프로그램과 같은 순서: 원본 크기에 워터마크 적용 후 홈페이지용 1800px 최적화.
  const watermarkedCanvas = document.createElement("canvas");
  watermarkedCanvas.width = sourceWidth;
  watermarkedCanvas.height = sourceHeight;
  const watermarkCtx = watermarkedCanvas.getContext("2d", { alpha: false });
  if (!watermarkCtx) throw new Error(`${file.name}: 이미지 처리 기능을 사용할 수 없습니다.`);

  watermarkCtx.imageSmoothingEnabled = true;
  watermarkCtx.imageSmoothingQuality = "high";
  watermarkCtx.fillStyle = "#ffffff";
  watermarkCtx.fillRect(0, 0, sourceWidth, sourceHeight);
  watermarkCtx.drawImage(source, 0, 0, sourceWidth, sourceHeight);

  drawWatermarkImage(watermarkCtx, centerWatermark, sourceWidth, sourceHeight, CENTER_SCALE, CENTER_ALPHA, "center");
  drawWatermarkImage(watermarkCtx, cornerWatermark, sourceWidth, sourceHeight, CORNER_SCALE, CORNER_ALPHA, "corner");

  const outputScale = Math.min(1, OUTPUT_LONG_EDGE / Math.max(sourceWidth, sourceHeight));
  const outputWidth = Math.max(1, Math.round(sourceWidth * outputScale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * outputScale));

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const outputCtx = outputCanvas.getContext("2d", { alpha: false });
  if (!outputCtx) throw new Error(`${file.name}: 이미지 최적화 기능을 사용할 수 없습니다.`);

  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  outputCtx.fillStyle = "#ffffff";
  outputCtx.fillRect(0, 0, outputWidth, outputHeight);
  outputCtx.drawImage(watermarkedCanvas, 0, 0, outputWidth, outputHeight);

  if ("close" in source && typeof source.close === "function") source.close();

  const blob = await canvasToBlob(outputCanvas, "image/jpeg", OUTPUT_JPEG_QUALITY);
  return new File([blob], sanitizeFileName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function uploadPropertyImages(propertyId: number, files: File[], startOrder = 0, title = "매물 이미지") {
  const { validFiles, errors } = getValidPropertyImages(files);
  if (errors.length > 0) throw new Error(errors.join("\n"));

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

      const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);
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
      if (cleanupError) console.warn("실패한 이미지 업로드 정리 오류:", cleanupError);
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
