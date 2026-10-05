/**
 * 作品コメントを FANZA 詳細から補完して Supabase に保存する。
 *
 * 使い方:
 *   npx tsx scripts/backfill-comments.ts d_761881
 *   npx tsx scripts/backfill-comments.ts --popular 30
 *
 * Vercel から FANZA へ届かない場合のローカル実行用。
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const {
    fetchFanzaWorkComment,
    dbSaveWorkDescription,
  } = await import("../src/lib/fanza-comment");
  const { isUsefulWorkDescription } = await import("../src/lib/dmm-transform");
  const { createSupabaseServiceClient } = await import("../src/lib/supabase");

  const args = process.argv.slice(2);
  const popularIdx = args.indexOf("--popular");
  let ids: string[] = [];

  if (popularIdx >= 0) {
    const limit = Number(args[popularIdx + 1] ?? 20);
    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      console.error("SUPABASE_SERVICE_ROLE_KEY が必要です");
      process.exit(1);
    }
    const { data, error } = await supabase
      .from("works")
      .select("id,description")
      .not("popularity_rank", "is", null)
      .order("popularity_rank", { ascending: true })
      .limit(Number.isFinite(limit) ? limit : 20);
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    ids = (data ?? [])
      .filter((row) => !isUsefulWorkDescription(row.description ?? undefined))
      .map((row) => row.id as string);
  } else {
    ids = args.filter((a) => !a.startsWith("--"));
  }

  if (ids.length === 0) {
    console.log("対象がありません。cid を指定するか --popular N を使ってください。");
    process.exit(0);
  }

  let ok = 0;
  let skip = 0;
  let failed = 0;
  for (const id of ids) {
    const comment = await fetchFanzaWorkComment(id);
    if (!comment) {
      console.log(`MISS ${id}`);
      skip++;
      continue;
    }
    const saved = await dbSaveWorkDescription(id, comment);
    console.log(
      `${saved.ok ? "SAVE" : "FAIL"} ${id} (${comment.length} chars)${
        saved.error ? ` [${saved.error}]` : ""
      }`
    );
    if (saved.ok) ok++;
    else failed++;
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log(`done ok=${ok} skip=${skip} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
