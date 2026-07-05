"use client";

import { useState } from "react";

export default function SyncToolPage() {
  const [makerId, setMakerId] = useState("235285");
  const [secret, setSecret] = useState("");
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
        body: JSON.stringify({ makerId, secret }),
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
      <p className="mb-6 text-sm text-neutral-600">
        Vercel の SYNC_SECRET を下に貼り付けて実行。URL に secret を載せないので + や = でも OK。
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          maker ID（FANZA の id=）
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={makerId}
            onChange={(e) => setMakerId(e.target.value)}
            placeholder="235285"
          />
        </label>

        <label className="block text-sm">
          SYNC_SECRET（Vercel → Reveal → 貼り付け）
          <input
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "同期中…" : "同期する"}
        </button>
      </form>

      {result && (
        <pre className="mt-6 overflow-x-auto rounded bg-neutral-100 p-4 text-xs">{result}</pre>
      )}
    </main>
  );
}
