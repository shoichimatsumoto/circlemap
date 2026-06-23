import type { DmmSearchParams } from "@/lib/dmm-types";

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
    throw new Error(`DMM API error: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
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

export async function fetchDoujinVoiceItems(hits = 20, offset = 1) {
  // 同人音声（FloorList準拠: service=doujin, floor=voice）
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "voice",
    hits,
    offset,
    sort: "date",
  });
}

export async function fetchDoujinMangaItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_doujin",
    hits,
    offset,
    sort: "date",
  });
}

export async function fetchDoujinCgItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_cg",
    hits,
    offset,
    sort: "date",
  });
}

export async function fetchDoujinGameItems(hits = 20, offset = 1) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    floor: "digital_pcgame",
    hits,
    offset,
    sort: "date",
  });
}

export async function searchByKeyword(keyword: string, hits = 20) {
  return searchDmmItems({
    site: "FANZA",
    service: "doujin",
    keyword,
    hits,
    sort: "rank",
  });
}
