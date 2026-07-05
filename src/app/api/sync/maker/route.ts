import { NextResponse } from "next/server";
import { checkSyncAuth } from "@/lib/sync-auth";
import { syncMakerToSupabase } from "@/lib/supabase-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = checkSyncAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
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
