import { getSiteUrl, SITE_NAME } from "./site";
import { MEDIA_NAMES, type Work } from "./types";

const SHARE_DESCRIPTION_LIMIT = 200;

/**
 * X / OGP 用の短い説明。検索用 meta description とは別に出す。
 * FANZAの作品説明は使わない。
 */
export function buildWorkShareDescription(
  work: Pick<Work, "circleName" | "mediaType">
): string {
  const circle = work.circleName?.trim();
  const media = MEDIA_NAMES[work.mediaType];
  const subject = circle ? `${circle}の同人${media}` : `同人${media}`;
  const text = `${subject}。CircleMapでは同じサークルの過去作品もまとめて確認できます。`;
  return text.length <= SHARE_DESCRIPTION_LIMIT
    ? text
    : text.slice(0, SHARE_DESCRIPTION_LIMIT);
}

/** 相対URLやプロトコル相対URLを、Xが取得できる絶対URLにする。画像そのものは変えない。 */
export function toAbsoluteShareUrl(
  value: string | undefined,
  siteUrl: string
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  try {
    const url = new URL(withProtocol, ensureTrailingSlash(siteUrl));
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (url.protocol === "http:") url.protocol = "https:";
    return url.href;
  } catch {
    return undefined;
  }
}

/** 作品のメイン画像。保存済みURLをそのまま絶対URLにする。 */
export function resolveWorkShareImageUrl(
  work: Pick<Work, "thumbnailUrl" | "sampleImages">,
  siteUrl = getSiteUrl()
): string | undefined {
  const candidates = [work.thumbnailUrl, ...(work.sampleImages ?? [])];
  for (const candidate of candidates) {
    const absolute = toAbsoluteShareUrl(candidate, siteUrl);
    if (absolute) return absolute;
  }
  return undefined;
}

export function buildWorkShareMetadata(work: Work, pageUrl: string) {
  const title = work.title.trim() || work.title;
  const description = buildWorkShareDescription(work);
  const imageUrl = resolveWorkShareImageUrl(work);
  const imageType = imageUrl ? imageContentType(imageUrl) : undefined;
  const image = imageUrl
    ? {
        url: imageUrl,
        alt: title,
        ...(imageType ? { type: imageType } : {}),
      }
    : undefined;

  return {
    imageUrl,
    openGraph: {
      title,
      description,
      type: "article" as const,
      url: pageUrl,
      siteName: SITE_NAME,
      locale: "ja_JP",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function ensureTrailingSlash(siteUrl: string): string {
  return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
}

function imageContentType(url: string): string | undefined {
  const pathname = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  })().toLowerCase();

  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return undefined;
}
