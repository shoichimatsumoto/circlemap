import { NextResponse } from "next/server";
import { getDataMode, getLatestWorks } from "@/lib/data";

export async function GET() {
  const mode = await getDataMode();
  const { works, source } = await getLatestWorks(3);

  return NextResponse.json({
    ...mode,
    source,
    linkAffiliateConfigured: Boolean(
      process.env.DMM_LINK_AFFILIATE_ID ?? process.env.DMM_SITE_AFFILIATE_ID
    ),
    sampleWorks: works.map((w) => ({
      id: w.id,
      title: w.title,
      circleName: w.circleName,
      mediaType: w.mediaType,
    })),
  });
}
