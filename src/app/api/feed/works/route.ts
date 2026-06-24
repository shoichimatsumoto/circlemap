import { NextResponse } from "next/server";
import {
  getDiscoverableCircles,
  getLatestWorks,
  getPopularWorks,
  getWorksByMedia,
  searchWorks,
} from "@/lib/data";
import type { MediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

const MEDIA_TYPES = new Set(["manga", "cg", "voice", "game"]);

function parsePaging(url: URL) {
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));
  const limit = Math.min(
    48,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "24", 10))
  );
  return { offset, limit };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const { offset, limit } = parsePaging(url);

  try {
    if (type === "popular") {
      const { works, hasMore, source } = await getPopularWorks(limit, offset);
      return NextResponse.json({ items: works, hasMore, source });
    }

    if (type === "latest") {
      const { works, hasMore, source } = await getLatestWorks(limit, offset);
      return NextResponse.json({ items: works, hasMore, source });
    }

    if (type === "media") {
      const mediaType = url.searchParams.get("mediaType") ?? "";
      if (!MEDIA_TYPES.has(mediaType)) {
        return NextResponse.json(
          { error: "Invalid mediaType" },
          { status: 400 }
        );
      }
      const { works, hasMore, source } = await getWorksByMedia(
        mediaType as MediaType,
        limit,
        offset
      );
      return NextResponse.json({ items: works, hasMore, source });
    }

    if (type === "search") {
      const q = url.searchParams.get("q")?.trim() ?? "";
      if (!q) {
        return NextResponse.json({ items: [], hasMore: false, source: "mock" });
      }
      const { works, hasMore, source } = await searchWorks(q, limit, offset);
      return NextResponse.json({ items: works, hasMore, source });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load works";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
