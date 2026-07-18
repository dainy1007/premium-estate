import { supabase } from "@/lib/supabase";

export async function getProperty(id: number) {
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getRelatedProperties(
  id: number,
  type: string
) {
  const { data } = await supabase
    .from("properties")
    .select("id, title, price, location, deal_type, type, image_url")
    .neq("id", id)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(3);

  return data ?? [];
}