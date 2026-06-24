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
import {
  dbGetCircle,
  dbGetCircleWorks,
  dbGetCircles,
  dbGetLatestWorks,
  dbGetPopularWorks,
  dbGetRelatedWorks,
  dbGetTopCircle,
  dbGetWork,
  dbGetWorksByMedia,
  dbHasData,
  dbSearchWorks,
} from "@/lib/supabase-db";
import type { Circle, DataSource, MediaType, Work } from "@/lib/types";

function parseResponse(json: unknown): Work[] {
  const data = json as DmmItemListResponse;
  if (!data?.result?.items?.length) return [];
  return dmmItemsToWorks(data.result.items);
}

function sortByDateDesc(works: Work[]): Work[] {
  return [...works].sort((a, b) => b.date.localeCompare(a.date));
}

async function enrichWorkWithSampleImages(
  work: Work,
  id: string
): Promise<Work> {
  if (work.sampleImages && work.sampleImages.length > 0) {
    return work;
  }

  if (!hasDmmCredentials()) {
    return work;
  }

  try {
    const json = await fetchItemByContentId(id);
    const dmmWork = parseResponse(json)[0];
    if (!dmmWork?.sampleImages?.length) {
      return work;
    }

    return {
      ...work,
      sampleImages: dmmWork.sampleImages,
      thumbnailUrl: work.thumbnailUrl ?? dmmWork.thumbnailUrl,
    };
  } catch {
    return work;
  }
}

function paginate<T>(items: T[], limit: number): { items: T[]; hasMore: boolean } {
  return { items, hasMore: items.length === limit };
}

