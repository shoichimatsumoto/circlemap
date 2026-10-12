/**
 * workId から新規漫画SEO A/Bの group を読む。
 * 正本は Supabase の new_manga_seo_ab_assignments。
 * 公開ポリシーが無い RLS テーブルなので、サーバーの service role で読む。
 * 商品ページの title / meta / 本文 / 内部リンクにはまだ使わない。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type { NewMangaSeoAbGroup } from "@/lib/new-manga-seo-ab";

const TABLE = "new_manga_seo_ab_assignments";

export function normalizeSeoAbGroup(
  value: string | null | undefined
): NewMangaSeoAbGroup | null {
  if (value === "A" || value === "B") return value;
  return null;
}

export type AssignmentGroupQuery = {
  findGroupByWorkId(workId: string): Promise<string | null>;
};

export function supabaseAssignmentGroupQuery(
  supabase: SupabaseClient
): AssignmentGroupQuery {
  return {
    async findGroupByWorkId(workId) {
      const { data, error } = await supabase
        .from(TABLE)
        .select("ab_group")
        .eq("work_id", workId)
        .maybeSingle();
      if (error) {
        throw new Error(`割当グループの取得に失敗: ${error.message}`);
      }
      const group = (data as { ab_group?: string | null } | null)?.ab_group;
      return group ?? null;
    },
  };
}

/** 未割当・対象外・未登録の workId は null。取得エラーは null にしない。 */
export async function readNewMangaSeoAbGroup(
  workId: string,
  query: AssignmentGroupQuery
): Promise<NewMangaSeoAbGroup | null> {
  const id = workId.trim();
  if (!id) return null;
  return normalizeSeoAbGroup(await query.findGroupByWorkId(id));
}

export async function getNewMangaSeoAbGroup(
  workId: string
): Promise<NewMangaSeoAbGroup | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service role が未設定です");
  }
  return readNewMangaSeoAbGroup(workId, supabaseAssignmentGroupQuery(supabase));
}
