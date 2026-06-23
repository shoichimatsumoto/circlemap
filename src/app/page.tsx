import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { CircleCard } from "@/components/CircleCard";
import { DataModeBanner } from "@/components/DataModeBanner";
import { PageShell } from "@/components/PageShell";
import { WorkCard } from "@/components/WorkCard";
import {
  getLatestWorks,
  getPopularCircles,
  getPopularWorks,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    { works: popularWorks, source: popularSource },
    { works: latestWorks, source: latestSource },
    { circles: popularCircles, source: circleSource },
  ] = await Promise.all([
    getPopularWorks(12),
    getLatestWorks(12),
    getPopularCircles(12),
  ]);

  const source =
    popularSource === "dmm" || latestSource === "dmm" || circleSource === "dmm"
      ? "dmm"
      : "mock";

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
          <div className="yt-grid">
            {popularWorks.map((work) => (
              <WorkCard key={`popular-${work.id}`} work={work} />
            ))}
          </div>
        </section>

        <section className="feed-section">
          <div className="feed-section-head">
            <h2>人気サークル</h2>
            <Link href="/circles" className="link-more">
              ランキングを見る →
            </Link>
          </div>
          <div className="yt-channel-grid">
            {popularCircles.map((circle, index) => (
              <CircleCard key={circle.id} circle={circle} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="feed-section">
          <div className="feed-section-head">
            <h2>新着作品</h2>
            <Link href="/media/manga" className="link-more">
              もっと見る →
            </Link>
          </div>
          <div className="yt-grid">
            {latestWorks.map((work) => (
              <WorkCard key={`latest-${work.id}`} work={work} />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
