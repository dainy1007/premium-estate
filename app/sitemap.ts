import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;

type SitemapProperty = {
  id: number;
  created_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("properties")
      .select("id, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return staticPages;
    }

    const propertyPages: MetadataRoute.Sitemap = (
      data as SitemapProperty[]
    ).map((property) => ({
      url: `${siteConfig.url}/properties/${property.id}`,
      lastModified: property.created_at
        ? new Date(property.created_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...propertyPages];
  } catch {
    return staticPages;
  }
}
