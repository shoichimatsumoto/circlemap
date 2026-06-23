import { NextResponse } from "next/server";
import { getDataMode, getLatestWorks } from "@/lib/data";

export async function GET() {
  const mode = getDataMode();
  const { works, source } = await getLatestWorks(3);

  return NextResponse.json({
    ...mode,
    source,
    sampleWorks: works.map((w) => ({
      id: w.id,
      title: w.title,
      circleName: w.circleName,
      mediaType: w.mediaType,
    })),
  });
}
