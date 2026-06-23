import Link from "next/link";
import {
  formatPrice,
  formatWorkMeta,
  MEDIA_LABELS,
  type Work,
} from "@/lib/types";

export function WorkCard({
  work,
  compact,
}: {
  work: Work;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/work/${work.id}`}
      className="work-card link-card"
      data-type={work.mediaType}
    >
      <div className={`work-thumb ${work.mediaType}`}>
        {work.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.thumbnailUrl} alt="" className="work-thumb-image" />
        ) : null}
        <span className="media-badge">{MEDIA_LABELS[work.mediaType]}</span>
      </div>
      <h3 className="work-card-title">{work.title}</h3>
      <p className="work-price">{formatPrice(work.price)}</p>
      <p className="work-meta">
        {compact
          ? formatWorkMeta(work).split(" · ")[0]
          : `${work.circleName} · ${formatWorkMeta(work)}`}
      </p>
      {!compact && <p className="work-date">{work.date}</p>}
      {work.tags.length > 0 && (
        <div className="tag-row">
          {work.tags.slice(0, 1).map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
