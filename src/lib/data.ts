import {
  fetchDoujinCgItems,
  fetchDoujinGameItems,
  fetchDoujinMangaItems,
  fetchDoujinVoiceItems,
  fetchItemByContentId,
  fetchItemsByMaker,
  fetchPopularDoujinItems,
  hasDmmCredentials,
  MEDIA_FETCHERS,
  searchByKeyword,
} from "@/lib/dmm";
import type { DmmItemListResponse } from "@/lib/dmm-types";
import {
  buildCircleFromWorks,
  dedupeWorks,
  dmmItemsToWorks,
  filterWorksByMedia,
} from "@/lib/dmm-transform";
import {
  DEMO_CIRCLE,
  DEMO_WORKS,
  FEATURED_WORK,
} from "@/lib/mock-data";
import type { Circle, DataSource, MediaType, Work } from "@/lib/types";

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
      const manga = await fetchDoujinMangaItems(Math.max(limit * 3, 24), 1);
      const works = sortByDateDesc(
        filterWorksByMedia(parseResponse(manga), "manga")
      ).slice(0, limit);

      if (works.length > 0) {
        return { works, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM fetch failed, using mock:", error);
    }
  }

  return { works: DEMO_WORKS.slice(0, limit), source: "mock" };
}

export async function getPopularWorks(limit = 12): Promise<{
  works: Work[];
  source: DataSource;
}> {
  if (hasDmmCredentials()) {
    try {
      const json = await fetchPopularDoujinItems(Math.max(limit * 2, 24), 1);
      const works = dedupeWorks(parseResponse(json)).slice(0, limit);

      if (works.length > 0) {
        return { works, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM popular fetch failed:", error);
    }
  }

  return { works: DEMO_WORKS.slice(0, limit), source: "mock" };
}

function collectCirclesFromWorks(works: Work[], limit: number): Circle[] {
  const grouped = new Map<string, Work[]>();
  for (const work of works) {
    const list = grouped.get(work.circleId) ?? [];
    list.push(work);
    grouped.set(work.circleId, list);
  }

  return [...grouped.entries()]
    .sort((a, b) => {
      if (b[1].length !== a[1].length) {
        return b[1].length - a[1].length;
      }
      return b[1][0].date.localeCompare(a[1][0].date);
    })
    .slice(0, limit)
    .map(([id, circleWorks]) => buildCircleFromWorks(id, circleWorks))
    .filter((circle): circle is Circle => circle !== null);
}

async function fetchWorksForCircleDiscovery(): Promise<Work[]> {
  const results = await Promise.allSettled([
    fetchPopularDoujinItems(100, 1),
    fetchPopularDoujinItems(100, 101),
    fetchDoujinMangaItems(100, 1),
    fetchDoujinMangaItems(100, 101),
  ]);

  return dedupeWorks(
    results.flatMap((result) =>
      result.status === "fulfilled" ? parseResponse(result.value) : []
    )
  );
}

export async function getDiscoverableCircles(limit = 50): Promise<{
  circles: Circle[];
  source: DataSource;
}> {
  if (hasDmmCredentials()) {
    try {
      const works = await fetchWorksForCircleDiscovery();
      const circles = collectCirclesFromWorks(works, limit);

      if (circles.length > 0) {
        return { circles, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM discover circles failed:", error);
    }
  }

  return { circles: [DEMO_CIRCLE], source: "mock" };
}

export async function getPopularCircles(limit = 8): Promise<{
  circles: Circle[];
  source: DataSource;
}> {
  return getDiscoverableCircles(limit);
}

export async function getWorksByMedia(
  mediaType: MediaType,
  limit = 24
): Promise<{ works: Work[]; source: DataSource }> {
  if (hasDmmCredentials()) {
    try {
      const json = await MEDIA_FETCHERS[mediaType](limit, 1);
      const works = sortByDateDesc(
        filterWorksByMedia(parseResponse(json), mediaType)
      ).slice(0, limit);

      if (works.length > 0) {
        return { works, source: "dmm" };
      }
    } catch (error) {
      console.error(`[CircleMap] DMM ${mediaType} fetch failed:`, error);
    }
  }

  const mock = DEMO_WORKS.filter((w) => w.mediaType === mediaType).slice(
    0,
    limit
  );
  return { works: mock.length > 0 ? mock : DEMO_WORKS.slice(0, limit), source: "mock" };
}

export async function searchWorks(
  keyword: string,
  limit = 24
): Promise<{ works: Work[]; source: DataSource }> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { works: [], source: "mock" };
  }

  if (hasDmmCredentials()) {
    try {
      const json = await searchByKeyword(trimmed, limit);
      const works = dedupeWorks(sortByDateDesc(parseResponse(json))).slice(
        0,
        limit
      );

      if (works.length > 0) {
        return { works, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM search failed:", error);
    }
  }

  const lower = trimmed.toLowerCase();
  const mock = DEMO_WORKS.filter(
    (w) =>
      w.title.toLowerCase().includes(lower) ||
      w.circleName.toLowerCase().includes(lower)
  );
  return { works: mock, source: "mock" };
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
        let related: Work[] = [];

        if (/^\d+$/.test(work.circleId)) {
          try {
            const [makerItems, gameItems] = await Promise.allSettled([
              fetchItemsByMaker(work.circleId, 12),
              fetchDoujinGameItems(12, 1),
            ]);

            const makerWorks =
              makerItems.status === "fulfilled"
                ? parseResponse(makerItems.value)
                : [];
            const gameWorks =
              gameItems.status === "fulfilled"
                ? parseResponse(gameItems.value).filter(
                    (w) => w.circleId === work.circleId
                  )
                : [];

            related = dedupeWorks(
              sortByDateDesc([...makerWorks, ...gameWorks])
            ).filter((w) => w.id !== work.id);
          } catch {
            related = [];
          }
        }

        return {
          work,
          relatedWorks: related.slice(0, 6),
          source: "dmm",
        };
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
      if (/^\d+$/.test(circleId)) {
        const [makerItems, gameItems] = await Promise.allSettled([
          fetchItemsByMaker(circleId, 40),
          fetchDoujinGameItems(40, 1),
        ]);

        const allWorks = dedupeWorks(
          sortByDateDesc([
            ...(makerItems.status === "fulfilled"
              ? parseResponse(makerItems.value)
              : []),
            ...(gameItems.status === "fulfilled"
              ? parseResponse(gameItems.value).filter(
                  (w) => w.circleId === circleId
                )
              : []),
          ])
        );

        if (allWorks.length > 0) {
          const circle = buildCircleFromWorks(circleId, allWorks);
          if (circle) {
            return {
              circle,
              works: allWorks,
              featured: allWorks[0],
              source: "dmm",
            };
          }
        }
      }

      const results = await Promise.allSettled([
        fetchDoujinMangaItems(40, 1),
        fetchDoujinVoiceItems(40, 1),
        fetchDoujinCgItems(40, 1),
        fetchDoujinGameItems(20, 1),
      ]);

      const allWorks = dedupeWorks(
        sortByDateDesc(
          results.flatMap((result) =>
            result.status === "fulfilled" ? parseResponse(result.value) : []
          )
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
