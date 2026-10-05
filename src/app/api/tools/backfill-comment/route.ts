import { NextResponse } from "next/server";
import {
  extractFanzaWorkComment,
  fetchFanzaWorkComment,
  fanzaDoujinDetailUrl,
} from "@/lib/fanza-comment";
import { isUsefulWorkDescription } from "@/lib/dmm-transform";
import { dbGetWork } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const syncSecret = process.env.SYNC_SECRET;
  if (!syncSecret) return false;
  return request.headers.get("authorization") === `Bearer ${syncSecret}`;
}

/** 作品コメント補完の診断・手動バックフィル */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cid = url.searchParams.get("cid")?.trim();
  if (!cid) {
    return NextResponse.json({ ok: false, message: "cid required" }, { status: 400 });
  }

  const dbWork = await dbGetWork(cid);
  const detailUrl = fanzaDoujinDetailUrl(cid);

  let fetchStatus = 0;
  let htmlLen = 0;
  let extractLen = 0;
  let fetchError: string | undefined;
  let scraped: string | undefined;

  try {
    const res = await fetch(detailUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CircleMapBot/1.0; +https://www.circlemap.jp)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.8",
        Cookie: "age_check_done=1",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    fetchStatus = res.status;
    const html = await res.text();
    htmlLen = html.length;
    const extracted = extractFanzaWorkComment(html);
    extractLen = extracted?.length ?? 0;
    scraped = await fetchFanzaWorkComment(cid);
  } catch (error) {
    fetchError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({
    ok: true,
    cid,
    detailUrl,
    dbDescriptionUseful: isUsefulWorkDescription(dbWork?.description),
    dbDescriptionLen: dbWork?.description?.length ?? 0,
    fetchStatus,
    htmlLen,
    extractLen,
    scrapedUseful: isUsefulWorkDescription(scraped),
    scrapedLen: scraped?.length ?? 0,
    scrapedPreview: scraped?.slice(0, 120) ?? null,
    fetchError: fetchError ?? null,
  });
}
