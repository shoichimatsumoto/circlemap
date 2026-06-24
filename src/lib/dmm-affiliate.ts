/**
 * API取得用の affiliate_id（990系）と、サイト登録用の affiliate_id（005等）は別。
 * 購入リンクにはサイト登録IDを使う必要がある。
 */
export function resolveAffiliateUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  const linkAffiliateId =
    process.env.DMM_LINK_AFFILIATE_ID ?? process.env.DMM_SITE_AFFILIATE_ID;

  if (!linkAffiliateId) return rawUrl;

  try {
    const url = new URL(rawUrl);
    url.searchParams.set("af_id", linkAffiliateId);
    if (url.searchParams.has("affiliate_id")) {
      url.searchParams.set("affiliate_id", linkAffiliateId);
    }
    return url.toString();
  } catch {
    return rawUrl
      .replace(/af_id=[^&]+/, `af_id=${linkAffiliateId}`)
      .replace(/affiliate_id=[^&]+/, `affiliate_id=${linkAffiliateId}`);
  }
}
