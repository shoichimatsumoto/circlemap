import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CircleJsonLd } from "@/components/CircleJsonLd";
import { DataModeBanner } from "@/components/DataModeBanner";
import { PageShell } from "@/components/PageShell";
import { WorkJsonLd } from "@/components/WorkJsonLd";
import { WorkPageClient } from "@/components/WorkPageClient";
import { getWork } from "@/lib/data";
import { buildWorkSeoDescription, buildWorkSeoTitle } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { work } = await getWork(id);

  if (!work) {
    return { title: "作品が見つかりません" };
  }

  const title = buildWorkSeoTitle(work);
  const description = buildWorkSeoDescription(work);
  const pageUrl = `${getSiteUrl()}/work/${work.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/work/${work.id}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: pageUrl,
      images: work.thumbnailUrl ? [{ url: work.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: work.thumbnailUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: work.thumbnailUrl ? [work.thumbnailUrl] : undefined,
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const { work, relatedWorks, source } = await getWork(id);

  if (!work) notFound();

  return (
    <PageShell active="work">
      <WorkJsonLd work={work} />
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
