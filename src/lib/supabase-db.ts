import { createSupabaseAnonClient, hasSupabasePublicConfig } from "@/lib/supabase";
import { resolveAffiliateUrl } from "@/lib/dmm-affiliate";
import type { Circle, MediaType, Work } from "@/lib/types";

type CircleRow = {
  id: string;
  name: string;
  initial: string;
  description: string | null;
  work_count: number;
  latest_date: string | null;
  avg_price: number;
  manga_count: number;
  cg_count: number;
  voice_count: number;
  game_count: number;
  tags: string[] | null;
};

type WorkRow = {
  id: string;
  title: string;
  media_type: MediaType;
  price: number;
  date: string | null;
  tags: string[] | null;
  circle_id: string;
  circle_name: string;
  affiliate_url: string | null;
  thumbnail_url: string | null;
  sample_images: string[] | null;
  description: string | null;
};

function rowToCircle(row: CircleRow): Circle {
  return {
    id: row.id,
    name: row.name,
    initial: row.initial,
    description: row.description ?? "",
    workCount: row.work_count,
    latestDate: row.latest_date ?? "—",
    avgPrice: row.avg_price,
    mangaCount: row.manga_count,
    cgCount: row.cg_count,
    voiceCount: row.voice_count,
    gameCount: row.game_count,
    tags: row.tags ?? [],
  };
}

function rowToWork(row: WorkRow): Work {
  return {
    id: row.id,
    title: row.title,
    mediaType: row.media_type,
    price: row.price,
    date: row.date ?? "—",
    tags: row.tags ?? [],
    circleId: row.circle_id,
    circleName: row.circle_name,
    affiliateUrl: resolveAffiliateUrl(row.affiliate_url ?? undefined),
    thumbnailUrl: row.thumbnail_url ?? undefined,
    sampleImages: row.sample_images?.length ? row.sample_images : undefined,
    description: row.description ?? undefined,
  };
}

function getClient() {
  if (!hasSupabasePublicConfig()) return null;
  return createSupabaseAnonClient();
}

export async function dbHasData(): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false;

  const { count, error } = await supabase
    .from("works")
    .select("*", { count: "exact", head: true });

  return !error && (count ?? 0) > 0;
}

export async function dbGetLatestWorks(
  limit: number,
  mediaType: MediaType = "manga",
  offset = 0
): Promise<Work[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const query = supabase
    .from("works")
    .select("*")
    .eq("media_type", mediaType)
    .order("date", { ascending: false });

  const { data, error } =
    offset > 0
      ? await query.range(offset, offset + limit - 1)
      : await query.limit(limit);

  if (error || !data) return [];
  return (data as WorkRow[]).map(rowToWork);
}

export async function dbGetPopularWorks(
  limit: number,
  offset = 0
): Promise<Work[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const query = supabase.from("works").select("*").order("date", { ascending: false });

  const { data, error } =
    offset > 0
      ? await query.range(offset, offset + limit - 1)
      : await query.limit(limit);

  if (error || !data) return [];
  return (data as WorkRow[]).map(rowToWork);
}

export async function dbGetCircles(
  limit: number,
  sort: "popular" | "name" = "popular",
  offset = 0
): Promise<Circle[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const base = supabase.from("circles").select("*");
  const ordered =
    sort === "name"
      ? base.order("name", { ascending: true })
      : base
          .order("work_count", { ascending: false })
          .order("latest_date", { ascending: false });

  const { data, error } =
    offset > 0
      ? await ordered.range(offset, offset + limit - 1)
      : await ordered.limit(limit);

  if (error || !data) return [];
  return (data as CircleRow[]).map(rowToCircle);
}

export async function dbGetWorksByMedia(
  mediaType: MediaType,
  limit: number,
  offset = 0
): Promise<Work[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const query = supabase
    .from("works")
    .select("*")
    .eq("media_type", mediaType)
    .order("date", { ascending: false });

  const { data, error } =
    offset > 0
      ? await query.range(offset, offset + limit - 1)
      : await query.limit(limit);

  if (error || !data) return [];
  return (data as WorkRow[]).map(rowToWork);
}

export async function dbSearchWorks(
  keyword: string,
  limit: number,
  offset = 0
): Promise<Work[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const safe = keyword.replace(/[%_,]/g, " ").trim();
  if (!safe) return [];

  const pattern = `%${safe}%`;
  const query = supabase
    .from("works")
    .select("*")
    .or(`title.ilike.${pattern},circle_name.ilike.${pattern}`)
    .order("date", { ascending: false });

  const { data, error } =
    offset > 0
      ? await query.range(offset, offset + limit - 1)
      : await query.limit(limit);

  if (error || !data) return [];
  return (data as WorkRow[]).map(rowToWork);
}

export async function dbGetWork(id: string): Promise<Work | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToWork(data as WorkRow);
}

export async function dbGetRelatedWorks(
  circleId: string,
  excludeId: string,
  limit: number
): Promise<Work[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("circle_id", circleId)
    .neq("id", excludeId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as WorkRow[]).map(rowToWork);
}

export async function dbGetCircle(circleId: string): Promise<Circle | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCircle(data as CircleRow);
}

export async function dbGetCircleWorks(circleId: string): Promise<Work[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("circle_id", circleId)
    .order("date", { ascending: false });

  if (error || !data) return [];
  return (data as WorkRow[]).map(rowToWork);
}

export async function dbGetTopCircle(): Promise<Circle | null> {
  const circles = await dbGetCircles(1, "popular");
  return circles[0] ?? null;
}
