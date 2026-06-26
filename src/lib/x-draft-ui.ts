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
<p class="meta">★ の画像を X に添付（問題なさそうなものだけ）。<strong>全部アウトならテキストのみ</strong>で投稿。長押し / 右クリックで保存。</p>
<div class="thumb-grid">${cards}</div>`;
}

function renderMentionHtml(circleName?: string): string {
  if (!circleName) return "";

  const searchUrl = `https://x.com/search?q=${encodeURIComponent(circleName)}&src=typed_query&f=user`;

  return `
<h2>③ @メンション（公式が見つかったら）</h2>
<p class="meta">「${escapeHtml(circleName)}」を X でユーザ検索 → 公式の <strong>@ハンドル</strong> をコピーして ① の本文の<strong>先頭か末尾</strong>に足す。</p>
<p class="meta"><a href="${escapeHtml(searchUrl)}" target="_blank" rel="noopener noreferrer">X でユーザ検索を開く →</a></p>
<pre id="mention">@</pre>
<button type="button" onclick="navigator.clipboard.writeText(document.getElementById('mention').innerText).then(()=>alert('@をコピーしました。ハンドルを足してから①と合わせて投稿'))">@ をコピー</button>
<p class="note">引用リプする場合も、相手の <strong>@</strong> を入れると届きやすい。</p>`;
}

export function escapeHtmlText(text: string): string {
  return escapeHtml(text);
}

export { renderMentionHtml };
