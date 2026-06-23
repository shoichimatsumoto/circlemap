import Link from "next/link";
import { CircleCard } from "@/components/CircleCard";
import { DataModeBanner } from "@/components/DataModeBanner";
import { PageShell } from "@/components/PageShell";
import { getDiscoverableCircles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CirclesPage() {
  const { circles, source } = await getDiscoverableCircles(60);

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

        <div className="yt-channel-list">
          {circles.map((circle, index) => (
            <CircleCard key={circle.id} circle={circle} rank={index + 1} />
          ))}
        </div>
      </main>
    </PageShell>
  );
}
