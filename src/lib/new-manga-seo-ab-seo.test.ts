import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkJsonLd, buildWorkSeoDescription, buildWorkSeoTitle } from "./seo";
import {
  buildGroupAWorkSeoDescription,
  buildGroupAWorkSeoTitle,
  resolveWorkPageSeo,
  shouldShowAnalysisSection,
} from "./new-manga-seo-ab-seo";
import type { Work } from "./types";
import type { WorkAnalysis } from "./work-analysis";

const FANZA = "FANZA公式の紹介文です。この文章はtitleにもmetaにも出さない。";

const work: Work = {
  id: "d_new",
  title: "サンプル作品",
  mediaType: "manga",
  price: 880,
  date: "2026/10/01",
  tags: ["人妻", "男性向け"],
  circleId: "c1",
  circleName: "テストサークル",
  description: FANZA,
};

function analysis(patch: Partial<WorkAnalysis> = {}): WorkAnalysis {
  return {
    circleId: "c1",
    circleName: "テストサークル",
    circleWorkCount: 10,
    circleReleaseRank: 2,
    circlePriceRank: 4,
    circleAveragePrice: 1000,
    circleMinPrice: 500,
    circleMaxPrice: 1500,
    workPrice: 880,
    priceDiffFromAvg: -120,
    topTags: [
      { tag: "人妻", count: 6 },
      { tag: "寝取られ", count: 3 },
    ],
    recentTopTags: [{ tag: "人妻", count: 2 }],
    recentSampleSize: 5,
    circlePopularWorks: [],
    similarWorks: [],
    paragraphs: ["CircleMapの分析本文"],
    ...patch,
  };
}

test("B と null と旧50件は通常の title / meta のまま", () => {
  const facts = analysis();
  for (const group of ["B", null] as const) {
    const seo = resolveWorkPageSeo(work, group, facts, false);
    assert.equal(seo.enhanced, false);
    assert.equal(seo.title, buildWorkSeoTitle(work));
    assert.equal(seo.description, buildWorkSeoDescription(work));
  }

  const legacy = resolveWorkPageSeo(work, "A", facts, true);
  assert.equal(legacy.enhanced, false);
  assert.equal(legacy.title, buildWorkSeoTitle(work));
  assert.equal(legacy.description, buildWorkSeoDescription(work));
});

test("A群だけ独自titleとmetaになり、公式コメントは入らない", () => {
  const facts = analysis();
  const seo = resolveWorkPageSeo(work, "A", facts, false);

  assert.equal(seo.enhanced, true);
  assert.equal(seo.title, buildGroupAWorkSeoTitle(work, facts));
  assert.equal(seo.description, buildGroupAWorkSeoDescription(work, facts));
  assert.notEqual(seo.title, buildWorkSeoTitle(work));
  assert.notEqual(seo.description, buildWorkSeoDescription(work));
  assert.match(seo.title, /テストサークル/);
  assert.match(seo.title, /発売2番目/);
  assert.match(seo.title, /価格4位/);
  assert.match(seo.title, /人妻/);
  assert.match(seo.description, /新しい順で2番目/);
  assert.match(seo.description, /安い順で4位/);
  assert.match(seo.description, /平均より/);
  assert.match(seo.description, /価格帯は/);
  assert.match(seo.description, /多いタグは人妻、寝取られ/);
  assert.equal(seo.title.includes(FANZA), false);
  assert.equal(seo.description.includes(FANZA), false);
  assert.equal(seo.description.length <= 160, true);
});

test("A群でも分析が無ければ通常仕様に戻す", () => {
  const seo = resolveWorkPageSeo(work, "A", null, false);
  assert.equal(seo.enhanced, false);
  assert.equal(seo.title, buildWorkSeoTitle(work));
});

test("分析表示は旧50件か新規A群だけ", () => {
  assert.equal(shouldShowAnalysisSection(null, false), false);
  assert.equal(shouldShowAnalysisSection("B", false), false);
  assert.equal(shouldShowAnalysisSection("A", false), true);
  assert.equal(shouldShowAnalysisSection(null, true), true);
  assert.equal(shouldShowAnalysisSection("B", true), true);
  assert.equal(shouldShowAnalysisSection("A", true), true);
});

test("B群のJSON-LD descriptionは従来関数のまま", () => {
  const baseline = buildWorkJsonLd(work);
  const data = buildWorkJsonLd(work);
  assert.equal(data.description, baseline.description);
  assert.equal(data.description.includes(FANZA), false);
  const enhanced = buildGroupAWorkSeoDescription(work, analysis());
  data.description = enhanced;
  assert.equal(data.description, enhanced);
  assert.notEqual(data.description, baseline.description);
});
