export type DoujinLogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  circleId?: string;
  workIds: string[];
};

type ArticlesIndex = {
  updatedAt: string;
  byCircle: Record<string, DoujinLogArticle[]>;
  byWork: Record<string, DoujinLogArticle>;
};

const EMPTY_INDEX: ArticlesIndex = { updatedAt: "", byCircle: {}, byWork: {} };

export function getDoujinLogUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_DOUJIN_LOG_URL?.replace(/\/$/, "");
  return url || undefined;
}

export function getDoujinLogArticleUrl(slug: string): string {
  const base = getDoujinLogUrl() ?? "https://doujin-log.vercel.app";
  return `${base}/articles/${slug}`;
}

export async function fetchArticlesIndex(): Promise<ArticlesIndex> {
  const base = getDoujinLogUrl();
  if (!base) return EMPTY_INDEX;

  try {
    const res = await fetch(`${base}/articles-index`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return EMPTY_INDEX;
    return (await res.json()) as ArticlesIndex;
  } catch {
    return EMPTY_INDEX;
  }
}

export async function getArticlesForCircle(circleId: string): Promise<DoujinLogArticle[]> {
  const index = await fetchArticlesIndex();
  return index.byCircle[circleId] ?? [];
}

export async function getArticlesForWork(
  workId: string,
  circleId: string
): Promise<DoujinLogArticle[]> {
  const index = await fetchArticlesIndex();
  const seen = new Set<string>();
  const results: DoujinLogArticle[] = [];

  const workArticle = index.byWork[workId];
  if (workArticle && !seen.has(workArticle.slug)) {
    results.push(workArticle);
    seen.add(workArticle.slug);
  }

  for (const article of index.byCircle[circleId] ?? []) {
    if (!seen.has(article.slug)) {
      results.push(article);
      seen.add(article.slug);
    }
  }

  return results.slice(0, 2);
}
