import { getSiteUrl } from "@/lib/site";
import { createSupabaseAnonClient, hasSupabasePublicConfig } from "@/lib/supabase";
import type { MediaType } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MEDIA_TYPES: MediaType[] = ["manga", "cg", "voice", "game"];
const PAGE_SIZE = 1000;

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: string;
  priority?: number;
};

type SitemapRow = {
  id: string;
  updated_at: string | null;
};

async function fetchAllSitemapRows(
  supabase: SupabaseClient,
  table: "works" | "circles",
): Promise<SitemapRow[]> {
  const rows: SitemapRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }
    if (!data?.length) {
      break;
    }

    rows.push(...(data as SitemapRow[]));
    if (data.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return rows;
}

function getStaticPages(base: string, now: Date): SitemapEntry[] {
  return [
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
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const base = getSiteUrl();
  const now = new Date();
  const staticPages = getStaticPages(base, now);

  if (!hasSupabasePublicConfig()) {
    return staticPages;
  }

  try {
    const supabase = createSupabaseAnonClient();
    if (!supabase) {
      return staticPages;
    }

    const [works, circles] = await Promise.all([
      fetchAllSitemapRows(supabase, "works"),
      fetchAllSitemapRows(supabase, "circles"),
    ]);

    const workPages: SitemapEntry[] = works.map((work) => ({
      url: `${base}/work/${work.id}`,
      lastModified: work.updated_at ? new Date(work.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const circlePages: SitemapEntry[] = circles.map((circle) => ({
      url: `${base}/circle?id=${encodeURIComponent(circle.id)}`,
      lastModified: circle.updated_at ? new Date(circle.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticPages, ...workPages, ...circlePages];
  } catch {
    return staticPages;
  }
}
