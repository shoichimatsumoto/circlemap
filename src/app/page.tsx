import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { DataModeBanner } from "@/components/DataModeBanner";
import { InfiniteCircleList } from "@/components/InfiniteCircleList";
import { InfiniteWorkGrid } from "@/components/InfiniteWorkGrid";
import { PageShell } from "@/components/PageShell";
import {
  getLatestWorks,
  getPopularCircles,
  getPopularWorks,
} from "@/lib/data";
import type { DataSource } from "@/lib/types";

export const dynamic = "force-dynamic";

const HOME_PAGE_SIZE = 12;

function resolveSource(...sources: DataSource[]): DataSource {
  if (sources.includes("supabase")) return "supabase";
  if (sources.includes("dmm")) return "dmm";
  return "mock";
}

export default async function HomePage() {
  const [
    { works: popularWorks, hasMore: popularHasMore, source: popularSource },
    { works: latestWorks, hasMore: latestHasMore, source: latestSource },
    {
      circles: popularCircles,
      hasMore: circlesHasMore,
      source: circleSource,
    },
  ] = await Promise.all([
    getPopularWorks(HOME_PAGE_SIZE),
    getLatestWorks(HOME_PAGE_SIZE),
    getPopularCircles(HOME_PAGE_SIZE),
  ]);

  const source = resolveSource(popularSource, latestSource, circleSource);

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
            <h2>人気サークル</h2>
            <Link href="/circles" className="link-more">
              ランキングを見る →
            </Link>
          </div>
          <InfiniteCircleList
            initialCircles={popularCircles}
            sort="popular"
            hasMore={circlesHasMore}
            pageSize={HOME_PAGE_SIZE}
            layout="grid"
            showRank
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
