import { NextResponse } from "next/server";
import { syncDmmToSupabase } from "@/lib/supabase-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const syncSecret = process.env.SYNC_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  if (!syncSecret && !cronSecret) return false;

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret");
  const fromHeader = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (fromQuery && syncSecret && fromQuery === syncSecret) return true;
  if (fromHeader && syncSecret && fromHeader === syncSecret) return true;
  if (fromHeader && cronSecret && fromHeader === cronSecret) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "認証に失敗しました。Vercel に SYNC_SECRET を設定し、?secret=... を付けてください",
      },
      { status: 401 }
    );
  }

  try {
    const result = await syncDmmToSupabase();
    return NextResponse.json({
      ok: true,
      message: "同期完了",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "同期に失敗しました";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
