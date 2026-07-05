import { getStaticSitemapEntries } from "@/lib/sitemap-data";
import { getSiteUrl } from "@/lib/site";
import { buildSitemapXml, sitemapXmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const entries = getStaticSitemapEntries(getSiteUrl(), new Date());
  return sitemapXmlResponse(buildSitemapXml(entries));
}