export async function getLatestWorks(
  limit = 8,
  offset = 0
): Promise<{
  works: Work[];
  hasMore: boolean;
  source: DataSource;
}> {
  try {
    const dbWorks = await dbGetLatestWorks(limit, "manga", offset);
    if (dbWorks.length > 0 || offset > 0) {
      return { ...paginate(dbWorks, limit), works: dbWorks, source: "supabase" };
    }
  } catch (error) {
    console.error("[CircleMap] Supabase fetch failed:", error);
  }

  if (hasDmmCredentials()) {
    try {
      const manga = await fetchDoujinMangaItems(offset + limit + 12, offset + 1);
      const works = sortByDateDesc(
        filterWorksByMedia(parseResponse(manga), "manga")
      ).slice(0, limit);

      if (works.length > 0) {
        return { ...paginate(works, limit), works, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM fetch failed, using mock:", error);
    }
  }

  const works = DEMO_WORKS.slice(offset, offset + limit);
  return { ...paginate(works, limit), works, source: "mock" };
}

export async function getPopularWorks(
  limit = 12,
  offset = 0
): Promise<{
  works: Work[];
  hasMore: boolean;
  source: DataSource;
}> {
  try {
    const dbWorks = await dbGetPopularWorks(limit, offset);
    if (dbWorks.length > 0 || offset > 0) {
      return { ...paginate(dbWorks, limit), works: dbWorks, source: "supabase" };
    }
  } catch (error) {
    console.error("[CircleMap] Supabase popular fetch failed:", error);
  }

  if (hasDmmCredentials()) {
    try {
      const json = await fetchPopularDoujinItems(limit, offset + 1);
      const works = dedupeWorks(parseResponse(json)).slice(0, limit);

      if (works.length > 0) {
        return { ...paginate(works, limit), works, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM popular fetch failed:", error);
    }
  }

  const works = DEMO_WORKS.slice(offset, offset + limit);
  return { ...paginate(works, limit), works, source: "mock" };
}

type CircleSort = "popular" | "name";

function collectCirclesFromWorks(
  works: Work[],
  limit: number,
  sort: CircleSort = "popular"
): Circle[] {
  const grouped = new Map<string, Work[]>();
  for (const work of works) {
    const list = grouped.get(work.circleId) ?? [];
    list.push(work);
    grouped.set(work.circleId, list);
  }

  const circles = [...grouped.entries()]
    .map(([id, circleWorks]) => buildCircleFromWorks(id, circleWorks))
    .filter((circle): circle is Circle => circle !== null);

  const sorted =
    sort === "name"
      ? [...circles].sort((a, b) => a.name.localeCompare(b.name, "ja"))
      : [...circles].sort((a, b) => {
          if (b.workCount !== a.workCount) {
            return b.workCount - a.workCount;
          }
          return b.latestDate.localeCompare(a.latestDate);
        });

  return sorted.slice(0, limit);
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

export async function getDiscoverableCircles(
  limit = 50,
  sort: CircleSort = "name",
  offset = 0
): Promise<{
  circles: Circle[];
  hasMore: boolean;
  source: DataSource;
}> {
  try {
    const circles = await dbGetCircles(limit, sort, offset);
    if (circles.length > 0 || offset > 0) {
      return { ...paginate(circles, limit), circles, source: "supabase" };
    }
  } catch (error) {
    console.error("[CircleMap] Supabase discover circles failed:", error);
  }

  if (hasDmmCredentials()) {
    try {
      const works = await fetchWorksForCircleDiscovery();
      const circles = collectCirclesFromWorks(
        works,
        offset + limit,
        sort
      ).slice(offset, offset + limit);

      if (circles.length > 0) {
        return { ...paginate(circles, limit), circles, source: "dmm" };
      }
    } catch (error) {
      console.error("[CircleMap] DMM discover circles failed:", error);
    }
  }

  const circles = offset === 0 ? [DEMO_CIRCLE] : [];
  return { ...paginate(circles, limit), circles, source: "mock" };
}

export async function getPopularCircles(
  limit = 8,
  offset = 0
): Promise<{
  circles: Circle[];
  hasMore: boolean;
  source: DataSource;
}> {
  return getDiscoverableCircles(limit, "popular", offset);
}

export async function getWorksByMedia(
  mediaType: MediaType,
  limit = 24,
  offset = 0
): Promise<{ works: Work[]; hasMore: boolean; source: DataSource }> {
  try {
    const dbWorks = await dbGetWorksByMedia(mediaType, limit, offset);
    if (dbWorks.length > 0 || offset > 0) {
      return { ...paginate(dbWorks, limit), works: dbWorks, source: "supabase" };
    }
  } catch (error) {
    console.error(`[CircleMap] Supabase ${mediaType} fetch failed:`, error);
  }

  if (hasDmmCredentials()) {
    try {
      const json = await MEDIA_FETCHERS[mediaType](limit, offset + 1);
      const works = sortByDateDesc(
        filterWorksByMedia(parseResponse(json), mediaType)
      ).slice(0, limit);

      if (works.length > 0) {
        return { ...paginate(works, limit), works, source: "dmm" };
      }
    } catch (error) {
      console.error(`[CircleMap] DMM ${mediaType} fetch failed:`, error);
    }
  }

  const filtered = DEMO_WORKS.filter((w) => w.mediaType === mediaType);
  const pool = filtered.length > 0 ? filtered : DEMO_WORKS;
  const works = pool.slice(offset, offset + limit);
  return { ...paginate(works, limit), works, source: "mock" };
}

export async function searchWorks(
  keyword: string,
  limit = 24,
  offset = 0
): Promise<{ works: Work[]; hasMore: boolean; source: DataSource }> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { works: [], hasMore: false, source: "mock" };
  }

  try {
    const dbWorks = await dbSearchWorks(trimmed, limit, offset);
    if (dbWorks.length > 0 || offset > 0) {
      return { ...paginate(dbWorks, limit), works: dbWorks, source: "supabase" };
    }
  } catch (error) {
    console.error("[CircleMap] Supabase search failed:", error);
  }

  if (hasDmmCredentials()) {
    try {
      const json = await searchByKeyword(trimmed, limit);
      const works = dedupeWorks(sortByDateDesc(parseResponse(json))).slice(
        offset,
        offset + limit
      );

      if (works.length > 0) {
        return { ...paginate(works, limit), works, source: "dmm" };
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
  const works = mock.slice(offset, offset + limit);
  return { ...paginate(works, limit), works, source: "mock" };
}

export async function getWork(id: string): Promise<{
  work: Work | null;
  relatedWorks: Work[];
  source: DataSource;
}> {
  try {
    const work = await dbGetWork(id);
    if (work) {
      const enriched = await enrichWorkWithSampleImages(work, id);
      const relatedWorks = await dbGetRelatedWorks(enriched.circleId, enriched.id, 6);
      return { work: enriched, relatedWorks, source: "supabase" };
    }
  } catch (error) {
    console.error("[CircleMap] Supabase work fetch failed:", error);
  }

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
  try {
    const resolvedId =
      circleId === "demo" || circleId === DEMO_CIRCLE.id ? null : circleId;

    if (resolvedId) {
      const [circle, works] = await Promise.all([
        dbGetCircle(resolvedId),
        dbGetCircleWorks(resolvedId),
      ]);

      if (circle && works.length > 0) {
        return {
          circle,
          works,
          featured: works[0],
          source: "supabase",
        };
      }
    } else {
      const topCircle = await dbGetTopCircle();
      if (topCircle) {
        const works = await dbGetCircleWorks(topCircle.id);
        if (works.length > 0) {
          return {
            circle: topCircle,
            works,
            featured: works[0],
            source: "supabase",
          };
        }
      }
    }
  } catch (error) {
    console.error("[CircleMap] Supabase circle fetch failed:", error);
  }

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

export async function getDataMode(): Promise<{
  hasCredentials: boolean;
  hasSupabaseData: boolean;
  mode: DataSource;
}> {
  const hasCredentials = hasDmmCredentials();
  let hasSupabaseData = false;

  try {
    hasSupabaseData = await dbHasData();
  } catch {
    hasSupabaseData = false;
  }

  return {
    hasCredentials,
    hasSupabaseData,
    mode: hasSupabaseData ? "supabase" : hasCredentials ? "dmm" : "mock",
  };
}
