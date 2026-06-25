import { getSiteUrl, SITE_NAME } from "@/lib/site";
import type { Circle, MediaType, Work } from "@/lib/types";
import { MEDIA_NAMES } from "@/lib/types";

export type XPostType = "popular" | "circle" | "weekly";

export type XPostDraft = {
  /** 本文（URLなし・拡散向け） */
  text: string;
  /** 自分で最初のリプライに貼るリンク集 */
  reply: string;
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

/** 人気作品 TOP3 */
export function buildPopularPost(works: Work[]): XPostDraft {
  const site = getSiteUrl();
  const top = works.slice(0, 3);

  if (top.length === 0) {
    return {
      text: `${SITE_NAME} — 人気作品データを取得できませんでした。`,
      reply: site,
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
  }
}
