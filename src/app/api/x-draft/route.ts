import { NextResponse } from "next/server";
import { getDiscoverableCircles, getCirclePage, getLatestWorks, getPopularWorks } from "@/lib/data";
import { renderEngageTargetsHtml, SKIP_ENGAGE_TARGETS } from "@/lib/x-engage-targets";
import { getXGuideHtml } from "@/lib/x-guide";
import { escapeHtmlText, renderXDraftImagesHtml } from "@/lib/x-draft-ui";
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

    let draft;
    let engageCircle: Awaited<ReturnType<typeof getCirclePage>>["circle"] | undefined;
    let engageWorks: Awaited<ReturnType<typeof getPopularWorks>>["works"] | undefined;

    if (type === "circle") {
      const { circles } = await getDiscoverableCircles(1, "popular");
      const circle = circles[0];
      if (circle) {
        const { works: circleWorks } = await getCirclePage(circle.id);
        draft = buildXPost("circle", { circle, circleWorks });
        engageCircle = circle;
        engageWorks = circleWorks;
      } else {
        draft = buildXPost("popular", { popular });
        engageWorks = popular;
      }
    } else if (type === "weekly") {
      draft = buildXPost("weekly", { popular, latest });
      engageWorks = [...popular.slice(0, 2), ...latest.slice(0, 1)];
    } else {
      draft = buildXPost("popular", { popular });
      engageWorks = popular;
    }

    const { text, reply, images } = draft;

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
    h2 { font-size: 0.95rem; color: #c4b5fd; margin: 1.5rem 0 0.5rem; }
    pre { white-space: pre-wrap; word-break: break-word; background: #1a1a22; padding: 1rem; border-radius: 8px; line-height: 1.6; font-size: 0.95rem; }
    button { margin-top: 1rem; padding: 0.6rem 1.2rem; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    button:hover { background: #6d28d9; }
    .meta { color: #888; font-size: 0.85rem; margin-bottom: 1rem; }
    .types { margin: 1rem 0; }
    .types a { color: #a78bfa; margin-right: 1rem; }
    .guide { margin: 1.5rem 0; background: #1a1a22; border-radius: 8px; padding: 0.75rem 1rem; }
    .guide summary { cursor: pointer; font-weight: 600; color: #c4b5fd; }
    .guide-body { margin-top: 0.75rem; font-size: 0.9rem; line-height: 1.65; color: #ccc; }
    .guide-body h3 { font-size: 0.88rem; color: #ddd; margin: 1rem 0 0.4rem; }
    .guide-body ul, .guide-body ol { margin: 0.4rem 0 0.4rem 1.2rem; padding: 0; }
    .guide-body li { margin: 0.25rem 0; }
    .guide-body .bad li { color: #f0a0a0; }
    .guide-body .note { color: #888; font-size: 0.82rem; margin: 0.4rem 0; }
    .guide-body code { background: #0f0f12; padding: 0.1rem 0.35rem; border-radius: 4px; }
    .guide-body a { color: #a78bfa; }
    .guide-body table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.88rem; }
    .guide-body td { padding: 0.35rem 0.5rem 0.35rem 0; vertical-align: top; }
    .guide-body td:first-child { width: 2rem; color: #a78bfa; font-weight: 700; }
    .thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin: 0.75rem 0 0; }
    .thumb-card { margin: 0; background: #1a1a22; border-radius: 8px; overflow: hidden; border: 1px solid #2a2a34; position: relative; }
    .thumb-card.thumb-primary { border-color: #7c3aed; box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.35); }
    .thumb-card img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; background: #0f0f12; }
    .thumb-badge { position: absolute; top: 8px; left: 8px; background: #7c3aed; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.45rem; border-radius: 4px; }
    .thumb-card figcaption { padding: 0.65rem 0.75rem 0.75rem; font-size: 0.82rem; line-height: 1.45; }
    .thumb-card figcaption strong { display: block; color: #e8e8ec; margin-bottom: 0.2rem; }
    .thumb-card figcaption span { display: block; color: #888; margin-bottom: 0.35rem; }
    .thumb-card figcaption a { color: #a78bfa; font-size: 0.8rem; }
    .engage-guide { margin-top: 1rem; }
    .engage-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin: 0.5rem 0; }
    .engage-table th, .engage-table td { border: 1px solid #2a2a34; padding: 0.45rem 0.5rem; text-align: left; vertical-align: top; }
    .engage-table th { background: #121218; color: #c4b5fd; }
    .engage-table a { color: #a78bfa; }
    .engage-priority { display: inline-block; font-size: 0.68rem; background: #7c3aed; color: #fff; padding: 0.1rem 0.35rem; border-radius: 4px; margin-right: 0.25rem; }
    .engage-dynamic { margin: 0.4rem 0 0.4rem 1.2rem; }
    .engage-dynamic li { margin: 0.6rem 0; }
    .engage-dynamic a { color: #a78bfa; font-size: 0.85rem; }
    .engage-template { white-space: pre-wrap; background: #121218; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; margin: 0.4rem 0; }
    .engage-copy-btn { margin-top: 0.35rem; padding: 0.45rem 0.9rem; background: #3f3f50; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.88rem; }
    .engage-copy-btn:hover { background: #52526a; }
    .engage-skip-table td { color: #c9a0a0; }
    .engage-skip-table a { color: #e8a0a0; }
    .bad-note { color: #e8a0a0 !important; }
  </style>
</head>
<body>
  ${getXGuideHtml()}
  ${renderEngageTargetsHtml(engageCircle, engageWorks)}
  <h1>X投稿下書き（${type}）</h1>
  <p class="meta">📷 サムネを添付 → ①本文を投稿 → ②リプライでリンク</p>
  <div class="types">
    <a href="?secret=${encodeURIComponent(url.searchParams.get("secret") ?? "")}&type=popular">人気TOP3</a>
    <a href="?secret=${encodeURIComponent(url.searchParams.get("secret") ?? "")}&type=circle">注目サークル</a>
    <a href="?secret=${encodeURIComponent(url.searchParams.get("secret") ?? "")}&type=weekly">週次まとめ</a>
  </div>
  ${renderXDraftImagesHtml(images)}
  <h2>① 本文（URLなし）</h2>
  <pre id="text">${escapeHtmlText(text)}</pre>
  <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('text').innerText).then(()=>alert('本文をコピーしました'))">本文をコピー</button>
  <h2>② リプライ用リンク</h2>
  <pre id="reply">${escapeHtmlText(reply)}</pre>
  <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('reply').innerText).then(()=>alert('リプ用リンクをコピーしました'))">リプ用をコピー</button>
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
      reply,
      images,
      engageTargets: {
        skip: SKIP_ENGAGE_TARGETS,
        circle: engageCircle?.name ?? null,
        works: engageWorks?.slice(0, 3).map((w) => ({
          id: w.id,
          title: w.title,
          circleName: w.circleName,
        })),
      },
      hint: "images[0]（primary）を X に添付。本文は text、リンクは reply をリプライに",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "下書き生成に失敗しました";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
