import Link from "next/link";
import { InfiniteWorkGrid } from "@/components/InfiniteWorkGrid";
import { PageShell } from "@/components/PageShell";
import { DataModeBanner } from "@/components/DataModeBanner";
import { SearchForm } from "@/components/SearchForm";
import { searchWorks } from "@/lib/data";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const { works, hasMore, source } = query
    ? await searchWorks(query, PAGE_SIZE)
    : { works: [], hasMore: false, source: "mock" as const };

  return (
    <PageShell active="search">
      <DataModeBanner source={source} />
      <div className="feed-wrap page-main">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>検索</span>
        </nav>

        <header className="page-header">
          <h1>作品・サークル検索</h1>
          <p className="page-desc">
            キーワードでFANZA同人作品を検索します。
          </p>
          <div className="search-page-form">
            <SearchForm defaultValue={query} />
          </div>
        </header>

        {query ? (
          <>
            <p className="search-result-meta">
              「{query}」の検索結果
              {works.length > 0 ? (
                <>
                  {" "}
                  <strong>{works.length}件以上</strong>
                </>
              ) : null}
            </p>
            {works.length > 0 ? (
              <InfiniteWorkGrid
                key={query}
                initialWorks={works}
                feedType="search"
                hasMore={hasMore}
                pageSize={PAGE_SIZE}
                query={query}
              />
            ) : (
              <p className="empty-state">
                該当する作品が見つかりませんでした。別のキーワードをお試しください。
              </p>
            )}
          </>
        ) : (
          <p className="empty-state">検索キーワードを入力してください。</p>
        )}
      </div>
    </PageShell>
  );
}
