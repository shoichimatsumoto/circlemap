import { getSitemapChildUrls } from "@/lib/sitemap-data";
import { buildSitemapIndexXml, sitemapXmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const childUrls = await getSitemapChildUrls();
  const xml = buildSitemapIndexXml(childUrls, new Date());
  return sitemapXmlResponse(xml);
}
