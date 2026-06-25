import { NextResponse } from "next/server";
import { getDiscoverableCircles, getCirclePage, getLatestWorks, getPopularWorks } from "@/lib/data";
import { buildXPost, type XPostType } from "@/lib/x-post";

export const dynamic = "force-dynamic";

const VALID_TYPES: XPostType[] = ["popular", "circle", "weekly"];

function isAuthorized(request: Request): boolean {
  const syncSecret = process.env.SYNC_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  if (!syncSecret && !cronSecret) return false;

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret");
  const fromHeader = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (fromQuery && syncSecret && fromQuery === syncSecret) return true;
  if (fromHeader && syncSecret && fromHeader === syncSecret) return true;
  if (fromHeader && cronSecret && fromHeader === cronSecret) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "認証に失敗しました。?secret=... を付けてください",
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type") ?? "popular";
  const type: XPostType = VALID_TYPES.includes(typeParam as XPostType)
    ? (typeParam as XPostType)
    : "popular";

  try {
    const [{ works: popular }, { works: latest }] = await Promise.all([
      getPopularWorks(5),
      getLatestWorks(3),
    ]);

    let text: string;

    if (type === "circle") {
      const { circles } = await getDiscoverableCircles(1, "popular");
      const circle = circles[0];
      if (circle) {
        const { works: circleWorks } = await getCirclePage(circle.id);
        text = buildXPost("circle", { circle, circleWorks });
      } else {
        text = buildXPost("popular", { popular });
      }
    } else if (type === "weekly") {
      text = buildXPost("weekly", { popular, latest });
    } else {
      text = buildXPost("popular", { popular });
    }

    const accept = request.headers.get("accept") ?? "";

    if (accept.includes("text/html")) {
      const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CircleMap X投稿下書き</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; background: #0f0f12; color: #e8e8ec; }
    h1 { font-size: 1.1rem; color: #a78bfa; }
    pre { white-space: pre-wrap; word-break: break-word; background: #1a1a22; padding: 1rem; border-radius: 8px; line-height: 1.6; font-size: 0.95rem; }
    button { margin-top: 1rem; padding: 0.6rem 1.2rem; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    button:hover { background: #6d28d9; }
    .meta { color: #888; font-size: 0.85rem; margin-bottom: 1rem; }
    .types { margin: 1rem 0; }
    .types a { color: #a78bfa; margin-right: 1rem; }
  </style>
</head>
<body>
  <h1>X投稿下書き（${type}）</h1>
  <p class="meta">コピーして X に貼り付けてください。投稿は手動です。</p>
  <div class="types">
    <a href="?secret=${encodeURIComponent(url.searchParams.get("secret") ?? "")}&type=popular">人気TOP3</a>
    <a href="?secret=${encodeURIComponent(url.searchParams.get("secret") ?? "")}&type=circle">注目サークル</a>
    <a href="?secret=${encodeURIComponent(url.searchParams.get("secret") ?? "")}&type=weekly">週次まとめ</a>
  </div>
  <pre id="text">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('text').innerText).then(()=>alert('コピーしました'))">クリップボードにコピー</button>
</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({
      ok: true,
      type,
      text,
      hint: "Accept: text/html でブラウザ用ページも表示できます",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "下書き生成に失敗しました";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
