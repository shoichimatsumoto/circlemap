import type { DmmItem } from "@/lib/dmm-types";
import { buildAffiliateUrl, resolveAffiliateUrl } from "@/lib/dmm-affiliate";
import { pickBestDmmImageUrl } from "@/lib/dmm-image";
import type { Circle, MediaType, Work } from "@/lib/types";
import { circleInitial } from "@/lib/types";

export function detectMediaType(item: DmmItem): MediaType {
  if (
    item.service_code === "pcgame" ||
    item.floor_code === "digital_pcgame"
  ) {
    return "game";
  }

  const category = item.category_name ?? "";
  const genreText = (item.iteminfo?.genre ?? []).map((g) => g.name).join(" ");
  const text = `${category} ${genreText} ${item.title}`;

  if (
    category.includes("ボイス") ||
    category.includes("音声") ||
    /ボイス|音声|ASMR|言葉責め|耳舐|喘ぎ|淫語|シチュエーション音声/i.test(text) ||
    (item.iteminfo?.voice_actor?.length ?? 0) > 0
  ) {
    return "voice";
  }

  if (
    category.includes("CG") ||
    category.includes("イラスト") ||
    /CG集|CG・|イラスト集|画集|CGコミック|画像集/i.test(text)
  ) {
    return "cg";
  }

  if (category.includes("ゲーム") || /ゲーム/i.test(genreText)) {
    return "game";
  }

  return "manga";
}

function formatDmmDate(date?: string): string {
  if (!date) return "—";
  const [ymd] = date.split(" ");
  return ymd.replace(/-/g, "/");
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "unknown"
  );
}

export function extractSampleImages(item: DmmItem): string[] {
  const large = item.sampleImageURL?.sample_l?.image ?? [];
  const small = item.sampleImageURL?.sample_s?.image ?? [];
  const count = Math.max(large.length, small.length);
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    const best = pickBestDmmImageUrl(large[i], small[i]);
    if (best) images.push(best);
  }

  return [...new Set(images)];
}

export function dmmItemToWork(item: DmmItem): Work {
  const maker = item.iteminfo?.maker?.[0];
  const circleName = maker?.name ?? "不明なサークル";
  const circleId = maker?.id ? String(maker.id) : slugify(circleName);
  const genres = item.iteminfo?.genre?.map((g) => g.name) ?? [];
  const thumbnailUrl = pickBestDmmImageUrl(
    item.imageURL?.large,
    item.imageURL?.small
  );
  const sampleImages = extractSampleImages(item);

  return {
    id: item.content_id,
    title: item.title,
    mediaType: detectMediaType(item),
    price: Number(item.prices?.price ?? 0),
    date: formatDmmDate(item.date),
    tags: genres.slice(0, 6),
    circleId,
    circleName,
    affiliateUrl:
      resolveAffiliateUrl(item.affiliateURL) ?? buildAffiliateUrl(item.URL),
    thumbnailUrl,
    sampleImages: sampleImages.length > 0 ? sampleImages : undefined,
    description: item.category_name,
  };
}

export function dmmItemsToWorks(items: DmmItem[]): Work[] {
  return items.map(dmmItemToWork);
}

export function filterWorksByMedia(works: Work[], mediaType: MediaType): Work[] {
  return works.filter((work) => work.mediaType === mediaType);
}

export function dedupeWorks(works: Work[]): Work[] {
  const seen = new Set<string>();
  return works.filter((work) => {
    if (seen.has(work.id)) return false;
    seen.add(work.id);
    return true;
  });
}

export function buildCircleFromWorks(
  circleId: string,
  works: Work[]
): Circle | null {
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
    description: `${name} の作品を漫画・CG・音声・ゲーム横断で一覧`,
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
