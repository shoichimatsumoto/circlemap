import Link from "next/link";
import type { Metadata } from "next";
import { CirclePageClient } from "@/components/CirclePageClient";
import { InfiniteCircleList } from "@/components/InfiniteCircleList";
import { DataModeBanner } from "@/components/DataModeBanner";
import { PageShell } from "@/components/PageShell";
import { getCirclePage, getDiscoverableCircles } from "@/lib/data";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;

  if (!id) {
    return {
      title: "サークル一覧",
      description:
        "FANZA同人のサークルをあいうえお順で一覧表示。サークル単位で作品を横断検索できます。",
      alternates: { canonical: "/circle" },
    };
  }

  const { circle } = await getCirclePage(id);
  const description = `${circle.name}の同人作品一覧。漫画・CG・音声・ゲームをサークル軸で横断検索できます。`;

  return {
    title: circle.name,
    description,
    alternates: { canonical: `/circle?id=${encodeURIComponent(id)}` },
  };
}

export default async function CirclePage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) {
    const { circles, hasMore, source } = await getDiscoverableCircles(
      PAGE_SIZE,
      "name"
    );

    return (
      <PageShell active="circle">
        <DataModeBanner source={source} />
        <div className="feed-wrap page-main">
          <header className="page-header">
            <h1>サークル一覧</h1>
            <p className="page-desc">
              人気・新着作品から抽出したサークルです（あいうえお順）。
              スクロールすると続きを読み込みます。人気順のランキングは
              <Link href="/circles"> 人気サークルページ</Link>
              でも見られます。
            </p>
          </header>

          <InfiniteCircleList
            initialCircles={circles}
            sort="name"
            hasMore={hasMore}
            pageSize={PAGE_SIZE}
            layout="list"
          />
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
