import {
  fetchCgCatalogItems,
  fetchCgCatalogItemsAlt,
  fetchDoujinGameItems,
  fetchDoujinMangaItems,
  fetchPopularDoujinItems,
  fetchVoiceCatalogItems,
  fetchVoiceCatalogItemsAlt,
  hasDmmCredentials,
} from "@/lib/dmm";
import type { DmmItemListResponse } from "@/lib/dmm-types";
import {
  buildCircleFromWorks,
  dedupeWorks,
  dmmItemsToWorks,
  isGameLikeText,
  isVoiceLikeText,
} from "@/lib/dmm-transform";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type { Circle, MediaType, Work } from "@/lib/types";

function parseResponse(json: unknown): Work[] {
  const data = json as DmmItemListResponse;
  if (!data?.result?.items?.length) return [];
  return dmmItemsToWorks(data.result.items);
}

type SyncFetchTask = () => Promise<unknown>;

const BATCH_SIZE = 5;
const POPULAR_OFFSETS = [1, 101, 201, 301, 401];

function workText(work: Work): string {
  return `${work.title} ${work.tags.join(" ")} ${work.description ?? ""}`;
}

function isVoiceLike(work: Work): boolean {
  return isVoiceLikeText(workText(work), work.description ?? "");
}

function isGameLike(work: Work): boolean {
  return (
    work.mediaType === "game" ||
    isGameLikeText(workText(work), work.description ?? "")
  );
}

function isCgLike(work: Work): boolean {
  return /CG集|CG・|イラスト集|画集|画像集|CGコミック/i.test(workText(work));
}

/** 音声キーワード取得結果から音声作品だけを抽出 */
function extractVoiceWorks(works: Work[]): Work[] {
  return works.flatMap((work) => {
    if (isGameLike(work)) return [];
    if (work.mediaType === "voice" || isVoiceLike(work)) {
      return [{ ...work, mediaType: "voice" as const }];
    }
    return [];
  });
}

/** CGキーワード取得結果からCG作品だけを抽出 */
function extractCgWorks(works: Work[]): Work[] {
  return works.flatMap((work) => {
    if (work.mediaType === "game" || work.mediaType === "voice") return [];
    if (work.mediaType === "cg" || isCgLike(work)) {
      return [{ ...work, mediaType: "cg" as const }];
    }
    return [];
  });
}

async function fetchPopularWorksWithRank(): Promise<Work[]> {
  const works: Work[] = [];
  const seen = new Set<string>();
  let rank = 1;

  for (const offset of POPULAR_OFFSETS) {
    try {
      const json = await fetchPopularDoujinItems(100, offset);
      for (const work of parseResponse(json)) {
        if (seen.has(work.id)) continue;
        seen.add(work.id);
        works.push({ ...work, popularityRank: rank++ });
      }
    } catch {
      // 1ページ失敗しても続行
    }
  }

  return works;
}

function buildMangaGameTasks(): SyncFetchTask[] {
  const tasks: SyncFetchTask[] = [];

  for (const offset of [1, 101, 201, 301, 401, 501, 601, 701]) {
    tasks.push(() => fetchDoujinMangaItems(100, offset));
  }

  for (const offset of [1, 51, 101, 151, 201]) {
    tasks.push(() => fetchDoujinGameItems(50, offset));
  }

  return tasks;
}

async function runBatchedFetches(tasks: SyncFetchTask[]): Promise<Work[]> {
  const allWorks: Work[] = [];

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((task) => task()));

    for (const result of results) {
      if (result.status === "fulfilled") {
        allWorks.push(...parseResponse(result.value));
      }
    }
  }

  return dedupeWorks(allWorks);
}

async function fetchVoiceCatalogWorks(): Promise<Work[]> {
  const all: Work[] = [];
  const fetches = [
    fetchVoiceCatalogItems,
    fetchVoiceCatalogItemsAlt,
  ] as const;

  for (const fetch of fetches) {
    for (const offset of [1, 101, 201, 301, 401]) {
      try {
        const json = await fetch(100, offset);
        all.push(...extractVoiceWorks(parseResponse(json)));
      } catch {
        // 続行
      }
    }
  }

  return dedupeWorks(all);
}

async function fetchCgCatalogWorks(): Promise<Work[]> {
  const all: Work[] = [];
  const fetches = [fetchCgCatalogItems, fetchCgCatalogItemsAlt] as const;

  for (const fetch of fetches) {
    for (const offset of [1, 101, 201, 301, 401]) {
      try {
        const json = await fetch(100, offset);
        all.push(...extractCgWorks(parseResponse(json)));
      } catch {
        // 続行
      }
    }
  }

  return dedupeWorks(all);
}

