import Link from "next/link";
import {
  formatPrice,
  MEDIA_NAMES,
  circleInitial,
  type Work,
} from "@/lib/types";

export function WorkCard({
  work,
  compact,
}: {
  work: Work;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link href={`/work/${work.id}`} className="work-card link-card compact">
        <div className={`work-thumb ${work.mediaType}`}>
          {work.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.thumbnailUrl} alt="" className="work-thumb-image" />
          ) : null}
        </div>
        <h3 className="work-card-title">{work.title}</h3>
        <p className="work-meta">{formatPrice(work.price)}</p>
      </Link>
    );
  }

  return (
    <Link href={`/work/${work.id}`} className="yt-card" data-type={work.mediaType}>
      <div className="yt-thumb-wrap">
        {work.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.thumbnailUrl} alt="" className="yt-thumb-image" />
        ) : (
          <div className={`yt-thumb-fallback ${work.mediaType}`}>
            {MEDIA_NAMES[work.mediaType]}
          </div>
        )}
        <span className="yt-media-badge">{MEDIA_NAMES[work.mediaType]}</span>
      </div>
      <div className="yt-card-meta">
        <div className="yt-card-avatar">{circleInitial(work.circleName)}</div>
        <div className="yt-card-text">
          <h3 className="yt-card-title">{work.title}</h3>
          <p className="yt-card-channel">{work.circleName}</p>
          <p className="yt-card-stats">
            {formatPrice(work.price)} · {work.date}
          </p>
        </div>
      </div>
    </Link>
  );
}
