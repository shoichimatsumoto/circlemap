import type { DmmItem } from "@/lib/dmm-types";
import { resolveAffiliateUrl } from "@/lib/dmm-affiliate";
import type { Circle, MediaType, Work } from "@/lib/types";
import { circleInitial } from "@/lib/types";

function floorToMediaType(floorCode: string): MediaType {
  switch (floorCode) {
    case "voice":
      return "voice";
    case "digital_cg":
      return "cg";
    case "game":
      return "game";
    default:
      return "manga";
  }
}

function formatDmmDate(date?: string): string {
  if (!date) return "—";
  const [ymd] = date.split(" ");
  return ymd.replace(/-/g, "/");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "unknown";
}

export function dmmItemToWork(item: DmmItem): Work {
  const maker = item.iteminfo?.maker?.[0];
  const circleName = maker?.name ?? "不明なサークル";
  const circleId = maker?.id ? String(maker.id) : slugify(circleName);
  const genres = item.iteminfo?.genre?.map((g) => g.name) ?? [];

  return {
    id: item.content_id,
    title: item.title,
    mediaType: floorToMediaType(item.floor_code),
    price: Number(item.prices?.price ?? 0),
    date: formatDmmDate(item.date),
    tags: genres.slice(0, 6),
    circleId,
    circleName,
    affiliateUrl: resolveAffiliateUrl(item.affiliateURL),
    thumbnailUrl: item.imageURL?.large ?? item.imageURL?.small,
    description: item.category_name,
  };
}

export function dmmItemsToWorks(items: DmmItem[]): Work[] {
  return items.map(dmmItemToWork);
}

export function buildCircleFromWorks(circleId: string, works: Work[]): Circle | null {
  if (works.length === 0) return null;

  const name = works[0].circleName;
  const counts = { manga: 0, cg: 0, voice: 0, game: 0 };

  for (const work of works) {
    counts[work.mediaType]++;
  }

  const prices = works.map((w) => w.price).filter((p) => p > 0);
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

  const tagSet = new Set<string>();
  works.forEach((w) => w.tags.slice(0, 3).forEach((t) => tagSet.add(t)));

  return {
    id: circleId,
    name,
    initial: circleInitial(name),
    description: `${name} の作品一覧（DMM API）`,
    workCount: works.length,
    latestDate: works[0]?.date ?? "—",
    avgPrice,
    mangaCount: counts.manga,
    cgCount: counts.cg,
    voiceCount: counts.voice,
    gameCount: counts.game,
    tags: Array.from(tagSet).slice(0, 8),
  };
}
