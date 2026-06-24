import { InfiniteCircleList } from "@/components/InfiniteCircleList";
import { DataModeBanner } from "@/components/DataModeBanner";
import { PageShell } from "@/components/PageShell";
import { getDiscoverableCircles } from "@/lib/data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "人気サークルランキング",
  description:
    "FANZA同人の人気作品データから抽出した注目サークルランキング。サークル単位で作品を横断検索できます。",
  alternates: { canonical: "/circles" },
};

export default async function CirclesPage() {
  const { circles, hasMore, source } = await getDiscoverableCircles(
    PAGE_SIZE,
    "popular"
  );

  return (
    <PageShell active="circles">
      <DataModeBanner source={source} />
      <main className="feed-wrap page-main">
        <header className="page-header">
          <h1>人気サークルランキング</h1>
          <p className="page-desc">
            FANZA同人の人気作品データから、注目サークルをランキング表示しています。
            人気作の掲載数が多いサークルほど上位に表示されます。
          </p>
        </header>

        <InfiniteCircleList
          initialCircles={circles}
          sort="popular"
          hasMore={hasMore}
          pageSize={PAGE_SIZE}
          layout="list"
          showRank
        />
      </main>
    </PageShell>
  );
}
