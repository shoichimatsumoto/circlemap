import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell active="home">
      <div className="feed-wrap page-main">
        <header className="page-header">
          <h1>ページが見つかりません</h1>
          <p className="page-desc">
            指定のURLは存在しないか、削除された可能性があります。
          </p>
          <p>
            <Link href="/">トップへ戻る</Link>
            {" · "}
            <Link href="/circle">サークル一覧</Link>
            {" · "}
            <Link href="/search">検索</Link>
          </p>
        </header>
      </div>
    </PageShell>
  );
}
