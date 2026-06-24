export const SITE_NAME = "CircleMap";

export const SITE_DESCRIPTION =
  "FANZA同人の漫画・CG・音声・ゲームをサークル軸で横断検索できるデータベース。人気作品・新着・サークルランキングから探せます。";

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://circlemap-five.vercel.app";
  return url;
}
