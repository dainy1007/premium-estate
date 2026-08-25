import { supabase } from "@/lib/supabase";
import { normalizePropertyForDisplay } from "@/lib/property-normalize";
import type { Property } from "@/types/property";

function isPublicProperty(property: Property | null | undefined) {
  return Boolean(property) && property?.is_hidden !== true;
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

  return normalizePropertyForDisplay(data as Property);
}

export async function getLatestProperties(limit = 6) {
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 2, limit));

  return ((data ?? []) as Property[])
    .filter(isPublicProperty)
    .map(normalizePropertyForDisplay)
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
    .map(normalizePropertyForDisplay)
    .sort((a, b) => {
      const featuredDifference = Number(b.is_featured) - Number(a.is_featured);
      if (featuredDifference !== 0) return featuredDifference;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    })
    .slice(0, 3);
}
