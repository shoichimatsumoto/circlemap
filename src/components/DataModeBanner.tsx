import type { DataSource } from "@/lib/types";

export function DataModeBanner({ source }: { source: DataSource }) {
  // 本番では表示しない
  if (process.env.NODE_ENV === "production") return null;

  if (source === "dmm") {
    return (
      <div className="data-mode-banner data-mode-live">
        🟢 表示中: <strong>DMM API 実データ</strong>
      </div>
    );
  }

  return (
    <div className="data-mode-banner data-mode-mock">
      🟡 表示中: <strong>モックデータ</strong>
      <span className="data-mode-hint">
        .env.local に DMM API キーを設定すると実データに切り替わります
      </span>
    </div>
  );
}
