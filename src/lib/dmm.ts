import type { DmmSearchParams } from "@/lib/dmm-types";
import type { MediaType } from "@/lib/types";

const BASE = "https://api.dmm.com/affiliate/v3";

export type { DmmSearchParams };

function getCredentials() {
  const apiId = process.env.DMM_API_ID;
  const affiliateId = process.env.DMM_AFFILIATE_ID;

  if (!apiId || !affiliateId) {
    return null;
  }

  return { apiId, affiliateId };
}

export function hasDmmCredentials(): boolean {
  return getCredentials() !== null;
}

/** DMM ItemList API */
export async function searchDmmItems(params: DmmSearchParams) {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      "DMM_API_ID / DMM_AFFILIATE_ID が未設定です。.env.local を確認してください。"
    );
  }

  const url = new URL(`${BASE}/ItemList`);
  url.searchParams.set("api_id", creds.apiId);
  url.searchParams.set("affiliate_id", creds.affiliateId);
  url.searchParams.set("output", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `DMM API error: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`
    );
  }

  return res.json();
}

export async function fetchItemByContentId(cid: string) {
  return searchDmmItems({
    site: "FANZA",
    cid,
    hits: 1,
  });
}

export async function fetchDoujinMangaItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    hits: Math.min(hits * 4, 100),
    offset,
    sort: "date",
  });
}

export async function fetchPopularDoujinItems(hits = 40, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    hits: Math.min(hits, 100),
    offset,
    sort: "rank",
  });
}

export async function fetchDoujinVoiceItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    hits: Math.min(hits * 6, 100),
    offset,
    sort: "date",
  });
}

/** 音声作品をキーワードで追加取得（同期用） */
export async function fetchVoiceCatalogItems(hits = 100, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    keyword: "ボイス",
    hits: Math.min(hits, 100),
    offset,
    sort: "date",
  });
}

export async function fetchDoujinCgItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    hits: Math.min(hits * 6, 100),
    offset,
    sort: "date",
  });
}

/** CG・イラスト集をキーワードで追加取得（同期用） */
export async function fetchCgCatalogItems(hits = 100, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    keyword: "CG",
    hits: Math.min(hits, 100),
    offset,
    sort: "date",
  });
}

export async function fetchDoujinGameItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "pcgame",
    floor: "digital_pcgame",
    hits,
    offset,
    sort: "date",
  });
}

export async function fetchItemsByMaker(makerId: string, hits = 12) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    article: "maker",
    article_id: makerId,
    hits,
    sort: "date",
  });
}

export async function searchByKeyword(keyword: string, hits = 24) {
  const [doujin, games] = await Promise.allSettled([
    searchDmmItems({
      site: "FANZA",
      service: "doujin",
      floor: "digital_doujin",
      keyword,
      hits,
      sort: "rank",
    }),
    searchDmmItems({
      site: "FANZA",
      service: "pcgame",
      floor: "digital_pcgame",
      keyword,
      hits: Math.min(hits, 12),
      sort: "rank",
    }),
  ]);

  const items = [
    ...(doujin.status === "fulfilled" ? doujin.value?.result?.items ?? [] : []),
    ...(games.status === "fulfilled" ? games.value?.result?.items ?? [] : []),
  ];

  return {
    result: {
      status: 200,
      result_count: items.length,
      total_count: items.length,
      first_position: 1,
      items,
    },
  };
}

export const MEDIA_FETCHERS: Record<
  MediaType,
  (hits: number, offset: number) => ReturnType<typeof searchDmmItems>
> = {
  manga: fetchDoujinMangaItems,
  voice: fetchDoujinVoiceItems,
  cg: fetchDoujinCgItems,
  game: fetchDoujinGameItems,
};
