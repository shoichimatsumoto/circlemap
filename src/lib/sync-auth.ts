function normalizeEnvSecret(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let s = value.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function collectSecretCandidates(request: Request): string[] {
  const url = new URL(request.url);
  const candidates = new Set<string>();

  const fromQuery = url.searchParams.get("secret")?.trim();
  if (fromQuery) {
    candidates.add(fromQuery);
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

function getConfiguredSecrets() {
  return {
    syncSecret: normalizeEnvSecret(process.env.SYNC_SECRET),
    cronSecret: normalizeEnvSecret(process.env.CRON_SECRET),
  };
}

function matchSecret(value: string): boolean {
  const { syncSecret, cronSecret } = getConfiguredSecrets();
  const v = value.trim();
  return (syncSecret !== undefined && v === syncSecret) || (cronSecret !== undefined && v === cronSecret);
}

export function getSyncSecretStatus() {
  const { syncSecret, cronSecret } = getConfiguredSecrets();
  return {
    hasSyncSecret: Boolean(syncSecret),
    hasCronSecret: Boolean(cronSecret),
  };
}

export function checkSyncAuth(request: Request): { ok: true } | { ok: false; message: string } {
  const { syncSecret, cronSecret } = getConfiguredSecrets();

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
        "secret が必要です。/tools/sync のフォームから実行するか、POST で JSON 送信してください",
    };
  }

  for (const value of candidates) {
    if (matchSecret(value)) return { ok: true };
  }

  return {
    ok: false,
    message:
      "secret が一致しません。Vercel → SYNC_SECRET を Reveal して /tools/sync に貼り付けてください",
  };
}

export function checkSyncAuthValue(
  secret: string | undefined
): { ok: true } | { ok: false; message: string } {
  const { syncSecret, cronSecret } = getConfiguredSecrets();

  if (!syncSecret && !cronSecret) {
    return {
      ok: false,
      message: "SYNC_SECRET / CRON_SECRET が Vercel に未設定です",
    };
  }

  if (!secret?.trim()) {
    return { ok: false, message: "secret を入力してください" };
  }

  if (matchSecret(secret)) return { ok: true };

  return {
    ok: false,
    message: "secret が一致しません。Vercel → SYNC_SECRET を Reveal して貼り付け直してください",
  };
}
