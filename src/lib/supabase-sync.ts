import {
  fetchCgCatalogItems,
  fetchDoujinGameItems,
  fetchDoujinMangaItems,
  fetchPopularDoujinItems,
  fetchVoiceCatalogItems,
  hasDmmCredentials,
} from "@/lib/dmm";
import type { DmmItemListResponse } from "@/lib/dmm-types";
import {
  buildCircleFromWorks,
  dedupeWorks,
  dmmItemsToWorks,
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

/** FANZA 人気順 API からランク付きで取得（順序を保つため逐次実行） */
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

function buildCatalogFetchTasks(): SyncFetchTask[] {
  const tasks: SyncFetchTask[] = [];

  const mangaOffsets = [1, 101, 201, 301, 401, 501, 601, 701];
  for (const offset of mangaOffsets) {
    tasks.push(() => fetchDoujinMangaItems(100, offset));
  }

  const gameOffsets = [1, 51, 101, 151, 201];
  for (const offset of gameOffsets) {
    tasks.push(() => fetchDoujinGameItems(50, offset));
  }

  const voiceOffsets = [1, 101, 201, 301];
  for (const offset of voiceOffsets) {
    tasks.push(() => fetchVoiceCatalogItems(100, offset));
  }

  const cgOffsets = [1, 101, 201, 301];
  for (const offset of cgOffsets) {
    tasks.push(() => fetchCgCatalogItems(100, offset));
  }

  return tasks;
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

/** 人気ランク付き作品とカタログ作品をマージ（人気ランクは上書き優先） */
function mergeWorksForSync(popular: Work[], catalog: Work[]): Work[] {
  const byId = new Map<string, Work>();

  for (const work of catalog) {
    byId.set(work.id, work);
  }

  for (const work of popular) {
    const existing = byId.get(work.id);
    byId.set(
      work.id,
      existing ? { ...existing, popularityRank: work.popularityRank } : work
    );
  }

  // カタログのみの作品は人気ランクなし（null で upsert）
  return [...byId.values()];
}

async function fetchWorksForSync(): Promise<Work[]> {
  const [popular, catalog] = await Promise.all([
    fetchPopularWorksWithRank(),
    runBatchedFetches(buildCatalogFetchTasks()),
  ]);

  return mergeWorksForSync(popular, catalog);
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
