import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/lib/site-config";
import { seoLandings } from "@/lib/seo-landings";
import { seoExtraLandings } from "@/lib/seo-extra-landings";

export const revalidate = 3600;

type SitemapProperty = {
  id: number;
  created_at: string | null;
  is_hidden?: boolean | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const allSeoLandings = [...seoLandings, ...seoExtraLandings];
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/properties`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...allSeoLandings.map((landing) => ({
      url: `${siteConfig.url}/real-estate/${landing.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    let properties: SitemapProperty[] = [];

    const primary = await supabase
      .from("properties")
      .select("id, created_at, is_hidden")
      .order("created_at", { ascending: false });

    if (!primary.error && primary.data) {
      properties = (primary.data as SitemapProperty[]).filter(
        (property) => property.is_hidden !== true,
      );
    } else {
      const fallback = await supabase
        .from("properties")
        .select("id, created_at")
        .order("created_at", { ascending: false });

      if (fallback.error || !fallback.data) {
        return staticPages;
      }

      properties = fallback.data as SitemapProperty[];
    }

    const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
      url: `${siteConfig.url}/properties/${property.id}`,
      lastModified: property.created_at ? new Date(property.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...propertyPages];
  } catch {
    return staticPages;
  }
}
