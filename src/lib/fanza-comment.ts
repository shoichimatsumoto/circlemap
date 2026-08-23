import {
  cleanDmmComment,
  isUsefulWorkDescription,
} from "@/lib/dmm-transform";
import { createSupabaseServiceClient } from "@/lib/supabase";

const FANZA_UA =
  "Mozilla/5.0 (compatible; CircleMapBot/1.0; +https://www.circlemap.jp)";

/** 同人デジタル作品の詳細URL（cid ベース） */
export function fanzaDoujinDetailUrl(contentId: string): string {
  return `https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=${encodeURIComponent(contentId)}/`;
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
}

/**
 * FANZA同人詳細HTMLから「作品コメント」本文を抜く。
 * ItemList API の comment が空のときに使う。
 */
export function extractFanzaWorkComment(html: string): string | undefined {
  // 作品コメント見出し直後の summary__txt を優先
  const primary = html.match(
    /summary__ttl[^>]*>\s*作品コメント\s*<\/h3>[\s\S]*?<p class="summary__txt">([\s\S]*?)<\/p>/i
  );
  const rawHtml = primary?.[1];
  if (!rawHtml) {
    const fallback = html.match(
      /summary__ttl[^>]*>\s*作品コメント\s*<\/h3>([\s\S]*?)(?:l-areaPurchaseWrap|m-productSummary|id="review|<\/section>)/i
    );
    if (!fallback?.[1]) return undefined;
    return cleanExtractedComment(fallback[1]);
  }
  return cleanExtractedComment(rawHtml);
}

function cleanExtractedComment(htmlFragment: string): string | undefined {
  const raw = decodeBasicEntities(
    htmlFragment
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
  return cleanDmmComment(raw);
}

/** FANZA詳細ページを取得して作品コメントを返す（失敗時は undefined） */
export async function fetchFanzaWorkComment(
  contentId: string
): Promise<string | undefined> {
  if (!contentId.trim()) return undefined;

  try {
    const res = await fetch(fanzaDoujinDetailUrl(contentId), {
      headers: {
        "User-Agent": FANZA_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.8",
        Cookie: "age_check_done=1",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return undefined;
    const html = await res.text();
    const comment = extractFanzaWorkComment(html);
    return isUsefulWorkDescription(comment) ? comment : undefined;
  } catch (error) {
    console.error(
      "[CircleMap] FANZA comment fetch failed:",
      contentId,
      error instanceof Error ? error.message : error
    );
    return undefined;
  }
}

/** DBに作品コメントを保存（service role）。失敗しても表示は続ける */
export async function dbSaveWorkDescription(
  workId: string,
  description: string
): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("works")
    .update({
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workId);

  if (error) {
    console.error(
      "[CircleMap] dbSaveWorkDescription failed:",
      workId,
      error.message
    );
    return false;
  }
  return true;
}

/**
 * API/DBに無いときFANZA詳細から補完し、有用ならDBへ保存する。
 */
export async function resolveWorkDescription(options: {
  workId: string;
  dbDescription?: string;
  apiDescription?: string;
  persist?: boolean;
}): Promise<string | undefined> {
  const { workId, dbDescription, apiDescription, persist = true } = options;

  if (isUsefulWorkDescription(dbDescription)) return dbDescription!.trim();
  if (isUsefulWorkDescription(apiDescription)) return apiDescription!.trim();

  const scraped = await fetchFanzaWorkComment(workId);
  if (!scraped) {
    return dbDescription?.trim() || apiDescription?.trim() || undefined;
  }

  if (persist) {
    await dbSaveWorkDescription(workId, scraped);
  }
  return scraped;
}
