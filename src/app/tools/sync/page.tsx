"use client";

import { useState } from "react";

const SYNC_SECRET = "cmSync235285";

const BOOKMARKS = [
  {
    label: "サイちゃん 一括取り込み（235285）",
    url: `https://www.circlemap.jp/api/sync/maker?makerId=235285&secret=${SYNC_SECRET}`,
  },
  {
    label: "全カタログ同期",
    url: `https://www.circlemap.jp/api/sync?secret=${SYNC_SECRET}`,
  },
];

export default function SyncToolPage() {
  const [makerId, setMakerId] = useState("235285");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("同期中…");

    try {
      const res = await fetch("/api/sync/maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ makerId, secret: SYNC_SECRET }),
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6 font-sans">
      <h1 className="mb-2 text-xl font-bold">サークル一括同期</h1>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-3 text-sm font-bold">コピペ用 URL（そのまま開く）</p>
        {BOOKMARKS.map((b) => (
          <div key={b.url} className="mb-3 last:mb-0">
            <p className="mb-1 text-xs text-neutral-600">{b.label}</p>
            <code className="block break-all rounded bg-white p-2 text-xs">{b.url}</code>
          </div>
        ))}
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          maker ID
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={makerId}
            onChange={(e) => setMakerId(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "同期中…" : "同期する（フォーム）"}
        </button>
      </form>

      {result && (
        <pre className="mt-6 overflow-x-auto rounded bg-neutral-100 p-4 text-xs">{result}</pre>
      )}
    </main>
  );
}
