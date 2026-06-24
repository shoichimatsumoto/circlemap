import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { DataModeBanner } from "@/components/DataModeBanner";
import { InfiniteWorkGrid } from "@/components/InfiniteWorkGrid";
import { PageShell } from "@/components/PageShell";
import { getLatestWorks, getPopularWorks } from "@/lib/data";
import type { DataSource } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const HOME_PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "ホーム",
  description:
    "FANZA同人の人気作品・新着作品をサークル軸で探せるCircleMapのトップページ。",
  alternates: { canonical: "/" },
};

function resolveSource(...sources: DataSource[]): DataSource {
  if (sources.includes("supabase")) return "supabase";
  if (sources.includes("dmm")) return "dmm";
  return "mock";
}

export default async function HomePage() {
  const [
    { works: popularWorks, hasMore: popularHasMore, source: popularSource },
    { works: latestWorks, hasMore: latestHasMore, source: latestSource },
  ] = await Promise.all([
    getPopularWorks(HOME_PAGE_SIZE),
    getLatestWorks(HOME_PAGE_SIZE),
  ]);

  const source = resolveSource(popularSource, latestSource);

  return (
    <PageShell active="home">
      <DataModeBanner source={source} />
      <div className="feed-wrap">
        <CategoryChips activeHref="/" />

        <section className="feed-section">
          <div className="feed-section-head">
            <h2>人気作品</h2>
            <span className="feed-section-sub">FANZA人気順</span>
          </div>
          <InfiniteWorkGrid
            initialWorks={popularWorks}
            feedType="popular"
            hasMore={popularHasMore}
            pageSize={HOME_PAGE_SIZE}
            keyPrefix="popular-"
          />
        </section>

        <section className="feed-section">
          <div className="feed-section-head">
            <h2>新着作品</h2>
            <Link href="/media/manga" className="link-more">
              もっと見る →
            </Link>
          </div>
          <InfiniteWorkGrid
            initialWorks={latestWorks}
            feedType="latest"
            hasMore={latestHasMore}
            pageSize={HOME_PAGE_SIZE}
            keyPrefix="latest-"
          />
        </section>
      </div>
    </PageShell>
  );
}
