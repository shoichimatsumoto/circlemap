import { getSiteUrl } from "@/lib/site";
import { createSupabaseAnonClient, hasSupabasePublicConfig } from "@/lib/supabase";
import type { MediaType } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MEDIA_TYPES: MediaType[] = ["manga", "cg", "voice", "game"];
const PAGE_SIZE = 1000;

/** 作品サイトマップ1ファイルあたりの URL 数 */
export const SITEMAP_WORKS_CHUNK_SIZE = 1000;

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

export function getStaticSitemapEntries(base: string, now: Date): SitemapEntry[] {
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

function mapWorkRows(
  base: string,
  works: SitemapRow[],
  now: Date,
): SitemapEntry[] {
  return works.map((work) => ({
    url: `${base}/work/${work.id}`,
    lastModified: work.updated_at ? new Date(work.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
}

function mapCircleRows(
  base: string,
  circles: SitemapRow[],
  now: Date,
): SitemapEntry[] {
  return circles.map((circle) => ({
    url: `${base}/circle?id=${encodeURIComponent(circle.id)}`,
    lastModified: circle.updated_at ? new Date(circle.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}

async function fetchDbSitemapRows(): Promise<{
  works: SitemapRow[];
  circles: SitemapRow[];
} | null> {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  const supabase = createSupabaseAnonClient();
  if (!supabase) {
    return null;
  }

  const [works, circles] = await Promise.all([
    fetchAllSitemapRows(supabase, "works"),
    fetchAllSitemapRows(supabase, "circles"),
  ]);

  return { works, circles };
}

export async function getWorkSitemapEntries(): Promise<SitemapEntry[]> {
  const base = getSiteUrl();
  const now = new Date();

  try {
    const rows = await fetchDbSitemapRows();
    if (!rows) {
      return [];
    }
    return mapWorkRows(base, rows.works, now);
  } catch {
    return [];
  }
}

export async function getCircleSitemapEntries(): Promise<SitemapEntry[]> {
  const base = getSiteUrl();
  const now = new Date();

  try {
    const rows = await fetchDbSitemapRows();
    if (!rows) {
      return [];
    }
    return mapCircleRows(base, rows.circles, now);
  } catch {
    return [];
  }
}

export function chunkSitemapEntries(
  entries: SitemapEntry[],
  chunkSize: number,
): SitemapEntry[][] {
  if (entries.length === 0) {
    return [];
  }

  const chunks: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    chunks.push(entries.slice(i, i + chunkSize));
  }
  return chunks;
}

/** サイトマップ index に載せる子サイトマップ URL 一覧 */
export async function getSitemapChildUrls(): Promise<string[]> {
  const base = getSiteUrl();
  const now = new Date();
  const urls = [`${base}/sitemap/static.xml`];

  try {
    const rows = await fetchDbSitemapRows();
    if (!rows) {
      return urls;
    }

    const workChunks = chunkSitemapEntries(
      mapWorkRows(base, rows.works, now),
      SITEMAP_WORKS_CHUNK_SIZE,
    );

    for (let i = 0; i < workChunks.length; i++) {
      urls.push(`${base}/sitemap/works/${i + 1}`);
    }

    if (rows.circles.length > 0) {
      urls.push(`${base}/sitemap/circles.xml`);
    }
  } catch {
    // static のみ
  }

  return urls;
}

/** 後方互換: 単一サイトマップ用（テスト・フォールバック） */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const base = getSiteUrl();
  const now = new Date();
  const staticPages = getStaticSitemapEntries(base, now);
  const [workPages, circlePages] = await Promise.all([
    getWorkSitemapEntries(),
    getCircleSitemapEntries(),
  ]);

  return [...staticPages, ...workPages, ...circlePages];
}
