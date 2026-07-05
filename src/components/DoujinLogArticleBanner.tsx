import Link from "next/link";
import {
  getArticlesForCircle,
  getArticlesForWork,
  getDoujinLogArticleUrl,
} from "@/lib/doujin-log";

type CircleProps = {
  circleId: string;
  workId?: never;
};

type WorkProps = {
  circleId: string;
  workId: string;
};

type Props = CircleProps | WorkProps;

export async function DoujinLogArticleBanner(props: Props) {
  const articles =
    "workId" in props && props.workId
      ? await getArticlesForWork(props.workId, props.circleId)
      : await getArticlesForCircle(props.circleId);

  if (articles.length === 0) return null;

  return (
    <section className="doujin-log-banner" aria-label="同人ログ関連記事">
      <div className="doujin-log-banner-head">
        <span className="doujin-log-banner-badge">📖 同人ログ</span>
        <p className="doujin-log-banner-lead">サークルまとめ・ピックアップ記事</p>
      </div>
      <ul className="doujin-log-banner-list">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={getDoujinLogArticleUrl(article.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="doujin-log-banner-card"
            >
              <strong>{article.title}</strong>
              <span>{article.excerpt}</span>
              <em>記事を読む →</em>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
