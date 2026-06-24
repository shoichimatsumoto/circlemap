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

async function fetchWorksForSync(): Promise<Work[]> {
  const results = await Promise.allSettled([
    fetchPopularDoujinItems(100, 1),
    fetchPopularDoujinItems(100, 101),
    fetchDoujinMangaItems(100, 1),
    fetchDoujinMangaItems(100, 101),
    fetchDoujinGameItems(50, 1),
  ]);

  return dedupeWorks(
    results.flatMap((result) =>
      result.status === "fulfilled" ? parseResponse(result.value) : []
    )
  );
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
  };
}
