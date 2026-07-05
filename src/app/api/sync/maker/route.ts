import { NextResponse } from "next/server";
import { checkSyncAuth, checkSyncAuthValue } from "@/lib/sync-auth";
import { syncMakerToSupabase } from "@/lib/supabase-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runSync(makerId: string) {
  if (!/^\d+$/.test(makerId)) {
    return NextResponse.json(
      { ok: false, message: "makerId は数値で指定してください（例: 235285）" },
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

export async function GET(request: Request) {
  const auth = checkSyncAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
  }

  const url = new URL(request.url);
  const makerId = url.searchParams.get("makerId")?.trim() ?? "";
  return runSync(makerId);
}

/** URL に secret を載せない（+ や = で壊れない） */
export async function POST(request: Request) {
  let makerId = "";
  let secret = "";

  try {
    const body = (await request.json()) as { makerId?: string; secret?: string };
    makerId = body.makerId?.trim() ?? "";
    secret = body.secret ?? "";
  } catch {
    return NextResponse.json({ ok: false, message: "JSON が不正です" }, { status: 400 });
  }

  const auth = checkSyncAuthValue(secret);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
  }

  return runSync(makerId);
}
