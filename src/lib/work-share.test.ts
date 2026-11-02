import assert from "node:assert/strict";
import test from "node:test";
import type { Work } from "./types";
import {
  buildWorkShareDescription,
  buildWorkShareMetadata,
  resolveWorkShareImageUrl,
  toAbsoluteShareUrl,
} from "./work-share";

const site = "https://www.circlemap.jp";

function work(patch: Partial<Work> = {}): Work {
  return {
    id: "d_836306",
    title: "カッコウの日 托卵された妻 其の3",
    mediaType: "manga",
    price: 880,
    date: "2026/10/23",
    tags: ["人妻"],
    circleId: "c1",
    circleName: "ナナシノベル",
    thumbnailUrl:
      "https://doujin-assets.dmm.co.jp/digital/comic/d_836306/d_836306pl.jpg",
    description: "FANZA公式の紹介文。カードにも検索metaにも使わない。",
    ...patch,
  };
}

test("share description is a short CircleMap sentence", () => {
  const text = buildWorkShareDescription(work());
  assert.equal(
    text,
    "ナナシノベルの同人漫画。CircleMapでは同じサークルの過去作品もまとめて確認できます。"
  );
  assert.equal(text.includes("FANZA"), false);
  assert.equal(text.length <= 200, true);
});

test("external work image URL is kept as an absolute https URL", () => {
  const image =
    "https://doujin-assets.dmm.co.jp/digital/comic/d_836306/d_836306pl.jpg";
  assert.equal(toAbsoluteShareUrl(image, site), image);
  assert.equal(resolveWorkShareImageUrl(work(), site), image);
});

test("protocol-relative and site-relative image URLs become absolute", () => {
  assert.equal(
    toAbsoluteShareUrl("//cdn.example.com/a.jpg", site),
    "https://cdn.example.com/a.jpg"
  );
  assert.equal(
    toAbsoluteShareUrl("/images/work.jpg", site),
    "https://www.circlemap.jp/images/work.jpg"
  );
});

test("share metadata uses the work title, short description, and large image card", () => {
  const pageUrl = `${site}/work/d_836306`;
  const share = buildWorkShareMetadata(work(), pageUrl);

  assert.equal(share.twitter.card, "summary_large_image");
  assert.equal(share.twitter.title, "カッコウの日 托卵された妻 其の3");
  assert.equal(share.openGraph.title, share.twitter.title);
  assert.equal(share.openGraph.description, share.twitter.description);
  assert.equal(share.openGraph.url, pageUrl);
  assert.equal(share.openGraph.type, "article");
  assert.equal(share.imageUrl, work().thumbnailUrl);
  assert.equal(share.twitter.description?.includes("FANZA公式"), false);
});
