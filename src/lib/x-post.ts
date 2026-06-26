import { upgradeDmmImageUrl } from "@/lib/dmm-image";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import type { Circle, MediaType, Work } from "@/lib/types";
import { MEDIA_NAMES } from "@/lib/types";

export type XPostType = "popular" | "circle" | "weekly" | "buzz";

export type XPostImage = {
  workId: string;
  title: string;
  circleName: string;
  thumbnailUrl: string;
  /** X 投稿に添付するおすすめ（1枚目） */
  primary?: boolean;
};

export type XPostDraft = {
  /** 本文（URLなし・拡散向け） */
  text: string;
  /** 自分で最初のリプライに貼るリンク集 */
  reply: string;
  /** 投稿用サムネ（X に添付） */
  images: XPostImage[];
  /** サークル公式の @（X検索後にユーザーが記入） */
  mention?: string;
  /** 紹介サークル名（@ 検索用） */
  circleName?: string;
};

function workUrl(workId: string): string {
  return `${getSiteUrl()}/work/${workId}`;
}

function circleUrl(circleId: string): string {
  return `${getSiteUrl()}/circle?id=${encodeURIComponent(circleId)}`;
}

function mediaTag(type: MediaType): string {
  return MEDIA_NAMES[type];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function collectImages(works: Work[]): XPostImage[] {
  const images: XPostImage[] = [];

  for (const work of works) {
    if (!work.thumbnailUrl) continue;
    images.push({
      workId: work.id,
      title: work.title,
      circleName: work.circleName,
      thumbnailUrl: upgradeDmmImageUrl(work.thumbnailUrl),
      primary: images.length === 0,
    });
  }

  return images;
}

function countMediaTypes(circle: Circle): number {
  let count = 0;
  if (circle.mangaCount > 0) count++;
  if (circle.cgCount > 0) count++;
  if (circle.voiceCount > 0) count++;
  if (circle.gameCount > 0) count++;
  return count;
}

function mediaBreakdownShort(circle: Circle): string {
  const parts: string[] = [];
  if (circle.mangaCount > 0) parts.push(`漫画${circle.mangaCount}`);
  if (circle.cgCount > 0) parts.push(`CG${circle.cgCount}`);
  if (circle.voiceCount > 0) parts.push(`音声${circle.voiceCount}`);
  if (circle.gameCount > 0) parts.push(`ゲーム${circle.gameCount}`);
  return parts.join("・");
}

/** バズ向け：媒体が2種類以上のサークルを優先 */
export function pickBuzzCircle(circles: Circle[]): Circle | null {
  if (circles.length === 0) return null;

  const scored = circles
    .map((circle) => ({
      circle,
      score: countMediaTypes(circle) * 100 + Math.min(circle.workCount, 50),
    }))
    .filter((item) => item.score >= 200)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.circle ?? circles[0];
}

/** 豆知識・バズ寄り（週1回向け） */
export function buildBuzzPost(circle: Circle, works: Work[]): XPostDraft {
  const url = circleUrl(circle.id);
  const breakdown = mediaBreakdownShort(circle);
  const mediaTypes = countMediaTypes(circle);
  const featured = works[0];

  const lines =
    mediaTypes >= 3
      ? [
          "1サークルで複数媒体出してるやつ、他に知ってる？",
          "",
          `📌 ${circle.name}`,
          breakdown,
          "",
          "FANZAだとフロアがバラバラ。",
          "CircleMapだと1ページにまとまって見れる。",
        ]
      : [
          "【知ってた？】",
          "",
          "FANZAだと同人とゲームは別フロア。",
          "",
          `でも「${circle.name}」は`,
          breakdown,
          "",
          "→ CircleMap だと1ページで全部見れる",
        ];

  if (featured) {
    lines.push("", `代表作: ${truncate(featured.title, 32)}`);
  }

  return {
    text: lines.join("\n"),
    reply: url,
    images: collectImages(works.slice(0, 1)),
    mention: "@",
    circleName: circle.name,
  };
}

/** 人気作品 TOP3 */
export function buildPopularPost(works: Work[]): XPostDraft {
  const site = getSiteUrl();
  const top = works.slice(0, 3);

  if (top.length === 0) {
    return {
      text: `${SITE_NAME} — 人気作品データを取得できませんでした。`,
      reply: site,
      images: [],
    };
  }

  const lines = top.map((work, i) => {
    const title = truncate(work.title, 36);
    return `${i + 1}. ${title}\n   ${work.circleName} / ${mediaTag(work.mediaType)}`;
  });

  const linkLines = top.map(
    (work, i) => `${i + 1}. ${workUrl(work.id)}`
  );

  return {
    text: [`【${SITE_NAME}】FANZA同人 人気TOP3`, "", ...lines].join("\n"),
    reply: [...linkLines, "", `サークル軸で横断検索 → ${site}`].join("\n"),
    images: collectImages(top),
  };
}

/** 注目サークル紹介 */
export function buildCirclePost(circle: Circle, works: Work[]): XPostDraft {
  const url = circleUrl(circle.id);
  const picks = works.slice(0, 3);

  const workLines =
    picks.length > 0
      ? picks.map(
          (w) => `・${truncate(w.title, 28)}（${mediaTag(w.mediaType)}）`
        )
      : ["・作品一覧はサイトでチェック"];

  return {
    text: [
      `【${SITE_NAME}】注目サークル`,
      "",
      `📌 ${circle.name}`,
      `作品数 ${circle.workCount} / 漫画${circle.mangaCount} CG${circle.cgCount} 音声${circle.voiceCount} ゲーム${circle.gameCount}`,
      "",
      ...workLines,
    ].join("\n"),
    reply: url,
    images: collectImages(picks.length > 0 ? picks : works),
    mention: "@",
    circleName: circle.name,
  };
}

/** 週次まとめ（人気2 + 新着1） */
export function buildWeeklyPost(
  popular: Work[],
  latest: Work[]
): XPostDraft {
  const site = getSiteUrl();
  const picks = [...popular.slice(0, 2), ...latest.slice(0, 1)];

  const popLines = popular
    .slice(0, 2)
    .map(
      (w, i) => `人気${i + 1}. ${truncate(w.title, 30)}（${w.circleName}）`
    );
  const latLines = latest
    .slice(0, 1)
    .map((w) => `新着. ${truncate(w.title, 30)}（${w.circleName}）`);

  const linkLines = picks.map((w) => workUrl(w.id));

  return {
    text: [
      `【${SITE_NAME}】今週のピックアップ`,
      "",
      ...popLines,
      ...latLines,
    ].join("\n"),
    reply: [...linkLines, "", site].join("\n"),
    images: collectImages(picks),
  };
}

export function buildXPost(
  type: XPostType,
  data: {
    popular?: Work[];
    latest?: Work[];
    circle?: Circle;
    circleWorks?: Work[];
  }
): XPostDraft {
  switch (type) {
    case "popular":
      return buildPopularPost(data.popular ?? []);
    case "circle":
      if (!data.circle) {
        return buildPopularPost(data.popular ?? []);
      }
      return buildCirclePost(data.circle, data.circleWorks ?? []);
    case "weekly":
      return buildWeeklyPost(data.popular ?? [], data.latest ?? []);
    case "buzz":
      if (!data.circle) {
        return buildPopularPost(data.popular ?? []);
      }
      return buildBuzzPost(data.circle, data.circleWorks ?? []);
  }
}
