import { NextResponse } from "next/server";
import {
  createSupabaseAnonClient,
  hasSupabasePublicConfig,
  hasSupabaseServiceConfig,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
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
    circlesCount: circlesResult.count ?? 0,
    worksCount: worksResult.count ?? 0,
    errors: {
      circles: circlesError ?? null,
      works: worksError ?? null,
    },
  });
}
