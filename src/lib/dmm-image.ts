/** DMM / FANZA 画像 URL を可能な限り大サイズ版に変換 */
export function upgradeDmmImageUrl(url: string): string {
  return url
    .replace(/([/_-])ps(\.(jpe?g|png|webp)(\?|$))/i, "$1pl$2$3")
    .replace(/([/_-])pt(\.(jpe?g|png|webp)(\?|$))/i, "$1pl$2$3")
    .replace(/\/sample\/s\//gi, "/sample/l/")
    .replace(/sample_s/gi, "sample_l");
}

/** サムネイル帯用の軽量版（一覧表示のみ） */
export function thumbDmmImageUrl(url: string): string {
  return url
    .replace(/([/_-])pl(\.(jpe?g|png|webp)(\?|$))/i, "$1ps$2$3")
    .replace(/\/sample\/l\//gi, "/sample/s/");
}

export function buildGalleryImages(
  thumbnailUrl?: string,
  sampleImages?: string[]
): string[] {
  const samples = [...new Set((sampleImages ?? []).map(upgradeDmmImageUrl))];
  const cover = thumbnailUrl ? upgradeDmmImageUrl(thumbnailUrl) : undefined;

  if (samples.length === 0) {
    return cover ? [cover] : [];
  }

  if (cover && !samples.some((url) => isSameDmmImage(url, cover))) {
    return [cover, ...samples];
  }

  return samples;
}

function normalizeImageKey(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/([/_-])(ps|pt|pl)(\.)/gi, "$1$3");
  } catch {
    return url.replace(/([/_-])(ps|pt|pl)(\.)/gi, "$1$3");
  }
}

function isSameDmmImage(a: string, b: string): boolean {
  return normalizeImageKey(a) === normalizeImageKey(b);
}
