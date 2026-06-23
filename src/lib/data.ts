import {
  fetchDoujinCgItems,
  fetchDoujinGameItems,
  fetchDoujinMangaItems,
  fetchDoujinVoiceItems,
  fetchItemByContentId,
  hasDmmCredentials,
} from "@/lib/dmm";
import type { DmmItemListResponse } from "@/lib/dmm-types";
import {
  buildCircleFromWorks,
  dmmItemsToWorks,
} from "@/lib/dmm-transform";
import {
  DEMO_CIRCLE,
  DEMO_WORKS,
  FEATURED_WORK,
} from "@/lib/mock-data";
import type { Circle, DataSource, Work } from "@/lib/types";

function parseResponse(json: unknown): Work[] {
  const data = json as DmmItemListResponse;
  if (!data?.result?.items?.length) return [];
  return dmmItemsToWorks(data.result.items);
}

function sortByDateDesc(works: Work[]): Work[] {
  return [...works].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLatestWorks(limit = 8): Promise<{
  works: Work[];
  source: DataSource;
}> {
  if (hasDmmCredentials()) {
    try {
      // まず同人（漫画）フロアで取得。他フロアは順次追加。
      const manga = await fetchDoujinMangaItems(Math.max(limit * 3, 24), 1);
      const works = sortByDateDesc(parseResponse(manga)).slice(0, limit);

      if (works.length > 0) {
        return { works, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM fetch failed, using mock:", error);
    }
  }

  return { works: DEMO_WORKS.slice(0, limit), source: "mock" };
}

export async function getWork(id: string): Promise<{
  work: Work | null;
  relatedWorks: Work[];
  source: DataSource;
}> {
  if (hasDmmCredentials()) {
    try {
      const json = await fetchItemByContentId(id);
      const works = parseResponse(json);
      const work = works[0] ?? null;

      if (work) {
        const related = works.slice(1, 4);
        return { work, relatedWorks: related, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM work fetch failed:", error);
    }
  }

  const mockWork = DEMO_WORKS.find((w) => w.id === id);
  if (mockWork) {
    return {
      work: mockWork,
      relatedWorks: DEMO_WORKS.filter(
        (w) => w.circleId === mockWork.circleId && w.id !== mockWork.id
      ).slice(0, 3),
      source: "mock",
    };
  }

  return { work: null, relatedWorks: [], source: "mock" };
}

export async function getCirclePage(circleId = "demo"): Promise<{
  circle: Circle;
  works: Work[];
  featured: Work;
  source: DataSource;
}> {
  if (circleId === "demo" || circleId === DEMO_CIRCLE.id) {
    if (!hasDmmCredentials()) {
      return {
        circle: DEMO_CIRCLE,
        works: DEMO_WORKS,
        featured: FEATURED_WORK,
        source: "mock",
      };
    }
  }

  if (hasDmmCredentials()) {
    try {
      const results = await Promise.allSettled([
        fetchDoujinMangaItems(40, 1),
        fetchDoujinVoiceItems(20, 1),
        fetchDoujinCgItems(20, 1),
        fetchDoujinGameItems(10, 1),
      ]);

      const allWorks = sortByDateDesc(
        results.flatMap((result) =>
          result.status === "fulfilled" ? parseResponse(result.value) : []
        )
      );

      if (allWorks.length === 0) {
        throw new Error("No works from DMM API");
      }

      const grouped = new Map<string, Work[]>();
      for (const work of allWorks) {
        const list = grouped.get(work.circleId) ?? [];
        list.push(work);
        grouped.set(work.circleId, list);
      }

      const targetWorks =
        grouped.get(circleId) ??
        [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[1] ??
        [];

      const resolvedCircleId = targetWorks[0]?.circleId ?? circleId;
      const circle =
        buildCircleFromWorks(resolvedCircleId, targetWorks) ??
        buildCircleFromWorks("demo", targetWorks);

      if (circle && targetWorks.length > 0) {
        return {
          circle,
          works: targetWorks,
          featured: targetWorks[0],
          source: "dmm",
        };
      }
    } catch (error) {
      console.error("[CircleMap] DMM circle fetch failed, using mock:", error);
    }
  }

  return {
    circle: DEMO_CIRCLE,
    works: DEMO_WORKS,
    featured: FEATURED_WORK,
    source: "mock",
  };
}

export function getDataMode(): { hasCredentials: boolean; mode: DataSource } {
  const hasCredentials = hasDmmCredentials();
  return {
    hasCredentials,
    mode: hasCredentials ? "dmm" : "mock",
  };
}
