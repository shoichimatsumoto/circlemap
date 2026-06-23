import Link from "next/link";
import type { Circle } from "@/lib/types";
import { formatPrice } from "@/lib/types";

export function CircleCard({
  circle,
  rank,
}: {
  circle: Circle;
  rank?: number;
}) {
  return (
    <Link href={`/circle?id=${circle.id}`} className="yt-channel-card">
      <div className="yt-channel-avatar">{circle.initial}</div>
      <div className="yt-channel-info">
        {rank != null && <span className="yt-rank">#{rank}</span>}
        <strong className="yt-channel-name">{circle.name}</strong>
        <p className="yt-channel-meta">
          人気作 {circle.workCount}件 · 平均 {formatPrice(circle.avgPrice)}
        </p>
        <p className="yt-channel-meta">最新作 {circle.latestDate}</p>
      </div>
    </Link>
  );
}
