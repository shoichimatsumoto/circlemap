import Link from "next/link";
import { getDiscoverableCircles, getPopularWorks } from "@/lib/data";
import { MEDIA_NAMES } from "@/lib/types";

const LINK_LIMIT = 48;

export async function SeoDiscoveryLinks() {
  const [{ circles }, { works }] = await Promise.all([
    getDiscoverableCircles(LINK_LIMIT, "popular"),
    getPopularWorks(LINK_LIMIT),
  ]);

  if (circles.length === 0 && works.length === 0) {
    return null;
  }

  return (
    <nav className="seo-discovery" aria-label="サイト内の人気ページ">
      {circles.length > 0 && (
        <section className="seo-discovery-section">
          <h2 className="seo-discovery-title">人気サークル</h2>
          <ul className="seo-discovery-list">
            {circles.map((circle) => (
              <li key={circle.id}>
                <Link href={`/circle?id=${encodeURIComponent(circle.id)}`}>
                  {circle.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {works.length > 0 && (
        <section className="seo-discovery-section">
          <h2 className="seo-discovery-title">人気作品</h2>
          <ul className="seo-discovery-list">
            {works.map((work) => (
              <li key={work.id}>
                <Link href={`/work/${work.id}`}>
                  {work.circleName}（{MEDIA_NAMES[work.mediaType]}）
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </nav>
  );
}
