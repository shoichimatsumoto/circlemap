/**
 * 新規漫画の登録後に、割当状態を Supabase へ1件ずつ保存する。
 * JSONは書き換えない。商品ページの title / meta / 本文 / 内部リンクは変更しない。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase";
import {
  assignNewMangaRegistrations,
  boardFromSlots,
  selectNewMangaInRegistrationOrder,
  type AssignmentSlot,
  type NewMangaSeoAbGroup,
  type PersistedNewMangaAssignment,
  type WorkIdentity,
} from "@/lib/new-manga-seo-ab";

const PAGE_SIZE = 1000;
const TABLE = "new_manga_seo_ab_assignments";

export type AssignmentRepository = {
  load(): Promise<AssignmentSlot[]>;
  assignOpenSlot(input: {
    order: number;
    group: NewMangaSeoAbGroup;
    workId: string;
    assignedAt: string;
  }): Promise<boolean>;
};

type AssignmentRow = {
  slot_order: number;
  ab_group: string;
  work_id: string | null;
  assigned_at: string | null;
};

function rowToSlot(row: AssignmentRow): AssignmentSlot {
  if (row.ab_group !== "A" && row.ab_group !== "B") {
    throw new Error(`割当の group が不正です: order ${row.slot_order}`);
  }
  return {
    order: Number(row.slot_order),
    group: row.ab_group,
    workId: row.work_id?.trim() ? row.work_id.trim() : null,
    assignedAt: row.assigned_at ?? null,
  };
}

export function supabaseAssignmentRepository(
  supabase: SupabaseClient
): AssignmentRepository {
  return {
    async load() {
      const { data, error } = await supabase
        .from(TABLE)
        .select("slot_order, ab_group, work_id, assigned_at")
        .order("slot_order", { ascending: true });
      if (error) {
        throw new Error(`割当テーブルの取得に失敗: ${error.message}`);
      }
      return ((data ?? []) as AssignmentRow[]).map(rowToSlot);
    },
    async assignOpenSlot(input) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          work_id: input.workId,
          assigned_at: input.assignedAt,
        })
        .eq("slot_order", input.order)
        .eq("ab_group", input.group)
        .is("work_id", null)
        .select("slot_order");
      if (error) {
        if (error.code === "23505") return false;
        throw new Error(`割当の保存に失敗: ${error.message}`);
      }
      return (data?.length ?? 0) > 0;
    },
  };
}

/**
 * 空いている最小 order へ1件保存する。
 * group は枠の値のまま。同じ workId と埋まった60件は保存しない。
 */
export async function saveNewMangaRegistrations(
  candidates: readonly { workId: string; mediaType: string; registeredAt: string }[],
  existingWorkIds: ReadonlySet<string>,
  repository: AssignmentRepository,
  now: () => string = () => new Date().toISOString()
): Promise<PersistedNewMangaAssignment[]> {
  const assigned: PersistedNewMangaAssignment[] = [];

  for (const candidate of candidates) {
    let saved = false;
    for (let attempt = 0; attempt < 2 && !saved; attempt += 1) {
      const doc = boardFromSlots(await repository.load());
      if (!doc) {
        throw new Error("割当テーブルが60件の固定枠ではありません");
      }
      const result = assignNewMangaRegistrations(doc, [candidate], existingWorkIds);
      const item = result.assigned[0];
      if (!item) break;
      const assignedAt = now();
      saved = await repository.assignOpenSlot({
        order: item.order,
        group: item.group,
        workId: item.workId,
        assignedAt,
      });
      if (saved) assigned.push({ ...item, assignedAt });
    }
  }

  return assigned;
}

async function loadWorkIdentities(
  supabase: SupabaseClient
): Promise<Map<string, WorkIdentity>> {
  const { count, error: countError } = await supabase
    .from("works")
    .select("id", { count: "exact", head: true });
  if (countError) {
    throw new Error(`既存作品の件数取得に失敗: ${countError.message}`);
  }

  const expected = count ?? 0;
  const map = new Map<string, WorkIdentity>();

  for (let from = 0; from < expected; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("works")
      .select("id, media_type, updated_at")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`既存作品の取得に失敗: ${error.message}`);
    }
    for (const row of data ?? []) {
      const id = String(row.id ?? "").trim();
      if (!id) continue;
      map.set(id, {
        id,
        mediaType: String(row.media_type ?? ""),
        updatedAt: String(row.updated_at ?? ""),
      });
    }
  }

  if (map.size !== expected) {
    throw new Error(
      `既存作品の件数不一致 expected=${expected} loaded=${map.size}`
    );
  }
  return map;
}

/**
 * 同期の前後で作品IDを比較し、今回はじめて入った漫画だけを Supabase へ保存する。
 * 確認に失敗したときは何も割り当てない。同期そのものは続行する。
 */
export async function runSyncAndAssignNewManga<T>(
  run: () => Promise<T>
): Promise<T> {
  const supabase = createSupabaseServiceClient();
  let before: Map<string, WorkIdentity> | null = null;

  if (supabase) {
    try {
      before = await loadWorkIdentities(supabase);
    } catch (error) {
      console.error("[new-manga-seo-ab] 既存作品を確認できなかったため割当しません", error);
    }
  }

  const result = await run();
  if (!supabase || !before) return result;

  try {
    const after = await loadWorkIdentities(supabase);
    const candidates = selectNewMangaInRegistrationOrder(before, after.values());
    const existingWorkIds = new Set(before.keys());
    const assigned = await saveNewMangaRegistrations(
      candidates,
      existingWorkIds,
      supabaseAssignmentRepository(supabase)
    );
    if (assigned.length > 0) {
      console.info(
        `[new-manga-seo-ab] 新規漫画 ${assigned.length} 件を Supabase へ保存しました`
      );
    }
  } catch (error) {
    console.error("[new-manga-seo-ab] 割当の保存に失敗しました", error);
  }

  return result;
}
