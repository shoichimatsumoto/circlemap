import { getSiteUrl, SITE_NAME } from "@/lib/site";
import type { Circle, Work } from "@/lib/types";
import { formatPrice, MEDIA_NAMES } from "@/lib/types";

function mediaBreakdown(circle: Circle): string {
  const parts: string[] = [];
  if (circle.mangaCount > 0) parts.push(`漫画${circle.mangaCount}`);
  if (circle.cgCount > 0) parts.push(`CG${circle.cgCount}`);
  if (circle.voiceCount > 0) parts.push(`音声${circle.voiceCount}`);
  if (circle.gameCount > 0) parts.push(`ゲーム${circle.gameCount}`);
  if (circle.aiCount > 0) parts.push(`AI${circle.aiCount}`);
  return parts.join("・");
}

/** 作品ページの title（layout の template で | CircleMap が付く） */
export function buildWorkSeoTitle(work: Work): string {
  // FANZA直と並んだとき「サークルまとめ」だと分かるようにする
  return `${work.title}｜${work.circleName}の作品まとめ（${MEDIA_NAMES[work.mediaType]}）`;
}

/** 作品ページの description（検索向け・160字前後） */
export function buildWorkSeoDescription(work: Work): string {
  const media = MEDIA_NAMES[work.mediaType];
  const chunks: string[] = [
    `${work.circleName}の${media}「${work.title}」をCircleMapで紹介`,
    "FANZAでは別フロアに散らばる同サークルの漫画・CG・音声・ゲーム・AIを1ページで横断できます",
  ];

  if (work.price > 0) {
    chunks.push(`${formatPrice(work.price)}（税込）`);
  }
  if (work.date && work.date !== "—") {
    chunks.push(`${work.date}発売`);
  }

  const tags = work.tags
    .filter((t) => !["男性向け", "成人向け", "専売", "同人"].includes(t))
    .slice(0, 3);
  if (tags.length > 0) {
    chunks.push(tags.join("、"));
  }

  return chunks.join("。").slice(0, 160);
}

/** サークルページの title */
export function buildCircleSeoTitle(circle: Circle): string {
  return `${circle.name}｜同人サークル作品まとめ（全媒体）`;
}

/** サークルページの description */
export function buildCircleSeoDescription(circle: Circle): string {
  const breakdown = mediaBreakdown(circle);
  const chunks = [
    `${circle.name}の同人作品をCircleMapでサークル単位にまとめ`,
    breakdown ? `内訳：${breakdown}` : `全${circle.workCount}件`,
    circle.latestDate !== "—" ? `最新作 ${circle.latestDate}` : "",
    "FANZAの漫画・CG・音声・ゲーム・AIを横断して探せます",
  ].filter(Boolean);

  return chunks.join("。").slice(0, 160);
}

/** 作品ページ用 JSON-LD（Product ではなく CreativeWork：レビュー未所持のアフィリエイト紹介向け） */
export function buildWorkJsonLd(work: Work) {
  const pageUrl = `${getSiteUrl()}/work/${work.id}`;
  const datePublished =
    work.date && work.date !== "—"
      ? work.date.replace(/\//g, "-")
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    description: buildWorkSeoDescription(work),
    url: pageUrl,
    image: work.thumbnailUrl ?? undefined,
    author: {
      "@type": "Organization",
      name: work.circleName,
    },
    genre: work.tags.length > 0 ? work.tags.slice(0, 6) : undefined,
    datePublished,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}

export function buildCircleJsonLd(circle: Circle) {
  const pageUrl = `${getSiteUrl()}/circle?id=${encodeURIComponent(circle.id)}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${circle.name}の作品一覧`,
    description: buildCircleSeoDescription(circle),
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
    about: {
      "@type": "Organization",
      name: circle.name,
    },
  };
}

export function buildWorkBreadcrumbJsonLd(work: Work) {
  const base = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: work.circleName,
        item: `${base}/circle?id=${encodeURIComponent(work.circleId)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: work.title,
        item: `${base}/work/${work.id}`,
      },
    ],
  };
}

export function buildCircleBreadcrumbJsonLd(circle: Circle) {
  const base = getSiteUrl();
  const pageUrl = `${base}/circle?id=${encodeURIComponent(circle.id)}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "サークル一覧",
        item: `${base}/circles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: circle.name,
        item: pageUrl,
      },
    ],
  };
}
