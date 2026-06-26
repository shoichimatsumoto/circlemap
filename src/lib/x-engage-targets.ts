import { getSiteUrl } from "@/lib/site";
import type { Circle, Work } from "@/lib/types";

export type EngageAction = "follow" | "like" | "quote" | "search";

export type EngageTarget = {
  handle: string;
  label: string;
  action: EngageAction;
  how: string;
  priority: "high" | "medium";
};

/** 固定の絡み先（公式・準公式。随時見直し） */
export const STATIC_ENGAGE_TARGETS: EngageTarget[] = [
  {
    handle: "douzinr18",
    label: "FANZA同人 公式",
    action: "follow",
    how: "フォロー＋セール・新作告知にいいね。宣伝リプは控えめに",
    priority: "high",
  },
  {
    handle: "douzin_info",
    label: "FANZA同人 広報",
    action: "follow",
    how: "キャンペーン情報のフォロー用。いいねでタイムラインに載せやすく",
    priority: "high",
  },
  {
    handle: "comiketofficial",
    label: "コミックマーケット準備会",
    action: "follow",
    how: "イベント期にいいね。コミケ前後は同人界隈の注目が集まる",
    priority: "medium",
  },
  {
    handle: "comiket_cosplay",
    label: "コミケ コスプレ情報",
    action: "follow",
    how: "イベント連動時のみ。フォローしておく程度で OK",
    priority: "medium",
  },
];

const ACTION_LABELS: Record<EngageAction, string> = {
  follow: "フォロー",
  like: "いいね",
  quote: "引用",
  search: "X内検索",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTargetRow(target: EngageTarget): string {
  const url = `https://x.com/${encodeURIComponent(target.handle)}`;
  const badge =
    target.priority === "high"
      ? '<span class="engage-priority high">優先</span>'
      : "";

  return `
<tr>
  <td>${badge}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(target.handle)}</a></td>
  <td>${escapeHtml(target.label)}</td>
  <td>${escapeHtml(ACTION_LABELS[target.action])}</td>
  <td>${escapeHtml(target.how)}</td>
</tr>`;
}

function buildDynamicTargets(
  circle?: Circle,
  works?: Work[]
): { label: string; handle: string; how: string; searchUrl?: string }[] {
  const dynamic: {
    label: string;
    handle: string;
    how: string;
    searchUrl?: string;
  }[] = [];

  if (circle) {
    const circlePage = `${getSiteUrl()}/circle?id=${encodeURIComponent(circle.id)}`;
    dynamic.push({
      label: `今回の注目サークル: ${circle.name}`,
      handle: "（Xで検索）",
      how: `X で「${circle.name}」を検索 → サークル公式があればフォロー。新作告知に引用例:「他作品は CircleMap にまとまってます」→ リプで ${circlePage}`,
      searchUrl: `https://x.com/search?q=${encodeURIComponent(circle.name)}&src=typed_query&f=user`,
    });
  }

  const topWork = works?.[0];
  if (topWork) {
    dynamic.push({
      label: `今回の代表作: ${topWork.title}`,
      handle: topWork.circleName,
      how: `サークル名「${topWork.circleName}」でユーザ検索。見つかったらフォロー＋いいねから始める`,
      searchUrl: `https://x.com/search?q=${encodeURIComponent(topWork.circleName)}&src=typed_query&f=user`,
    });
  }

  return dynamic;
}

export function renderEngageTargetsHtml(
  circle?: Circle,
  works?: Work[]
): string {
  const staticRows = STATIC_ENGAGE_TARGETS.map(renderTargetRow).join("");
  const dynamic = buildDynamicTargets(circle, works);

  const dynamicBlock =
    dynamic.length > 0
      ? `
<h3>今回の下書きに合わせて絡む</h3>
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
      : "";

  const quoteTemplate = circle
    ? `このサークルの漫画・CG・音声・ゲームをまとめて見られます（CircleMap）`
    : `気になるサークルの他作品、媒体横断でまとめて見られます（CircleMap）`;

  return `
<details class="guide engage-guide" open>
  <summary>誰に絡む？（フォロー・いいね・引用の候補）</summary>
  <div class="guide-body">
    <p><strong>ペース：</strong>1日 2〜3 アカウントまで。DM は送らない。</p>

    <h3>固定リスト（まずここから）</h3>
    <table class="engage-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名前</th>
          <th>アクション</th>
          <th>やり方</th>
        </tr>
      </thead>
      <tbody>${staticRows}</tbody>
    </table>

    ${dynamicBlock}

    <h3>引用リプの型（コピペ用）</h3>
    <pre class="engage-template" id="engage-template">${escapeHtml(quoteTemplate)}</pre>
    <button type="button" class="engage-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('engage-template').innerText).then(()=>alert('引用文をコピーしました'))">引用文をコピー</button>
    <p class="note">相手の投稿に <strong>引用</strong> → 上の文を貼る → <strong>自分の投稿へのリプ</strong> で CircleMap リンク（宣伝臭を抑える）</p>

    <h3>サークル公式の見つけ方</h3>
    <ol>
      <li>CircleMap のサークル名をコピー</li>
      <li>X 検索 → <strong>ユーザー</strong> タブ</li>
      <li>公式っぽいアカウントをフォロー（1日2〜3件）</li>
      <li>新作・人気作の投稿にいいね → 慣れてきたら引用</li>
    </ol>
    <p class="note">リストは定期的に見直してください。存在しない ID になっていたら教えてください。</p>
  </div>
</details>`;
}