/**
 * マージ順: 漫画・ゲーム → 音声・CG（後勝ちで media_type 上書き）→ 人気ランク
 */
function mergeWorksForSync(
  popular: Work[],
  baseCatalog: Work[],
  voiceCatalog: Work[],
  cgCatalog: Work[]
): Work[] {
  const byId = new Map<string, Work>();

  for (const work of baseCatalog) {
    byId.set(work.id, work);
  }

  for (const work of voiceCatalog) {
    const existing = byId.get(work.id);
    if (existing && isGameLike(existing)) continue;
    byId.set(work.id, existing ? { ...existing, ...work, mediaType: "voice" } : work);
  }

  for (const work of cgCatalog) {
    const existing = byId.get(work.id);
    if (existing?.mediaType === "voice") continue;
    byId.set(work.id, existing ? { ...existing, ...work, mediaType: "cg" } : work);
  }

  for (const work of popular) {
    const existing = byId.get(work.id);
    byId.set(
      work.id,
      existing ? { ...existing, popularityRank: work.popularityRank } : work
    );
  }

  return [...byId.values()];
}

async function fetchWorksForSync(): Promise<Work[]> {
  const [popular, baseCatalog, voiceCatalog, cgCatalog] = await Promise.all([
    fetchPopularWorksWithRank(),
    runBatchedFetches(buildMangaGameTasks()),
    fetchVoiceCatalogWorks(),
    fetchCgCatalogWorks(),
  ]);

  return mergeWorksForSync(popular, baseCatalog, voiceCatalog, cgCatalog);
}

function countByMedia(works: Work[]): Record<MediaType, number> {
  const counts: Record<MediaType, number> = {
    manga: 0,
    cg: 0,
    voice: 0,
    game: 0,
  };
  for (const work of works) {
    counts[work.mediaType]++;
  }
  return counts;
}

function circleToRow(circle: Circle) {
  return {
    id: circle.id,
    name: circle.name,
    initial: circle.initial,
    description: circle.description,
    work_count: circle.workCount,
    latest_date: circle.latestDate,
    avg_price: circle.avgPrice,
    manga_count: circle.mangaCount,
    cg_count: circle.cgCount,
    voice_count: circle.voiceCount,
    game_count: circle.gameCount,
    tags: circle.tags,
    updated_at: new Date().toISOString(),
  };
}

function workToRow(work: Work) {
  return {
    id: work.id,
    title: work.title,
    media_type: work.mediaType,
    price: work.price,
    date: work.date,
    tags: work.tags,
    circle_id: work.circleId,
    circle_name: work.circleName,
    affiliate_url: work.affiliateUrl ?? null,
    thumbnail_url: work.thumbnailUrl ?? null,
    sample_images: work.sampleImages ?? [],
    description: work.description ?? null,
    popularity_rank: work.popularityRank ?? null,
    updated_at: new Date().toISOString(),
  };
}

function buildCirclesFromWorks(works: Work[]): Circle[] {
  const grouped = new Map<string, Work[]>();
  for (const work of works) {
    const list = grouped.get(work.circleId) ?? [];
    list.push(work);
    grouped.set(work.circleId, list);
  }

  return [...grouped.entries()]
    .map(([id, circleWorks]) => buildCircleFromWorks(id, circleWorks))
    .filter((circle): circle is Circle => circle !== null);
}

export async function syncDmmToSupabase(): Promise<{
  worksSynced: number;
  circlesSynced: number;
  worksFetched: number;
  popularRanked: number;
  byMedia: Record<MediaType, number>;
}> {
  if (!hasDmmCredentials()) {
    throw new Error("DMM API キーが未設定です");
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service role が未設定です");
  }

  const works = await fetchWorksForSync();
  if (works.length === 0) {
    throw new Error("DMM から作品を取得できませんでした");
  }

  const popularRanked = works.filter((w) => w.popularityRank != null).length;
  const byMedia = countByMedia(works);
  const circles = buildCirclesFromWorks(works);
  const circleRows = circles.map(circleToRow);
  const workRows = works.map(workToRow);

  const { error: circlesError } = await supabase
    .from("circles")
    .upsert(circleRows, { onConflict: "id" });

  if (circlesError) {
    throw new Error(`サークル同期失敗: ${circlesError.message}`);
  }

  const { error: worksError } = await supabase
    .from("works")
    .upsert(workRows, { onConflict: "id" });

  if (worksError) {
    throw new Error(`作品同期失敗: ${worksError.message}`);
  }

  return {
    circlesSynced: circleRows.length,
    worksSynced: workRows.length,
    worksFetched: works.length,
    popularRanked,
    byMedia,
  };
}
