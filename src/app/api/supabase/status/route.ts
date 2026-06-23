import { NextResponse } from "next/server";
import {
  createSupabaseAnonClient,
  hasSupabasePublicConfig,
  hasSupabaseServiceConfig,
  normalizeSupabaseUrl,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const normalizedUrl = rawUrl ? normalizeSupabaseUrl(rawUrl) : "";

  const checks = {
    url: Boolean(rawUrl),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    urlHadRestSuffix: rawUrl.includes("/rest/v1"),
    normalizedUrl,
  };

  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({
      ok: false,
      message: "Supabase の公開キーが未設定です",
      checks,
    });
  }

  const supabase = createSupabaseAnonClient();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      message: "Supabase クライアントを作成できませんでした",
      checks,
    });
  }

  const [circlesResult, worksResult] = await Promise.all([
    supabase.from("circles").select("*", { count: "exact", head: true }),
    supabase.from("works").select("*", { count: "exact", head: true }),
  ]);

  const circlesError = circlesResult.error?.message;
  const worksError = worksResult.error?.message;

  return NextResponse.json({
    ok: !circlesResult.error && !worksResult.error,
    message:
      circlesResult.error || worksResult.error
        ? "接続はできましたがテーブル読み取りでエラーがあります"
        : "Supabase 接続OK",
    checks: {
      ...checks,
      serviceRoleConfigured: hasSupabaseServiceConfig(),
    },
    hint:
      checks.urlHadRestSuffix
        ? "URL末尾の /rest/v1/ は不要です。https://xxxx.supabase.co の形式にしてください"
        : null,
    circlesCount: circlesResult.count ?? 0,
    worksCount: worksResult.count ?? 0,
    errors: {
      circles: circlesError ?? null,
      works: worksError ?? null,
    },
  });
}
