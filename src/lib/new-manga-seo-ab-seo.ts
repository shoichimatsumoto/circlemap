/**
 * 新規漫画SEO A/Bのページ出力。
 * group が A で、旧50件パイロットでないときだけ title / meta / 分析を強化する。
 * B と null は buildWorkSeoTitle / buildWorkSeoDescription のまま。
 * FANZA公式コメントは title / meta に使わない。
 */
import { buildWorkSeoDescription, buildWorkSeoTitle } from "@/lib/seo";
import { formatPrice, type Work } from "@/lib/types";
import type { NewMangaSeoAbGroup } from "@/lib/new-manga-seo-ab";
import type { WorkAnalysis } from "@/lib/work-analysis";

export function shouldShowAnalysisSection(
  group: NewMangaSeoAbGroup | null,
  legacyPilot: boolean
): boolean {
  if (legacyPilot) return true;
  return group === "A";
}

export function resolveWorkPageSeo(
  work: Work,
  group: NewMangaSeoAbGroup | null,
  analysis: WorkAnalysis | null,
  legacyPilot: boolean
): { title: string; description: string; enhanced: boolean } {
  const baseline = {
    title: buildWorkSeoTitle(work),
    description: buildWorkSeoDescription(work),
    enhanced: false,
  };
  if (group !== "A" || legacyPilot || !analysis) return baseline;
  return {
    title: buildGroupAWorkSeoTitle(work, analysis),
    description: buildGroupAWorkSeoDescription(work, analysis),
    enhanced: true,
  };
}

export function buildGroupAWorkSeoTitle(work: Work, analysis: WorkAnalysis): string {
  const facts = [`発売${analysis.circleReleaseRank}番目`];
  if (analysis.circlePriceRank != null) {
    facts.push(`価格${analysis.circlePriceRank}位`);
  }
  const tag = analysis.topTags[0]?.tag;
  if (tag) facts.push(tag);
  return `${work.title}｜${work.circleName} ${facts.join("・")}`;
}

export function buildGroupAWorkSeoDescription(
  work: Work,
  analysis: WorkAnalysis
): string {
  const parts = [
    `「${work.title}」は「${work.circleName}」の${analysis.circleWorkCount}作品中、発売が新しい順で${analysis.circleReleaseRank}番目`,
  ];
  if (analysis.circlePriceRank != null) {
    parts.push(`安い順で${analysis.circlePriceRank}位`);
  }
  if (
    analysis.workPrice > 0 &&
    analysis.circleAveragePrice > 0 &&
    analysis.priceDiffFromAvg != null
  ) {
    const diff = analysis.priceDiffFromAvg;
    const compared =
      diff === 0
        ? "平均価格と同じ"
        : diff < 0
          ? `平均より${formatPrice(Math.abs(diff))}安い`
          : `平均より${formatPrice(diff)}高い`;
    parts.push(`${formatPrice(analysis.workPrice)}で${compared}`);
  }
  if (analysis.circleMinPrice > 0 && analysis.circleMaxPrice > 0) {
    parts.push(
      `価格帯は${formatPrice(analysis.circleMinPrice)}〜${formatPrice(analysis.circleMaxPrice)}`
    );
  }
  if (analysis.topTags.length > 0) {
    parts.push(
      `多いタグは${analysis.topTags
        .slice(0, 3)
        .map((tag) => tag.tag)
        .join("、")}`
    );
  }
  parts.push("CircleMapの登録作品から算出した比較");
  return parts.join("。").slice(0, 160);
}
