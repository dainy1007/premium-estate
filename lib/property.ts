import { supabase } from "@/lib/supabase";
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

  return data;
}

export async function getRelatedProperties(id: number, type: string) {
  const { data } = await supabase
    .from("properties")
    .select("id, title, price, location, deal_type, type, image_url, is_hidden, is_sold, is_featured, display_order")
    .neq("id", id)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(12);

  return ((data ?? []) as Property[])
    .filter(isPublicProperty)
    .sort((a, b) => {
      const featuredDifference = Number(b.is_featured) - Number(a.is_featured);
      if (featuredDifference !== 0) return featuredDifference;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    })
    .slice(0, 3);
}
