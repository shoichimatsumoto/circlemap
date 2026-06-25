import { getSiteUrl } from "@/lib/site";
import type { XPostImage } from "@/lib/x-post";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderXDraftImagesHtml(images: XPostImage[]): string {
  if (images.length === 0) {
    return `
<h2>📷 投稿用サムネ</h2>
<p class="meta">サムネ画像を取得できませんでした。CircleMap の作品ページから保存してください。</p>`;
  }

  const site = getSiteUrl();
  const cards = images
    .map((image) => {
      const workPage = `${site}/work/${image.workId}`;
      const badge = image.primary
        ? '<span class="thumb-badge">★ Xに添付</span>'
        : "";
      return `
<figure class="thumb-card${image.primary ? " thumb-primary" : ""}">
  <a href="${escapeHtml(image.thumbnailUrl)}" target="_blank" rel="noopener noreferrer">
    <img src="${escapeHtml(image.thumbnailUrl)}" alt="${escapeHtml(image.title)}" loading="lazy" referrerpolicy="no-referrer" />
  </a>
  ${badge}
  <figcaption>
    <strong>${escapeHtml(image.title)}</strong>
    <span>${escapeHtml(image.circleName)}</span>
    <a href="${escapeHtml(workPage)}" target="_blank" rel="noopener noreferrer">作品ページ →</a>
  </figcaption>
</figure>`;
    })
    .join("");

  return `
<h2>📷 投稿用サムネ</h2>
<p class="meta">★ の画像を X に添付。画像を長押し（スマホ）または右クリック（PC）で保存できます。</p>
<div class="thumb-grid">${cards}</div>`;
}

export function escapeHtmlText(text: string): string {
  return escapeHtml(text);
}
