function collectSecretCandidates(request: Request): string[] {
  const url = new URL(request.url);
  const candidates = new Set<string>();

  const fromQuery = url.searchParams.get("secret")?.trim();
  if (fromQuery) {
    candidates.add(fromQuery);
    // searchParams は + を空白にする。元 URL から取り直す
    candidates.add(fromQuery.replace(/ /g, "+"));
  }

  const rawMatch = url.search.match(/[?&]secret=([^&#]*)/)?.[1];
  if (rawMatch) {
    try {
      candidates.add(decodeURIComponent(rawMatch.replace(/\+/g, "%2B")));
    } catch {
      /* ignore */
    }
    try {
      candidates.add(decodeURIComponent(rawMatch));
    } catch {
      /* ignore */
    }
    candidates.add(rawMatch);
  }

  const fromHeader = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (fromHeader) candidates.add(fromHeader);

  return [...candidates].filter(Boolean);
}

export function getSyncSecretStatus() {
  const syncSecret = process.env.SYNC_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  return {
    hasSyncSecret: Boolean(syncSecret),
    hasCronSecret: Boolean(cronSecret),
  };
}

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

  const candidates = collectSecretCandidates(request);
  if (candidates.length === 0) {
    return {
      ok: false,
      message:
        "?secret=... を URL に付けてください（Vercel の SYNC_SECRET または CRON_SECRET と同じ値）",
    };
  }

  for (const value of candidates) {
    if (syncSecret && value === syncSecret) return { ok: true };
    if (cronSecret && value === cronSecret) return { ok: true };
  }

  return {
    ok: false,
    message:
      "secret が一致しません。Vercel で Reveal → コピーし直すか、secret に + / = / & がある場合は encodeURIComponent でエンコードしてください。それでもダメなら SYNC_SECRET を英数字だけの値に変更 → Redeploy",
  };
}
