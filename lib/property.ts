import { supabase } from "@/lib/supabase";
import { normalizePropertyForDisplay } from "@/lib/property-normalize";
import { getVerifiedSaleInfo } from "@/lib/sale-property-verification";
import type { Property } from "@/types/property";

function isPublicProperty(property: Property | null | undefined) {
  return Boolean(property) && property?.is_hidden !== true;
}

function hasAdminLockedData(property: Property) {
  const description = String(property.description ?? "");
  return description.includes("<!--PROPERTY_ADMIN_META:") || description.includes("<!--PROPERTY_OPTIONS:");
}

function applyVerifiedSaleInfo(property: Property): Property {
  const normalized = normalizePropertyForDisplay(property);

  // 관리자가 매물정보/옵션/설명을 한 번 저장한 매물은 관리자 입력을 최우선으로 유지한다.
  // 과거 주소별 검증 기본값이 이후 관리자 수정값을 다시 덮어쓰지 않게 한다.
  if (hasAdminLockedData(property)) return normalized;

  const verified = getVerifiedSaleInfo(normalized);
  if (!verified) return normalized;

  return {
    ...normalized,
    area: verified.area || normalized.area,
    floor: verified.floor || normalized.floor,
    description: verified.description || normalized.description,
  };
}

export async function getProperty(id: number) {
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .single();

  if (error || !data || !isPublicProperty(data as Property)) {
    return null;
  }

  return applyVerifiedSaleInfo(data as Property);
}

export async function getLatestProperties(limit = 6) {
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 2, limit));

  return ((data ?? []) as Property[])
    .filter(isPublicProperty)
    .map(applyVerifiedSaleInfo)
    .slice(0, limit);
}

export async function getRelatedProperties(id: number, type: string) {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .neq("id", id)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(12);

  return ((data ?? []) as Property[])
    .filter(isPublicProperty)
    .map(applyVerifiedSaleInfo)
    .sort((a, b) => {
      const featuredDifference = Number(b.is_featured) - Number(a.is_featured);
      if (featuredDifference !== 0) return featuredDifference;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    })
    .slice(0, 3);
}
