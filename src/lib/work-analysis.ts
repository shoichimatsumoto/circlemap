import { dbGetCircleWorks } from "@/lib/supabase-db";
import { formatPrice, MEDIA_NAMES, type Work } from "@/lib/types";

const SKIP_TAGS = new Set(["男性向け", "成人向け", "専売", "同人"]);

export type WorkAnalysisTagStat = {
  tag: string;
  count: number;
};

export type WorkAnalysis = {
  circleId: string;
  circleName: string;
  circleWorkCount: number;
  /** 1 = サークル内で最も新しい */
  circleReleaseRank: number;
  /** 1 = サークル内で最も安い（price>0 のみ。価格なしは null） */
  circlePriceRank: number | null;
  circleAveragePrice: number;
  circleMinPrice: number;
  circleMaxPrice: number;
  workPrice: number;
  priceDiffFromAvg: number | null;
  topTags: WorkAnalysisTagStat[];
  recentTopTags: WorkAnalysisTagStat[];
  recentSampleSize: number;
  circlePopularWorks: Work[];
  similarWorks: Work[];
  /** 事実ベースの定型文のみ */
  paragraphs: string[];
};

function usableTags(tags: string[]): string[] {
  return tags.filter((t) => t && !SKIP_TAGS.has(t));
}

function countTags(works: Work[], limit: number): WorkAnalysisTagStat[] {
  const map = new Map<string, number>();
  for (const work of works) {
    for (const tag of usableTags(work.tags)) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"))
    .slice(0, limit);
}

function similarityScore(a: Work, b: Work): number {
  const tagsA = new Set(usableTags(a.tags));
  const tagsB = usableTags(b.tags);
  let shared = 0;
  for (const t of tagsB) {
    if (tagsA.has(t)) shared++;
  }
  let score = shared * 3;
  if (a.mediaType === b.mediaType) score += 2;
  if (a.circleId === b.circleId) score += 2;
  if (a.price > 0 && b.price > 0 && Math.abs(a.price - b.price) <= 500) {
    score += 1;
  }
  return score;
}

function buildParagraphs(work: Work, analysis: Omit<WorkAnalysis, "paragraphs">): string[] {
  const lines: string[] = [];
  const { circleName, circleWorkCount } = analysis;

  if (circleWorkCount > 0) {
    lines.push(
      `CircleMapには「${circleName}」の作品が${circleWorkCount}件登録されています。本作品はそのうち発売日が新しい順で${analysis.circleReleaseRank}番目です。`
    );
  }

  if (analysis.topTags.length > 0) {
    const top = analysis.topTags
      .slice(0, 3)
      .map((t) => `「${t.tag}」（${t.count}件）`)
      .join("、");
    lines.push(`このサークルで多く付いているタグは ${top} です。`);
  }

  if (analysis.recentSampleSize > 0 && analysis.recentTopTags[0]) {
    const top = analysis.recentTopTags[0];
    const recentWith = analysis.recentTopTags.length
      ? // recount from recentTopTags[0] already has count within recent sample
        top.count
      : 0;
    lines.push(
      `直近${analysis.recentSampleSize}作品のうち、${recentWith}作品に「${top.tag}」タグが含まれています。`
    );
  }

  if (
    analysis.workPrice > 0 &&
    analysis.circleAveragePrice > 0 &&
    analysis.priceDiffFromAvg != null
  ) {
    const diff = analysis.priceDiffFromAvg;
    const abs = Math.abs(diff);
    if (diff === 0) {
      lines.push(
        `本作品の価格は${formatPrice(analysis.workPrice)}で、このサークルの平均価格${formatPrice(analysis.circleAveragePrice)}と同じです。`
      );
    } else if (diff < 0) {
      lines.push(
        `本作品の価格は${formatPrice(analysis.workPrice)}で、このサークルの平均価格${formatPrice(analysis.circleAveragePrice)}より${formatPrice(abs)}低く設定されています。`
      );
    } else {
      lines.push(
        `本作品の価格は${formatPrice(analysis.workPrice)}で、このサークルの平均価格${formatPrice(analysis.circleAveragePrice)}より${formatPrice(abs)}高く設定されています。`
      );
    }
  }

  if (analysis.circlePriceRank != null && circleWorkCount > 1) {
    lines.push(
      `価格の安い順では、サークル内${circleWorkCount}作品中${analysis.circlePriceRank}番目です。`
    );
  }

  lines.push(
    `形式は${MEDIA_NAMES[work.mediaType]}です。関連作品・同サークル作品へのリンクから、CircleMap内で横断して確認できます。`
  );

  return lines;
}

/**
 * 同サークル works を集計して CircleMap 分析を作る。
 * 2タグ横断人気は初期実装に含めない。
 */
export function buildWorkAnalysisFromCircleWorks(
  work: Work,
  circleWorks: Work[]
): WorkAnalysis | null {
  const all = circleWorks.some((w) => w.id === work.id)
    ? circleWorks
    : [work, ...circleWorks];

  if (all.length === 0) return null;

  const byDateDesc = [...all].sort((a, b) => b.date.localeCompare(a.date));
  const releaseIdx = byDateDesc.findIndex((w) => w.id === work.id);
  const circleReleaseRank = releaseIdx >= 0 ? releaseIdx + 1 : all.length;

  const priced = all.filter((w) => w.price > 0);
  const prices = priced.map((w) => w.price);
  const circleAveragePrice =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;
  const circleMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const circleMaxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  let circlePriceRank: number | null = null;
  if (work.price > 0 && priced.length > 0) {
    const byPriceAsc = [...priced].sort(
      (a, b) => a.price - b.price || b.date.localeCompare(a.date)
    );
    const idx = byPriceAsc.findIndex((w) => w.id === work.id);
    circlePriceRank = idx >= 0 ? idx + 1 : null;
  }

  const priceDiffFromAvg =
    work.price > 0 && circleAveragePrice > 0
      ? work.price - circleAveragePrice
      : null;

  const recentSampleSize = Math.min(5, byDateDesc.length);
  const recent = byDateDesc.slice(0, recentSampleSize);

  const circlePopularWorks = [...all]
    .filter((w) => w.id !== work.id)
    .sort((a, b) => {
      const ar = a.popularityRank ?? Number.POSITIVE_INFINITY;
      const br = b.popularityRank ?? Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
      return b.date.localeCompare(a.date);
    })
    .slice(0, 5);

  const similarWorks = [...all]
    .filter((w) => w.id !== work.id)
    .map((w) => ({ work: w, score: similarityScore(work, w) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.work.date.localeCompare(a.work.date)
    )
    .slice(0, 6)
    .map((x) => x.work);

  const base = {
    circleId: work.circleId,
    circleName: work.circleName,
    circleWorkCount: all.length,
    circleReleaseRank,
    circlePriceRank,
    circleAveragePrice,
    circleMinPrice,
    circleMaxPrice,
    workPrice: work.price,
    priceDiffFromAvg,
    topTags: countTags(all, 5),
    recentTopTags: countTags(recent, 3),
    recentSampleSize,
    circlePopularWorks,
    similarWorks,
  };

  return {
    ...base,
    paragraphs: buildParagraphs(work, base),
  };
}

export async function getWorkAnalysis(
  work: Work
): Promise<WorkAnalysis | null> {
  try {
    const circleWorks = await dbGetCircleWorks(work.circleId);
    return buildWorkAnalysisFromCircleWorks(work, circleWorks);
  } catch (error) {
    console.error(
      "[CircleMap] getWorkAnalysis failed:",
      work.id,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
