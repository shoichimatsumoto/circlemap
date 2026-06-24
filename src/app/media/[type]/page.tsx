import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InfiniteWorkGrid } from "@/components/InfiniteWorkGrid";
import { PageShell } from "@/components/PageShell";
import { DataModeBanner } from "@/components/DataModeBanner";
import { getWorksByMedia } from "@/lib/data";
import {
  MEDIA_LABELS,
  MEDIA_NAMES,
  type MediaType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

const MEDIA_META: Record<
  MediaType,
  { title: string; description: string }
> = {
  manga: {
    title: "同人漫画",
    description: "FANZA同人フロアの漫画作品を新しい順で表示",
  },
  cg: {
    title: "同人CG・イラスト",
    description: "CG集・イラスト集を新しい順で表示",
  },
  voice: {
    title: "同人音声",
    description: "ボイス・音声作品を新しい順で表示",
  },
  game: {
    title: "同人ゲーム",
    description: "アダルトPCゲームを新しい順で表示",
  },
};

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!Object.keys(MEDIA_META).includes(type)) {
    return { title: "ページが見つかりません" };
  }

  const mediaType = type as MediaType;
  const meta = MEDIA_META[mediaType];

  return {
    title: meta.title,
    description: `${meta.description}。サークル軸で横断検索できるCircleMap。`,
    alternates: { canonical: `/media/${type}` },
  };
}

export default async function MediaPage({ params }: Props) {
  const { type } = await params;
  if (!Object.keys(MEDIA_META).includes(type)) notFound();

  const mediaType = type as MediaType;
  const meta = MEDIA_META[mediaType];
  const { works, hasMore, source } = await getWorksByMedia(
    mediaType,
    PAGE_SIZE
  );

  return (
    <PageShell active={mediaType}>
      <DataModeBanner source={source} />
      <div className="feed-wrap page-main">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{meta.title}</span>
        </nav>

        <header className="page-header">
          <p className="page-eyebrow">
            {MEDIA_LABELS[mediaType]} {MEDIA_NAMES[mediaType]}
          </p>
          <h1>{meta.title}</h1>
          <p className="page-desc">{meta.description}</p>
        </header>

        {works.length > 0 ? (
          <InfiniteWorkGrid
            initialWorks={works}
            feedType="media"
            hasMore={hasMore}
            pageSize={PAGE_SIZE}
            mediaType={mediaType}
          />
        ) : (
          <p className="empty-state">該当する作品が見つかりませんでした。</p>
        )}
      </div>
    </PageShell>
  );
}
