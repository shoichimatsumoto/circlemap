"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import { WorkCard } from "@/components/WorkCard";
import { WorkSampleGallery } from "@/components/WorkSampleGallery";
import { relatedByTagHeading } from "@/lib/related-by-tag";
import {
  formatPrice,
  formatWorkMeta,
  MEDIA_NAMES,
  type Work,
} from "@/lib/types";

type Props = {
  work: Work;
  relatedWorks: Work[];
  relatedByTagWorks?: Work[];
  relatedByTagLabels?: string[];
  /** 購入CTAより下に出す（同人ログなど） */
  doujinLogBanner?: ReactNode;
};

type FanzaSource = "work_page" | "work_page_sticky";

export function WorkPageClient({
  work,
  relatedWorks,
  relatedByTagWorks = [],
  relatedByTagLabels = [],
  doujinLogBanner,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function trackFanzaClick(source: FanzaSource) {
    track("fanza_click", {
      workId: work.id,
      mediaType: work.mediaType,
      source,
    });
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setProgress(0);
    let p = 0;
    const id = window.setInterval(() => {
      p += 4;
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(id);
        setPlaying(false);
      }
    }, 80);
  }

  return (
    <>
      <article className="work-detail">
        <div className="work-detail-main">
          <div className="work-detail-info">
            <p className="work-detail-type">
              {MEDIA_NAMES[work.mediaType]}作品 · {work.circleName}
            </p>
            <h1>{work.title}</h1>
            <p className="work-detail-meta">
              {formatWorkMeta(work)} · {work.date} 発売
            </p>

            <div className="work-detail-actions">
              {work.affiliateUrl ? (
                <a
                  href={work.affiliateUrl}
                  className="btn btn-fanza btn-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackFanzaClick("work_page")}
                >
                  FANZAで購入する
                </a>
              ) : (
                <button className="btn btn-fanza btn-lg" type="button" disabled>
                  FANZAで購入する
                </button>
              )}
              <button className="btn btn-secondary work-favorite-btn" type="button">
                ★ お気に入り
              </button>
            </div>

            <p className="affiliate-note">
              ※ 購入はFANZAで完結。CircleMap経由の購入でアフィリエイト報酬が発生します。
            </p>
          </div>

          <WorkSampleGallery
            key={work.id}
            workId={work.id}
            title={work.title}
            thumbnailUrl={work.thumbnailUrl}
            sampleImages={work.sampleImages}
            mediaType={work.mediaType}
          />

          <div className="work-detail-extra">
            <div className="tag-row">
              {work.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="tag tag-link"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {work.mediaType === "voice" && (
              <div className="sample-player">
                <div className="sample-player-head">
                  <strong>試聴サンプル</strong>
                  <span className="sample-duration">2:30 / 2:30</span>
                </div>
                <div className="sample-wave">
                  <div
                    className="sample-progress"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="sample-controls">
                  <button
                    className="btn btn-play"
                    type="button"
                    onClick={togglePlay}
                  >
                    {playing ? "⏸ 停止" : "▶ 再生"}
                  </button>
                  <span className="sample-note">
                    ※ 実際はDMM提供のサンプル音声URL
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {work.description && (
          <section className="work-description">
            <h2>作品情報</h2>
            <p>{work.description}</p>
            <dl className="info-list">
              <dt>サークル</dt>
              <dd>
                <Link href={`/circle?id=${work.circleId}`}>{work.circleName}</Link>
              </dd>
              <dt>価格</dt>
              <dd>{formatPrice(work.price)}（税込）</dd>
            </dl>
          </section>
        )}
      </article>

      {doujinLogBanner}

      {relatedWorks.length > 0 && (
        <section className="work-section">
          <div className="section-head">
            <h2>{work.circleName}の他作品</h2>
            <Link href={`/circle?id=${work.circleId}`} className="link-more">
              サークルページ →
            </Link>
          </div>
          <div className="yt-grid">
            {relatedWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
          <p className="cross-media-note">
            💡 同じサークルの<strong>漫画・CG・音声・AI</strong>
            がここで横断表示 — これがCircleMapの差別化
          </p>
        </section>
      )}

      {relatedByTagWorks.length > 0 && (
        <section className="work-section">
          <div className="section-head">
            <h2>{relatedByTagHeading(relatedByTagLabels)}</h2>
            {relatedByTagLabels[0] && (
              <Link
                href={`/search?q=${encodeURIComponent(relatedByTagLabels[0])}`}
                className="link-more"
              >
                「#{relatedByTagLabels[0]}」をもっと見る →
              </Link>
            )}
          </div>
          <p className="related-by-tag-lead">
            #{relatedByTagLabels.join(" #")}{" "}
            などでつながる、別サークルの作品です。
          </p>
          <div className="yt-grid">
            {relatedByTagWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

      {work.affiliateUrl && (
        <div className="work-fanza-sticky" role="region" aria-label="購入">
          <div className="work-fanza-sticky-inner">
            <div className="work-fanza-sticky-meta">
              <span className="work-fanza-sticky-price">
                {formatPrice(work.price)}
              </span>
              <span className="work-fanza-sticky-title">{work.title}</span>
            </div>
            <a
              href={work.affiliateUrl}
              className="btn btn-fanza work-fanza-sticky-btn"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFanzaClick("work_page_sticky")}
            >
              FANZAで購入
            </a>
          </div>
        </div>
      )}
    </>
  );
}
