#!/usr/bin/env node
/**
 * FANZA maker ID 単位で Supabase に同期
 *
 * 使い方:
 *   npx tsx scripts/sync-maker.ts 235285
 */
import fs from "node:fs";
import path from "node:path";
import { syncMakerToSupabase } from "../src/lib/supabase-sync";

const ROOT = path.join(import.meta.dirname, "..");
const envPath = path.join(ROOT, ".env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const makerId = process.argv[2]?.trim();
if (!makerId || !/^\d+$/.test(makerId)) {
  console.error("使い方: npx tsx scripts/sync-maker.ts <makerId>");
  console.error("例:     npx tsx scripts/sync-maker.ts 235285");
  process.exit(1);
}

console.log(`\n📡 maker ${makerId} を DMM → Supabase に同期中...\n`);

syncMakerToSupabase(makerId)
  .then((result) => {
    console.log("✅ 同期完了");
    console.log(`   サークル: ${result.circleName}`);
    console.log(`   作品数: ${result.worksSynced}`);
    console.log(
      `   内訳: 漫画${result.byMedia.manga} / CG${result.byMedia.cg} / 音声${result.byMedia.voice} / ゲーム${result.byMedia.game}`
    );
  })
  .catch((err) => {
    console.error("\n❌", err.message ?? err);
    process.exit(1);
  });
