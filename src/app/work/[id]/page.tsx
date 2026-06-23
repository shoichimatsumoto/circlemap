import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DataModeBanner } from "@/components/DataModeBanner";
import { WorkPageClient } from "@/components/WorkPageClient";
import { getWork } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const { work, relatedWorks, source } = await getWork(id);

  if (!work) notFound();

  return (
    <PageShell active="work">
      <DataModeBanner source={source} />
      <main className="container">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/circle?id=${work.circleId}`}>{work.circleName}</Link>
          <span>/</span>
          <span>{work.title}</span>
        </nav>
        <WorkPageClient work={work} relatedWorks={relatedWorks} />
      </main>
    </PageShell>
  );
}
