"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCard } from "@/components/CircleCard";
import type { Circle } from "@/lib/types";

type Props = {
  initialCircles: Circle[];
  sort: "popular" | "name";
  hasMore: boolean;
  pageSize?: number;
  layout?: "grid" | "list";
  showRank?: boolean;
};

export function InfiniteCircleList({
  initialCircles,
  sort,
  hasMore: initialHasMore,
  pageSize = 24,
  layout = "list",
  showRank = false,
}: Props) {
  const [circles, setCircles] = useState(initialCircles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCircles(initialCircles);
    setHasMore(initialHasMore);
  }, [initialCircles, initialHasMore, sort]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        offset: String(circles.length),
        limit: String(pageSize),
      });

      const res = await fetch(`/api/feed/circles?${params.toString()}`);
      if (!res.ok) return;

      const data = (await res.json()) as {
        items?: Circle[];
        hasMore?: boolean;
      };

      if (data.items?.length) {
        setCircles((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          const next = data.items!.filter((c) => !seen.has(c.id));
          return [...prev, ...next];
        });
      }
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }, [circles.length, hasMore, loading, pageSize, sort]);

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

  const listClass =
    layout === "grid" ? "yt-channel-grid" : "yt-channel-list";

  return (
    <>
      <div className={listClass}>
        {circles.map((circle, index) => (
          <CircleCard
            key={circle.id}
            circle={circle}
            rank={showRank ? index + 1 : undefined}
          />
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
      ) : circles.length > 0 ? (
        <p className="infinite-end">すべて表示しました</p>
      ) : null}
    </>
  );
}
