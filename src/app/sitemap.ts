import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { createSupabaseAnonClient, hasSupabasePublicConfig } from "@/lib/supabase";
import type { MediaType } from "@/lib/types";

const MEDIA_TYPES: MediaType[] = ["manga", "cg", "voice", "game"];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/circles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/circle`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...MEDIA_TYPES.map((type) => ({
      url: `${base}/media/${type}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  if (!hasSupabasePublicConfig()) {
    return staticPages;
  }

  const supabase = createSupabaseAnonClient();
  if (!supabase) {
    return staticPages;
  }

  const [worksResult, circlesResult] = await Promise.all([
    supabase
      .from("works")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(2000),
    supabase
      .from("circles")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000),
  ]);

  const workPages: MetadataRoute.Sitemap =
    worksResult.data?.map((work) => ({
      url: `${base}/work/${work.id}`,
      lastModified: work.updated_at ? new Date(work.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    })) ?? [];

  const circlePages: MetadataRoute.Sitemap =
    circlesResult.data?.map((circle) => ({
      url: `${base}/circle?id=${encodeURIComponent(circle.id)}`,
      lastModified: circle.updated_at ? new Date(circle.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.5,
    })) ?? [];

  return [...staticPages, ...workPages, ...circlePages];
}
