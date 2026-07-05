import { NextResponse } from "next/server";
import { checkSyncAuth } from "@/lib/sync-auth";
import { syncDmmToSupabase } from "@/lib/supabase-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const auth = checkSyncAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
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
