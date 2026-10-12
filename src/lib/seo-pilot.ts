/**
 * CircleMap分析の表示対象（パイロット）。
 * - 本番: GSC落ち作品リストのみ
 * - 開発: GSC ∪ DEV（または SEO_ANALYSIS_ALLOW_DEV=1 で本番相当環境でも DEV を許可）
 */
import gscPilot from "../../data/seo-pilot-gsc-work-ids.json";
import devPilot from "../../data/seo-pilot-dev-work-ids.json";

function toIdSet(raw: { workIds?: string[] } | null | undefined): Set<string> {
  const ids = Array.isArray(raw?.workIds) ? raw.workIds : [];
  return new Set(
    ids.map((id) => String(id).trim()).filter((id) => id.length > 0)
  );
}

const GSC_IDS = toIdSet(gscPilot);
const DEV_IDS = toIdSet(devPilot);

function allowDevList(): boolean {
  if (process.env.SEO_ANALYSIS_ALLOW_DEV === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** パイロット対象なら true（全ページ展開はしない） */
export function shouldShowWorkAnalysis(workId: string): boolean {
  const id = workId.trim();
  if (!id) return false;
  if (GSC_IDS.has(id)) return true;
  if (allowDevList() && DEV_IDS.has(id)) return true;
  return false;
}

export function getSeoPilotStats() {
  return {
    gscCount: GSC_IDS.size,
    devCount: DEV_IDS.size,
    allowDev: allowDevList(),
  };
}
