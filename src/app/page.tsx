import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { DataModeBanner } from "@/components/DataModeBanner";
import { WorkCard } from "@/components/WorkCard";
import { getLatestWorks } from "@/lib/data";
import { buildCircleFromWorks } from "@/lib/dmm-transform";
import { DEMO_CIRCLE } from "@/lib/mock-data";
import { MEDIA_LABELS, MEDIA_NAMES, type MediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

const mediaEntries: {
  type: MediaType;
  label: string;
  desc: string;
}[] = [
  { type: "manga", label: "漫画", desc: "同人漫画" },
  { type: "cg", label: "CG集", desc: "イラスト・CG" },
  { type: "voice", label: "音声", desc: "ボイス作品" },
  { type: "game", label: "ゲーム", desc: "同人ゲーム" },
];

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
            <p className="eyebrow">FANZA同人 × サークル軸</p>
            <h1>
              推しサークルの作品を、
              <br />
              全媒体まとめて探す。
            </h1>
            <p className="home-hero-desc">
              漫画・CG・音声・ゲームをサークルページで横断。
              コレクターが「次に何を買うか」がすぐわかるサイトです。
            </p>
            <div className="home-hero-actions">
              <Link href="/circle" className="btn btn-primary btn-lg">
                サークルを探す
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
            <div className="hero-preview-grid">
              {latestWorks.slice(0, 3).map((work, index) => (
                <Link
                  key={work.id}
                  href={`/work/${work.id}`}
                  className={`hero-preview-card hero-preview-${index + 1}`}
                >
                  {work.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={work.thumbnailUrl} alt="" />
                  ) : (
                    <div className={`hero-preview-fallback ${work.mediaType}`}>
                      {MEDIA_LABELS[work.mediaType]}
                    </div>
                  )}
                  <span className="hero-preview-badge">
                    {MEDIA_NAMES[work.mediaType]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="home-section">
          <h2>媒体から探す</h2>
          <div className="media-entry-grid">
            {mediaEntries.map((item) => (
              <Link
                key={item.type}
                href={`/media/${item.type}`}
                className={`media-entry media-entry-${item.type}`}
              >
                <span className="media-entry-icon">
                  {MEDIA_LABELS[item.type]}
                </span>
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>新着作品</h2>
            <span className="section-sub">同人漫画 · 発売日の新しい順</span>
            <Link href="/media/manga" className="link-more">
              もっと見る →
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
                <p>作品を横断して一覧</p>
              </div>
              <span className="pill">サークル</span>
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
