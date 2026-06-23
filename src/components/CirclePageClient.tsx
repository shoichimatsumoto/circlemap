"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WorkCard } from "@/components/WorkCard";
import {
  formatWorkMeta,
  MEDIA_LABELS,
  MEDIA_NAMES,
  type Circle,
  type MediaType,
  type Work,
} from "@/lib/types";

type Filter = "all" | MediaType;

type SortKey = "new" | "old" | "price";

type Props = {
  circle: Circle;
  works: Work[];
  featured: Work;
};

function sortWorks(works: Work[], sort: SortKey): Work[] {
  const list = [...works];
  switch (sort) {
    case "old":
      return list.sort((a, b) => a.date.localeCompare(b.date));
    case "price":
      return list.sort((a, b) => a.price - b.price);
    default:
      return list.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export function CirclePageClient({ circle, works, featured }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [favorite, setFavorite] = useState(false);

  const chips: { filter: Filter; icon: string; label: string; count: number }[] =
    [
      { filter: "all", icon: "📚", label: "すべて", count: circle.workCount },
      { filter: "manga", icon: "📕", label: "漫画", count: circle.mangaCount },
      { filter: "cg", icon: "🎨", label: "CG", count: circle.cgCount },
      { filter: "voice", icon: "🎧", label: "音声", count: circle.voiceCount },
      { filter: "game", icon: "🎮", label: "ゲーム", count: circle.gameCount },
    ];

  const filteredWorks = useMemo(() => {
    const byMedia =
      filter === "all" ? works : works.filter((w) => w.mediaType === filter);
    return sortWorks(byMedia, sort);
  }, [filter, sort, works]);

  return (
    <>
      <section className="circle-hero">
        <div className="circle-avatar">{circle.initial}</div>
        <div className="circle-info">
          <p className="circle-label">サークル</p>
          <h1>{circle.name}</h1>
          <p className="circle-desc">{circle.description}</p>
          <div className="circle-meta">
            <span>
              📦 作品数 <strong>{circle.workCount}</strong>
            </span>
            <span>
              📅 最新作 <strong>{circle.latestDate}</strong>
            </span>
            <span>
              💴 平均価格 <strong>¥{circle.avgPrice.toLocaleString()}</strong>
            </span>
          </div>
          <div className="circle-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setFavorite((v) => !v)}
            >
              {favorite ? "★ お気に入り済" : "★ お気に入り"}
            </button>
            <button className="btn btn-secondary" type="button">
              🔔 新作通知
            </button>
          </div>
        </div>
      </section>

      <section className="media-summary">
        {chips.map((chip) => (
          <button
            key={chip.filter}
            type="button"
            className={`media-chip${filter === chip.filter ? " active" : ""}`}
            onClick={() => setFilter(chip.filter)}
          >
            <span className="chip-icon">{chip.icon}</span>
            <span className="chip-label">{chip.label}</span>
            <span className="chip-count">{chip.count}</span>
          </button>
        ))}
      </section>

      <section className="filters">
        <div className="filter-group">
          <label htmlFor="sort">並び替え</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="new">新しい順</option>
            <option value="old">古い順</option>
            <option value="price">価格が安い順</option>
          </select>
        </div>
        <div className="filter-tags">
          {circle.tags.map((tag, i) => (
            <span key={tag} className={`tag${i === 0 ? " active" : ""}`}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="latest-work">
        <h2>最新作</h2>
        <article className="featured-card">
          <Link
            href={`/work/${featured.id}`}
            className={`featured-thumb ${featured.mediaType}`}
          >
            {featured.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.thumbnailUrl}
                alt=""
                className="featured-thumb-image"
              />
            ) : null}
            <span className="media-badge">
              {MEDIA_LABELS[featured.mediaType]}{" "}
              {MEDIA_NAMES[featured.mediaType]}
            </span>
          </Link>
          <div className="featured-body">
            <h3>
              <Link href={`/work/${featured.id}`} className="text-link">
                {featured.title}
              </Link>
            </h3>
            <p className="featured-meta">
              {formatWorkMeta(featured)} · {featured.date}
            </p>
            <div className="tag-row">
              {featured.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="featured-actions">
              <Link href={`/work/${featured.id}`} className="btn btn-play">
                詳細を見る
              </Link>
              {featured.affiliateUrl && (
                <a
                  href={featured.affiliateUrl}
                  className="btn btn-fanza"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FANZAで見る
                </a>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="works-grid-section">
        <h2>
          作品一覧{" "}
          <span className="section-count">{filteredWorks.length}件表示</span>
        </h2>
        <div className="works-grid">
          {filteredWorks.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </section>
    </>
  );
}
