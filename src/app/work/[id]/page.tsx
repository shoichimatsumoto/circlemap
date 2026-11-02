import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CircleJsonLd } from "@/components/CircleJsonLd";
import { DataModeBanner } from "@/components/DataModeBanner";
import { DoujinLogArticleBanner } from "@/components/DoujinLogArticleBanner";
import { PageShell } from "@/components/PageShell";
import { WorkJsonLd } from "@/components/WorkJsonLd";
import { WorkPageClient } from "@/components/WorkPageClient";
import { getWork } from "@/lib/data";
import { resolveWorkPageSeo } from "@/lib/new-manga-seo-ab-seo";
import { shouldShowWorkAnalysis } from "@/lib/seo-pilot";
import { getSiteUrl } from "@/lib/site";
import { buildWorkShareMetadata } from "@/lib/work-share";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { work, analysis, abGroup } = await getWork(id);

  if (!work) {
    return { title: "作品が見つかりません" };
  }

  const { title, description } = resolveWorkPageSeo(
    work,
    abGroup,
    analysis,
    shouldShowWorkAnalysis(work.id)
  );
  const pageUrl = `${getSiteUrl()}/work/${work.id}`;
  const share = buildWorkShareMetadata(work, pageUrl);

  return {
    title,
    description,
    alternates: { canonical: `/work/${work.id}` },
    openGraph: share.openGraph,
    twitter: share.twitter,
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const {
    work,
    relatedWorks,
    relatedByTagWorks,
    relatedByTagLabels,
    analysis,
    abGroup,
    source,
  } = await getWork(id);

  if (!work) notFound();

  const seo = resolveWorkPageSeo(
    work,
    abGroup,
    analysis,
    shouldShowWorkAnalysis(work.id)
  );

  return (
    <PageShell active="work">
      <WorkJsonLd
        work={work}
        description={seo.enhanced ? seo.description : undefined}
      />
      <DataModeBanner source={source} />
      <div className="feed-wrap">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/circle?id=${work.circleId}`}>{work.circleName}</Link>
          <span>/</span>
          <span className="breadcrumb-current">{work.title}</span>
        </nav>
        <WorkPageClient
          work={work}
          relatedWorks={relatedWorks}
          relatedByTagWorks={relatedByTagWorks}
          relatedByTagLabels={relatedByTagLabels}
          analysis={analysis}
          doujinLogBanner={
            <DoujinLogArticleBanner workId={work.id} circleId={work.circleId} />
          }
        />
      </div>
    </PageShell>
  );
}
