/**
 * DMM API が返す affiliateURL（al.fanza.co.jp/?lurl=...&af_id=xxx-990&ch=api）では
 * af_id に API 用 ID（990〜999）が必須。サイト登録 ID（005 等）に差し替えると 400 になる。
 *
 * - DMM_AFFILIATE_ID（990）… API 取得データの購入リンク用
 * - DMM_LINK_AFFILIATE_ID（005）… 管理画面のリンクツール用（API URL には使わない）
 */
export function resolveAffiliateUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  const apiAffiliateId = process.env.DMM_AFFILIATE_ID;
  if (!apiAffiliateId) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const lurl = url.searchParams.get("lurl");

    if (!lurl) {
      return rawUrl;
    }

    const base = url.hostname.includes("fanza")
      ? "https://al.fanza.co.jp/"
      : "https://al.dmm.co.jp/";

    const affiliate = new URL(base);
    affiliate.searchParams.set("lurl", lurl);
    affiliate.searchParams.set("af_id", apiAffiliateId);
    affiliate.searchParams.set("ch", "api");

    return affiliate.toString();
  } catch {
    return rawUrl.replace(/af_id=[^&]+/, `af_id=${apiAffiliateId}`);
  }
}

/** 商品ページ URL から API 形式のアフィリエイトリンクを生成 */
export function buildAffiliateUrl(productUrl?: string): string | undefined {
  if (!productUrl) return undefined;

  const apiAffiliateId = process.env.DMM_AFFILIATE_ID;
  if (!apiAffiliateId) return productUrl;

  try {
    const base = productUrl.includes("fanza") || productUrl.includes("dmm.co.jp")
      ? "https://al.fanza.co.jp/"
      : "https://al.dmm.co.jp/";

    const affiliate = new URL(base);
    affiliate.searchParams.set("lurl", productUrl);
    affiliate.searchParams.set("af_id", apiAffiliateId);
    affiliate.searchParams.set("ch", "api");
    return affiliate.toString();
  } catch {
    return productUrl;
  }
}
