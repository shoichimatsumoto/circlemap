/**
 * 作品ページ「同じ系統の作品」用の系統タグ選定。
 * ルール: docs/related-by-tag-rules.md
 */

import type { Work } from "@/lib/types";

/** マッチに使わないタグ（属性・媒体・メタ） */
const EXCLUDE_TAGS = new Set([
  "男性向け",
  "女性向け",
  "成人向け",
  "専売",
  "同人",
  "マンガ",
  "漫画",
  "CG",
  "ボイス",
  "音声",
  "ゲーム",
  "イラスト・CG集",
  "動画・アニメーション",
  "3DCG",
  "音声付き",
  "デモ・体験版あり",
  "AI",
  "AI生成",
  "一部AI",
  "AI一部利用",
  "AI補助",
]);

/** 付与率が高く、他に候補があるときは後回しにするタグ */
const HIGH_FREQ_TAGS = new Set([
  "中出し",
  "巨乳",
  "フェラ",
  "おっぱい",
]);

export const RELATED_BY_TAG_FETCH = 24;
export const RELATED_BY_TAG_DISPLAY = 6;
export const RELATED_BY_TAG_MIN = 3;

function isExcludedTag(tag: string): boolean {
  if (EXCLUDE_TAGS.has(tag)) return true;
  // 「動画・アニメーション」系の名称ゆれ
  if (tag.includes("動画") && tag.includes("アニメ")) return true;
  return false;
}

/**
 * 除外後のタグから系統タグを最大2つ選ぶ。
 * 高頻度タグは後回し、同率なら元配列の先頭寄り。
 */
export function pickSystemTags(tags: string[], max = 2): string[] {
  const candidates = tags.filter((t) => t && !isExcludedTag(t));
  if (candidates.length === 0) return [];

  const ranked = candidates
    .map((tag, index) => ({
      tag,
      index,
      highFreq: HIGH_FREQ_TAGS.has(tag),
    }))
    .sort((a, b) => {
      if (a.highFreq !== b.highFreq) return a.highFreq ? 1 : -1;
      return a.index - b.index;
    });

  const picked: string[] = [];
  for (const row of ranked) {
    if (picked.includes(row.tag)) continue;
    picked.push(row.tag);
    if (picked.length >= max) break;
  }
  return picked;
}

export function relatedByTagHeading(systemTags: string[]): string {
  if (systemTags.length === 0) return "同じ系統の作品";
  if (systemTags.length === 1) return `同じ系統の作品（#${systemTags[0]}）`;
  return `同じ系統の作品（#${systemTags[0]}・#${systemTags[1]}）`;
}

/** 取得結果をルールどおりに絞る（別サークルはクエリ側、ここではサムネ・1サークル1件・件数） */
export function finalizeRelatedByTagWorks(works: Work[]): Work[] {
  const sorted = [...works].sort((a, b) => {
    const ar = a.popularityRank;
    const br = b.popularityRank;
    if (ar != null && br != null && ar !== br) return ar - br;
    if (ar != null && br == null) return -1;
    if (ar == null && br != null) return 1;
    return (b.date || "").localeCompare(a.date || "");
  });

  const seenCircles = new Set<string>();
  const out: Work[] = [];
  for (const work of sorted) {
    if (!work.thumbnailUrl) continue;
    if (seenCircles.has(work.circleId)) continue;
    seenCircles.add(work.circleId);
    out.push(work);
    if (out.length >= RELATED_BY_TAG_DISPLAY) break;
  }

  return out.length >= RELATED_BY_TAG_MIN ? out : [];
}
