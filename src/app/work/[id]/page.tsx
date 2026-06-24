import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { DataModeBanner } from "@/components/DataModeBanner";
import { WorkPageClient } from "@/components/WorkPageClient";
import { getWork } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";
import { MEDIA_NAMES } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { work } = await getWork(id);

  if (!work) {
    return { title: "作品が見つかりません" };
  }

  const title = work.title;
  const description = `${work.circleName}の${MEDIA_NAMES[work.mediaType]}「${work.title}」。CircleMapでサークルの他作品も横断検索できます。`;

  return {
    title,
    description,
    alternates: { canonical: `/work/${work.id}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${getSiteUrl()}/work/${work.id}`,
      images: work.thumbnailUrl ? [{ url: work.thumbnailUrl }] : undefined,
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const { work, relatedWorks, source } = await getWork(id);

  if (!work) notFound();

  return (
    <PageShell active="work">
      <DataModeBanner source={source} />
      <div className="feed-wrap">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/circle?id=${work.circleId}`}>{work.circleName}</Link>
          <span>/</span>
          <span className="breadcrumb-current">{work.title}</span>
        </nav>
        <WorkPageClient work={work} relatedWorks={relatedWorks} />
      </div>
    </PageShell>
  );
}
