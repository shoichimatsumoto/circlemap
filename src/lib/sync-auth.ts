export function checkSyncAuth(request: Request): { ok: true } | { ok: false; message: string } {
  const syncSecret = process.env.SYNC_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!syncSecret && !cronSecret) {
    return {
      ok: false,
      message:
        "SYNC_SECRET / CRON_SECRET が Vercel に未設定です。Settings → Environment Variables で Production に追加し Redeploy してください",
    };
  }

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret")?.trim();
  const fromHeader = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  const candidates = [fromQuery, fromHeader].filter(Boolean) as string[];
  if (candidates.length === 0) {
    return {
      ok: false,
      message: "?secret=... を URL に付けてください（Vercel の SYNC_SECRET または CRON_SECRET と同じ値）",
    };
  }

  for (const value of candidates) {
    if (syncSecret && value === syncSecret) return { ok: true };
    if (cronSecret && value === cronSecret) return { ok: true };
  }

  return {
    ok: false,
    message:
      "secret が一致しません。Vercel → Environment Variables → SYNC_SECRET を Reveal してコピーし直してください（Production 環境・Redeploy 後の値）",
  };
}
