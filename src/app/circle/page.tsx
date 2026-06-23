import Link from "next/link";
import { CirclePageClient } from "@/components/CirclePageClient";
import { CircleCard } from "@/components/CircleCard";
import { DataModeBanner } from "@/components/DataModeBanner";
import { PageShell } from "@/components/PageShell";
import { getCirclePage, getDiscoverableCircles } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function CirclePage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) {
    const { circles, source } = await getDiscoverableCircles(80);

    return (
      <PageShell active="circle">
        <DataModeBanner source={source} />
        <div className="feed-wrap page-main">
          <header className="page-header">
            <h1>サークル一覧</h1>
            <p className="page-desc">
              人気・新着作品から抽出したサークルです。現在{" "}
              <strong>{circles.length}件</strong>を表示しています。
              人気順のランキングは
              <Link href="/circles"> 人気サークルページ</Link>
              でも見られます。
            </p>
          </header>

          <div className="yt-channel-list">
            {circles.map((circle) => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const { circle, works, featured, source } = await getCirclePage(id);

  return (
    <PageShell active="circle">
      <DataModeBanner source={source} />
      <div className="feed-wrap">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/circle">サークル一覧</Link>
          <span>/</span>
          <span>{circle.name}</span>
        </nav>
        <CirclePageClient circle={circle} works={works} featured={featured} />
      </div>
    </PageShell>
  );
}
