export type MediaType = "manga" | "cg" | "voice" | "game";

export type Work = {
  id: string;
  title: string;
  mediaType: MediaType;
  price: number;
  duration?: string;
  pages?: number;
  date: string;
  tags: string[];
  circleId: string;
  circleName: string;
  affiliateUrl?: string;
  thumbnailUrl?: string;
  description?: string;
};

export type Circle = {
  id: string;
  name: string;
  initial: string;
  description: string;
  workCount: number;
  latestDate: string;
  avgPrice: number;
  mangaCount: number;
  cgCount: number;
  voiceCount: number;
  gameCount: number;
  tags: string[];
};

export type DataSource = "mock" | "dmm";

export const MEDIA_LABELS: Record<MediaType, string> = {
  manga: "📕",
  cg: "🎨",
  voice: "🎧",
  game: "🎮",
};

export const MEDIA_NAMES: Record<MediaType, string> = {
  manga: "漫画",
  cg: "CG",
  voice: "音声",
  game: "ゲーム",
};

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

export function formatWorkMeta(work: Work): string {
  const parts = [formatPrice(work.price)];
  if (work.duration) parts.push(work.duration);
  if (work.pages) parts.push(`${work.pages}P`);
  return parts.join(" · ");
}

export function circleInitial(name: string): string {
  return name.charAt(0) || "?";
}
