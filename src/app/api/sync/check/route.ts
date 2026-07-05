import { NextResponse } from "next/server";
import { getSyncSecretStatus } from "@/lib/sync-auth";

export const dynamic = "force-dynamic";

/** 認証なし。secret の値は返さず、本番に設定されているかだけ確認 */
export async function GET() {
  const status = getSyncSecretStatus();
  return NextResponse.json({
    ok: status.hasSyncSecret || status.hasCronSecret,
    ...status,
    hint: status.hasSyncSecret
      ? "SYNC_SECRET が Production にあります"
      : status.hasCronSecret
        ? "CRON_SECRET のみ設定されています（?secret= に CRON_SECRET を使えます）"
        : "SYNC_SECRET / CRON_SECRET が未設定です",
  });
}
