import {
  chunkSitemapEntries,
  getWorkSitemapEntries,
  SITEMAP_WORKS_CHUNK_SIZE,
} from "@/lib/sitemap-data";
import { buildSitemapXml, sitemapXmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

type Props = {
  params: Promise<{ page: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { page: pageParam } = await params;
  const pageNumber = Number.parseInt(pageParam, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    return new Response("Not Found", { status: 404 });
  }

  const entries = await getWorkSitemapEntries();
  const chunks = chunkSitemapEntries(entries, SITEMAP_WORKS_CHUNK_SIZE);
  const chunk = chunks[pageNumber - 1];

  if (!chunk?.length) {
    return new Response("Not Found", { status: 404 });
  }

  return sitemapXmlResponse(buildSitemapXml(chunk));
}
