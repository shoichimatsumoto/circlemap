import { getSitemapEntries } from "@/lib/sitemap-data";
import { buildSitemapXml } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const entries = await getSitemapEntries();
  const xml = buildSitemapXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
