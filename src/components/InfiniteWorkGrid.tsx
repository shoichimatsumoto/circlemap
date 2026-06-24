"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
};

export function InfiniteWorkGrid({
  initialWorks,
  feedType,
  hasMore: initialHasMore,
  pageSize = 24,
  mediaType,
  query,
  keyPrefix = "",
}: Props) {
  const [works, setWorks] = useState(initialWorks);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorks(initialWorks);
    setHasMore(initialHasMore);
  }, [initialWorks, initialHasMore, feedType, mediaType, query]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

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
  }, [feedType, hasMore, loading, mediaType, pageSize, query, works.length]);

  useEffect(() => {
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
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="yt-grid">
        {works.map((work) => (
          <WorkCard key={`${keyPrefix}${work.id}`} work={work} />
        ))}
      </div>
      {hasMore ? (
        <div ref={sentinelRef} className="infinite-sentinel" aria-hidden>
          {loading ? (
            <p className="infinite-loading">読み込み中…</p>
          ) : (
            <p className="infinite-loading infinite-loading-idle">スクロールで続きを表示</p>
          )}
        </div>
      ) : works.length > 0 ? (
        <p className="infinite-end">すべて表示しました</p>
      ) : null}
    </>
  );
}
