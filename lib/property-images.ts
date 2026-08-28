import { supabase } from "@/lib/supabase";
import type { PropertyImage } from "@/types/property";
import { WATERMARK_CONFIG } from "@/lib/watermark-config";

export const MAX_PROPERTY_IMAGES = 20;
export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_PROPERTY_IMAGE_SIZE = 15 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
  mode: "center" | "corner",
) {
  const config = mode === "center" ? WATERMARK_CONFIG.center : WATERMARK_CONFIG.corner;
  const ratio = Math.max(1, image.naturalHeight) / Math.max(1, image.naturalWidth);
  const targetWidth = Math.max(1, Math.floor(width * config.widthRatio));
  const targetHeight = Math.max(1, Math.floor(targetWidth * ratio));

  let x = Math.floor((width - targetWidth) / 2);
  let y = Math.floor(height * WATERMARK_CONFIG.center.centerYRatio - targetHeight / 2);

  if (mode === "center") {
    x = Math.max(0, Math.min(x, width - targetWidth));
    y = Math.max(0, Math.min(y, height - targetHeight));
  } else {
    x = Math.max(0, width - targetWidth - WATERMARK_CONFIG.corner.rightMarginPx);
    y = Math.max(0, height - targetHeight - WATERMARK_CONFIG.corner.bottomMarginPx);
  }

  ctx.save();
  ctx.globalAlpha = config.opacity;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, x, y, targetWidth, targetHeight);
  ctx.restore();
}

export async function preparePropertyImage(file: File) {
  if (typeof document === "undefined") return file;

  const source = await loadImageBitmap(file);
  const [centerWatermark, cornerWatermark] = await Promise.all([
    loadWatermark(WATERMARK_CONFIG.center.src),
    loadWatermark(WATERMARK_CONFIG.corner.src),
  ]);

  const sourceWidth = source.width;
  const sourceHeight = source.height;

  // 기존 자동등록과 동일: 먼저 긴 변을 최대 2400px로 맞춘 뒤 워터마크를 합성한다.
  const watermarkScale = Math.min(
    1,
    WATERMARK_CONFIG.processing.watermarkLongEdgePx / Math.max(sourceWidth, sourceHeight),
  );
  const workingWidth = Math.max(1, Math.floor(sourceWidth * watermarkScale));
  const workingHeight = Math.max(1, Math.floor(sourceHeight * watermarkScale));

  const watermarkedCanvas = document.createElement("canvas");
  watermarkedCanvas.width = workingWidth;
  watermarkedCanvas.height = workingHeight;
  const watermarkCtx = watermarkedCanvas.getContext("2d", { alpha: false });
  if (!watermarkCtx) throw new Error(`${file.name}: 이미지 처리 기능을 사용할 수 없습니다.`);

  watermarkCtx.imageSmoothingEnabled = true;
  watermarkCtx.imageSmoothingQuality = "high";
  watermarkCtx.fillStyle = "#ffffff";
  watermarkCtx.fillRect(0, 0, workingWidth, workingHeight);
  watermarkCtx.drawImage(source, 0, 0, workingWidth, workingHeight);

  drawWatermarkImage(watermarkCtx, centerWatermark, workingWidth, workingHeight, "center");
  drawWatermarkImage(watermarkCtx, cornerWatermark, workingWidth, workingHeight, "corner");

  // 기존 홈페이지 동기화와 동일: 워터마크 완료본을 긴 변 최대 1800px로 최종 최적화한다.
  const outputScale = Math.min(
    1,
    WATERMARK_CONFIG.output.longEdgePx / Math.max(workingWidth, workingHeight),
  );
  const outputWidth = Math.max(1, Math.floor(workingWidth * outputScale));
  const outputHeight = Math.max(1, Math.floor(workingHeight * outputScale));

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

  const blob = await canvasToBlob(
    outputCanvas,
    "image/jpeg",
    WATERMARK_CONFIG.output.jpegQuality,
  );

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
      const { error: uploadError } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(storagePath, file, { cacheControl: "31536000", upsert: false, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      uploadedStoragePaths.push(storagePath);
      const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);
      uploadedImages.push({ property_id: propertyId, image_url: data.publicUrl, storage_path: storagePath, display_order: startOrder + index, is_cover: startOrder + index === 0, alt_text: `${title} ${startOrder + index + 1}` });
    }
    if (uploadedImages.length === 0) return [];
    const { data, error } = await supabase.from("property_images").insert(uploadedImages).select("*").order("display_order", { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (uploadedStoragePaths.length > 0) {
      const { error: cleanupError } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(uploadedStoragePaths);
      if (cleanupError) console.warn("실패한 이미지 업로드 정리 오류:", cleanupError);
    }
    throw error;
  }
}

export async function syncCoverImage(propertyId: number) {
  const { data: images, error } = await supabase.from("property_images").select("*").eq("property_id", propertyId).order("display_order", { ascending: true });
  if (error) throw error;
  if (!images || images.length === 0) return null;
  const coverImage = images[0];
  const { error: resetError } = await supabase.from("property_images").update({ is_cover: false }).eq("property_id", propertyId);
  if (resetError) throw resetError;
  const { error: coverError } = await supabase.from("property_images").update({ is_cover: true, display_order: 0 }).eq("id", coverImage.id);
  if (coverError) throw coverError;
  const { error: propertyError } = await supabase.from("properties").update({ image_url: coverImage.image_url }).eq("id", propertyId);
  if (propertyError) throw propertyError;
  return coverImage;
}
