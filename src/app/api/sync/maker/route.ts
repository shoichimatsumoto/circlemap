import { NextResponse } from "next/server";
import { syncMakerToSupabase } from "@/lib/supabase-sync";

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

  const url = new URL(request.url);
  const makerId = url.searchParams.get("makerId")?.trim();

  if (!makerId || !/^\d+$/.test(makerId)) {
    return NextResponse.json(
      { ok: false, message: "makerId（数値）を指定してください。例: ?makerId=235285" },
      { status: 400 }
    );
  }

  try {
    const result = await syncMakerToSupabase(makerId);
    return NextResponse.json({
      ok: true,
      message: `${result.circleName} の同期完了`,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "同期に失敗しました";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
