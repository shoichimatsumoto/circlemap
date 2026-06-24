import {
  fetchDoujinGameItems,
  fetchDoujinMangaItems,
  fetchPopularDoujinItems,
  hasDmmCredentials,
} from "@/lib/dmm";
import type { DmmItemListResponse } from "@/lib/dmm-types";
import {
  buildCircleFromWorks,
  dedupeWorks,
  dmmItemsToWorks,
} from "@/lib/dmm-transform";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type { Circle, Work } from "@/lib/types";

function parseResponse(json: unknown): Work[] {
  const data = json as DmmItemListResponse;
  if (!data?.result?.items?.length) return [];
  return dmmItemsToWorks(data.result.items);
}

type SyncFetchTask = () => Promise<unknown>;

/** 1バッチあたりの並列数（DMM API・Vercel タイムアウトのバランス） */
const BATCH_SIZE = 5;

/**
 * 同期用の DMM 取得タスク一覧。
 * 音声・CG は同人フロアの返却データから自動判定されるため、
 * ページを増やしてユニーク作品数を確保する。
 */
function buildSyncFetchTasks(): SyncFetchTask[] {
  const tasks: SyncFetchTask[] = [];

  const popularOffsets = [1, 101, 201, 301, 401];
  for (const offset of popularOffsets) {
    tasks.push(() => fetchPopularDoujinItems(100, offset));
  }

  const mangaOffsets = [1, 101, 201, 301, 401, 501];
  for (const offset of mangaOffsets) {
    tasks.push(() => fetchDoujinMangaItems(100, offset));
  }

  const gameOffsets = [1, 51, 101, 151, 201];
  for (const offset of gameOffsets) {
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

async function fetchWorksForSync(): Promise<Work[]> {
  return runBatchedFetches(buildSyncFetchTasks());
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
  };
}
