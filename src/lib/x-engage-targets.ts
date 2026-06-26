import { getSiteUrl } from "@/lib/site";
import type { Circle, Work } from "@/lib/types";

/** シャドウバン等で絡まない（参考メモ） */
export const SKIP_ENGAGE_TARGETS: { handle: string; label: string; reason: string }[] =
  [
    {
      handle: "douzinr18",
      label: "FANZA同人 公式",
      reason:
        "シャドウバン警告あり。検索に載りにくく絡んでも効果薄",
    },
    {
      handle: "douzin_info",
      label: "FANZA同人 広報",
      reason:
        "シャドウバン警告あり／投稿が古い。絡んでも効果薄",
    },
  ];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDynamicTargets(
  circle?: Circle,
  works?: Work[]
): { label: string; how: string; searchUrl?: string }[] {
  const dynamic: { label: string; how: string; searchUrl?: string }[] = [];

  if (circle) {
    const circlePage = `${getSiteUrl()}/circle?id=${encodeURIComponent(circle.id)}`;
    dynamic.push({
      label: `注目サークル: ${circle.name}`,
      how: `X でユーザ検索 → 公式の @ があれば ③ に入れてフォロー＋新作にいいね（シャドウバン警告はスキップ）。慣れたら引用:「他作品は CircleMap にまとまってます」→ リプで ${circlePage}`,
      searchUrl: `https://x.com/search?q=${encodeURIComponent(circle.name)}&src=typed_query&f=user`,
    });
  }

  for (const work of works?.slice(0, 3) ?? []) {
    if (circle && work.circleId === circle.id) continue;
    dynamic.push({
      label: `${work.circleName}（${work.title}）`,
      how: `サークル名で検索。公式の @ が見つかったら ③ に入れてフォロー or いいね`,
      searchUrl: `https://x.com/search?q=${encodeURIComponent(work.circleName)}&src=typed_query&f=user`,
    });
  }

  return dynamic;
}

export function renderEngageTargetsHtml(
  circle?: Circle,
  works?: Work[]
): string {
  const dynamic = buildDynamicTargets(circle, works);

  const dynamicBlock =
    dynamic.length > 0
      ? `
<ul class="engage-dynamic">
${dynamic
  .map(
    (item) => `
  <li>
    <strong>${escapeHtml(item.label)}</strong>
    <p>${escapeHtml(item.how)}</p>
    ${
      item.searchUrl
        ? `<a href="${escapeHtml(item.searchUrl)}" target="_blank" rel="noopener noreferrer">X でユーザ検索を開く →</a>`
        : ""
    }
  </li>`
  )
  .join("")}
</ul>`
      : `<p class="note">下書きの種類を切り替えると、ここにサークル名の検索リンクが出ます。</p>`;

  const quoteTemplate = circle
    ? `このサークルの漫画・CG・音声・ゲームをまとめて見られます（CircleMap）`
    : `気になるサークルの他作品、媒体横断でまとめて見られます（CircleMap）`;

  const skipRows = SKIP_ENGAGE_TARGETS.map(
    (item) => `
<tr class="engage-skip">
  <td><a href="https://x.com/${escapeHtml(item.handle)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(item.handle)}</a></td>
  <td>${escapeHtml(item.label)}</td>
  <td>${escapeHtml(item.reason)}</td>
</tr>`
  ).join("");

  return `
<details class="guide engage-guide" open>
  <summary>誰に絡む？（サークル公式中心）</summary>
  <div class="guide-body">
    <p><strong>方針：</strong>同人界隈のまとめアカウントにはフォローしない。<strong>投稿で紹介したサークルの公式</strong>にだけ絡む。</p>
    <p><strong>ペース：</strong>1日 1〜2 サークルまで。DM は送らない。</p>

    <h3>今回の下書きから絡む（メイン）</h3>
    ${dynamicBlock}

    <h3>サークル公式への絡み方</h3>
    <ol>
      <li>下の検索リンクでサークル名を検索 → <strong>ユーザー</strong> タブ</li>
      <li>公式っぽいアカウントを見つけたら <strong>@ハンドル</strong> を ③ に入れる → <strong>フォロー</strong> or <strong>いいね</strong></li>
      <li>新作・告知ツイートがあれば <strong>引用</strong>（下のテンプレ使用）</li>
      <li>CircleMap リンクは <strong>自分の投稿へのリプ</strong> に載せる</li>
      <li>シャドウバン警告が出ていたら <strong>スキップ</strong></li>
      <li>公式アカウントが見つからなければ <strong>無理に絡まない</strong></li>
    </ol>

    <h3>引用リプの型（コピペ用）</h3>
    <pre class="engage-template" id="engage-template">${escapeHtml(quoteTemplate)}</pre>
    <button type="button" class="engage-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('engage-template').innerText).then(()=>alert('引用文をコピーしました'))">引用文をコピー</button>

    <h3>絡まない例（参考）</h3>
    <table class="engage-table engage-skip-table">
      <thead>
        <tr><th>ID</th><th>名前</th><th>理由</th></tr>
      </thead>
      <tbody>${skipRows}</tbody>
    </table>
    <p class="note">同人まとめ・FANZA 公式系へのフォローも不要（詳しくなくても OK）。</p>
  </div>
</details>`;
}

/** @deprecated サークル公式中心に方針変更。API 互換用に空配列 */
export const STATIC_ENGAGE_TARGETS: never[] = [];
