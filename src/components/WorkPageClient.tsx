"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkCard } from "@/components/WorkCard";
import { WorkSampleGallery } from "@/components/WorkSampleGallery";
import {
  formatPrice,
  formatWorkMeta,
  MEDIA_LABELS,
  MEDIA_NAMES,
  type Work,
} from "@/lib/types";

type Props = {
  work: Work;
  relatedWorks: Work[];
};

export function WorkPageClient({ work, relatedWorks }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

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
          <WorkSampleGallery
            key={work.id}
            workId={work.id}
            title={work.title}
            thumbnailUrl={work.thumbnailUrl}
            sampleImages={work.sampleImages}
            mediaType={work.mediaType}
          />

          <div className="work-detail-info">
            <p className="work-detail-type">
              {MEDIA_NAMES[work.mediaType]}作品 · {work.circleName}
            </p>
            <h1>{work.title}</h1>
            <p className="work-detail-meta">
              {formatWorkMeta(work)} · {work.date} 発売
            </p>

            <div className="tag-row">
              {work.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
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

            <div className="work-detail-actions">
              {work.affiliateUrl ? (
                <a
                  href={work.affiliateUrl}
                  className="btn btn-fanza btn-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FANZAで購入する
                </a>
              ) : (
                <button className="btn btn-fanza btn-lg" type="button" disabled>
                  FANZAで購入する
                </button>
              )}
              <button className="btn btn-secondary" type="button">
                ★ お気に入り
              </button>
            </div>

            <p className="affiliate-note">
              ※ 購入はFANZAで完結。CircleMap経由の購入でアフィリエイト報酬が発生します。
            </p>
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
            💡 同じサークルの<strong>漫画・CG・音声</strong>
            がここで横断表示 — これがCircleMapの差別化
          </p>
        </section>
      )}
    </>
  );
}
