"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WorkCard } from "@/components/WorkCard";
import type { MediaType, Work } from "@/lib/types";

export type WorkFeedType = "popular" | "latest" | "media" | "search";

type Props = {
  initialWorks: Work[];
  feedType: WorkFeedType;
  hasMore: boolean;
  pageSize?: number;
  mediaType?: MediaType;
  query?: string;
  keyPrefix?: string;
  /** false で無限スクロールを止め、初期件数だけ表示（ホーム向け） */
  infinite?: boolean;
  moreHref?: string;
  moreLabel?: string;
};

export function InfiniteWorkGrid({
  initialWorks,
  feedType,
  hasMore: initialHasMore,
  pageSize = 24,
  mediaType,
  query,
  keyPrefix = "",
  infinite = true,
  moreHref,
  moreLabel = "もっと見る →",
}: Props) {
  const [works, setWorks] = useState(initialWorks);
  const [hasMore, setHasMore] = useState(infinite ? initialHasMore : false);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorks(initialWorks);
    setHasMore(infinite ? initialHasMore : false);
  }, [initialWorks, initialHasMore, feedType, mediaType, query, infinite]);

  const loadMore = useCallback(async () => {
    if (!infinite || loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: feedType,
        offset: String(works.length),
        limit: String(pageSize),
      });
      if (mediaType) params.set("mediaType", mediaType);
      if (query) params.set("q", query);

      const res = await fetch(`/api/feed/works?${params.toString()}`);
      if (!res.ok) return;

      const data = (await res.json()) as {
        items?: Work[];
        hasMore?: boolean;
      };

      if (data.items?.length) {
        setWorks((prev) => {
          const seen = new Set(prev.map((w) => w.id));
          const next = data.items!.filter((w) => !seen.has(w.id));
          return [...prev, ...next];
        });
      }
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }, [
    feedType,
    hasMore,
    infinite,
    loading,
    mediaType,
    pageSize,
    query,
    works.length,
  ]);

  useEffect(() => {
    if (!infinite) return;
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "240px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, infinite, loadMore]);

  return (
    <>
      <div className="yt-grid">
        {works.map((work) => (
          <WorkCard key={`${keyPrefix}${work.id}`} work={work} />
        ))}
      </div>
      {!infinite && moreHref ? (
        <p className="feed-section-more">
          <Link href={moreHref} className="feed-more-btn">
            {moreLabel}
            <span aria-hidden> →</span>
          </Link>
        </p>
      ) : null}
      {infinite && hasMore ? (
        <div ref={sentinelRef} className="infinite-sentinel" aria-hidden>
          {loading ? (
            <p className="infinite-loading">読み込み中…</p>
          ) : (
            <p className="infinite-loading infinite-loading-idle">スクロールで続きを表示</p>
          )}
        </div>
      ) : infinite && works.length > 0 ? (
        <p className="infinite-end">すべて表示しました</p>
      ) : null}
    </>
  );
}
