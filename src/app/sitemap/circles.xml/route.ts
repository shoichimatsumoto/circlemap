import { getCircleSitemapEntries } from "@/lib/sitemap-data";
import { buildSitemapXml, sitemapXmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const entries = await getCircleSitemapEntries();
  return sitemapXmlResponse(buildSitemapXml(entries));
}
