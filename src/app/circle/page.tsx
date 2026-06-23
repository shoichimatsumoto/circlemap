import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CirclePageClient } from "@/components/CirclePageClient";
import { DataModeBanner } from "@/components/DataModeBanner";
import { getCirclePage } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function CirclePage({ searchParams }: Props) {
  const { id } = await searchParams;
  const { circle, works, featured, source } = await getCirclePage(id ?? "demo");

  return (
    <PageShell active="circle">
      <DataModeBanner source={source} />
      <main className="container">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/circle">サークル</Link>
          <span>/</span>
          <span>{circle.name}</span>
        </nav>
        <CirclePageClient circle={circle} works={works} featured={featured} />
      </main>
    </PageShell>
  );
}
