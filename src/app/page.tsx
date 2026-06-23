import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { DataModeBanner } from "@/components/DataModeBanner";
import { WorkCard } from "@/components/WorkCard";
import { getLatestWorks } from "@/lib/data";
import { buildCircleFromWorks } from "@/lib/dmm-transform";
import { DEMO_CIRCLE } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { works: latestWorks, source } = await getLatestWorks(8);
  const featuredCircle =
    source === "dmm" && latestWorks.length > 0
      ? buildCircleFromWorks(
          latestWorks[0].circleId,
          latestWorks.filter((w) => w.circleId === latestWorks[0].circleId)
        ) ?? DEMO_CIRCLE
      : DEMO_CIRCLE;

  return (
    <PageShell active="home">
      <DataModeBanner source={source} />
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="home-hero-text">
            <p className="eyebrow">FANZA同人 × サークル軸データベース</p>
            <h1>
              推しサークルの作品を、
              <br />
              全部・横断・続編まで。
            </h1>
            <p className="home-hero-desc">
              漫画・CG・音声・ゲームを1つのサークルページで。
              <br />
              コレクターが「次に何を買うか」がすぐわかるサイト。
            </p>
            <div className="home-hero-actions">
              <Link href="/circle" className="btn btn-primary btn-lg">
                サークルページを見る
              </Link>
              <Link
                href={`/work/${latestWorks[0]?.id ?? "voice-001"}`}
                className="btn btn-secondary btn-lg"
              >
                最新作品を見る
              </Link>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="flow-card">
              <div className="flow-step">
                <span>1</span> サークルを見つける
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <span>2</span> 全媒体の作品を一覧
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <span>3</span> 詳細 → FANZA購入
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="home-section">
          <h2>媒体から探す</h2>
          <div className="media-entry-grid">
            {[
              { icon: "📕", label: "漫画" },
              { icon: "🎨", label: "CG集" },
              { icon: "🎧", label: "音声" },
              { icon: "🎮", label: "ゲーム" },
            ].map((item) => (
              <Link key={item.label} href="/circle" className="media-entry">
                <span className="media-entry-icon">{item.icon}</span>
                <strong>{item.label}</strong>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>新着作品</h2>
            <span className="section-sub">同人漫画 · 発売日の新しい順</span>
            <Link href="/circle" className="link-more">
              サークル一覧 →
            </Link>
          </div>
          <div className="works-grid">
            {latestWorks.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>注目サークル</h2>
          </div>
          <div className="circle-list">
            <Link
              href={`/circle?id=${featuredCircle.id}`}
              className="circle-list-item"
            >
              <div className="circle-avatar sm">{featuredCircle.initial}</div>
              <div>
                <strong>{featuredCircle.name}</strong>
                <p>
                  {source === "dmm"
                    ? "作品を横断して一覧"
                    : "デモ用サークルページ"}
                </p>
              </div>
              {source === "dmm" ? (
                <span className="pill">サークル</span>
              ) : (
                <span className="pill">サンプル</span>
              )}
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
