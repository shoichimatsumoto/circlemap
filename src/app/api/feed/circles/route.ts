import { NextResponse } from "next/server";
import { getDiscoverableCircles } from "@/lib/data";

export const dynamic = "force-dynamic";

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
  const sortParam = url.searchParams.get("sort");
  const sort = sortParam === "name" ? "name" : "popular";
  const { offset, limit } = parsePaging(url);

  try {
    const { circles, hasMore, source } = await getDiscoverableCircles(
      limit,
      sort,
      offset
    );
    return NextResponse.json({ items: circles, hasMore, source });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load circles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
