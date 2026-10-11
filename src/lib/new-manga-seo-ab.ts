/**
 * 新規漫画SEO A/Bの割当。
 * 実験開始以降に新規登録された漫画だけを、空いている最小 order へ1件ずつ入れる。
 * group は奇数A・偶数Bのまま変えず、商品ページの SEO には使わない。
 * 本番の割当状態は Supabase が正本。JSONは設計の参照。
 */

export const NEW_MANGA_SEO_AB_STARTED_AT = "2026-10-11T23:41:14+09:00";

const STARTED_AT_MS = Date.parse(NEW_MANGA_SEO_AB_STARTED_AT);
const SLOT_COUNT = 60;

export type NewMangaSeoAbGroup = "A" | "B";

export type NewMangaSeoAbSlot = {
  workId: string | null;
  group: NewMangaSeoAbGroup;
  order: number;
};

export type NewMangaSeoAbFile = {
  experiment: string;
  note: string;
  experimentStartedAt: string;
  eligibility: {
    mediaType: string;
    registeredAfter: string;
    excludeExisting: boolean;
    limit: number;
  };
  rule: {
    by: string;
    sequence: string[];
    startGroup: string;
    size: number;
  };
  counts: {
    A: number;
    B: number;
    assignedWorkIds: number;
  };
  assignments: NewMangaSeoAbSlot[];
};

export type NewMangaRegistration = {
  workId: string;
  mediaType: string;
  registeredAt: string;
};

export type NewMangaAssignment = {
  workId: string;
  group: NewMangaSeoAbGroup;
  order: number;
};

export type PersistedNewMangaAssignment = NewMangaAssignment & {
  assignedAt: string;
};

/** Supabase の1枠。order は slot_order、group は ab_group。 */
export type AssignmentSlot = {
  order: number;
  group: NewMangaSeoAbGroup;
  workId: string | null;
  assignedAt: string | null;
};

export type WorkIdentity = {
  id: string;
  mediaType: string;
  updatedAt: string;
};

function cutoffMs(doc: NewMangaSeoAbFile): number {
  const fromFile = Date.parse(
    doc.eligibility?.registeredAfter || doc.experimentStartedAt
  );
  if (Number.isNaN(fromFile)) return STARTED_AT_MS;
  return Math.max(STARTED_AT_MS, fromFile);
}

function expectedGroup(order: number): NewMangaSeoAbGroup {
  return order % 2 === 1 ? "A" : "B";
}

/** DBの60枠を割当ロジック用の盤面にする。枠が崩れていれば null。 */
export function boardFromSlots(
  slots: readonly AssignmentSlot[]
): NewMangaSeoAbFile | null {
  if (slots.length !== SLOT_COUNT) return null;
  const byOrder = new Map<number, AssignmentSlot>();
  const used = new Set<string>();

  for (const slot of slots) {
    if (!Number.isInteger(slot.order) || slot.order < 1 || slot.order > SLOT_COUNT) {
      return null;
    }
    if (byOrder.has(slot.order)) return null;
    if (slot.group !== expectedGroup(slot.order)) return null;
    const workId = typeof slot.workId === "string" ? slot.workId.trim() : "";
    if (workId && used.has(workId)) return null;
    if (workId && !slot.assignedAt) return null;
    if (!workId && slot.assignedAt) return null;
    if (workId) used.add(workId);
    byOrder.set(slot.order, {
      order: slot.order,
      group: slot.group,
      workId: workId || null,
      assignedAt: workId ? slot.assignedAt : null,
    });
  }
  if (byOrder.size !== SLOT_COUNT) return null;

  return {
    experiment: "new-manga-seo-ab",
    note: "supabase",
    experimentStartedAt: NEW_MANGA_SEO_AB_STARTED_AT,
    eligibility: {
      mediaType: "manga",
      registeredAfter: NEW_MANGA_SEO_AB_STARTED_AT,
      excludeExisting: true,
      limit: SLOT_COUNT,
    },
    rule: {
      by: "registrationOrder",
      sequence: ["A", "B"],
      startGroup: "A",
      size: SLOT_COUNT,
    },
    counts: { A: 30, B: 30, assignedWorkIds: used.size },
    assignments: Array.from({ length: SLOT_COUNT }, (_, index) => {
      const slot = byOrder.get(index + 1)!;
      return { workId: slot.workId, group: slot.group, order: slot.order };
    }),
  };
}

export function isFixedAssignmentBoard(doc: NewMangaSeoAbFile): boolean {
  if (!Array.isArray(doc.assignments) || doc.assignments.length !== SLOT_COUNT) {
    return false;
  }
  const orders = new Set<number>();
  for (const slot of doc.assignments) {
    if (slot.group !== "A" && slot.group !== "B") return false;
    if (!Number.isInteger(slot.order) || slot.order < 1 || slot.order > SLOT_COUNT) {
      return false;
    }
    orders.add(slot.order);
  }
  return orders.size === SLOT_COUNT;
}

function assignedWorkIds(doc: NewMangaSeoAbFile): Set<string> {
  const ids = new Set<string>();
  for (const slot of doc.assignments) {
    if (typeof slot.workId === "string" && slot.workId.trim()) {
      ids.add(slot.workId.trim());
    }
  }
  return ids;
}

function lowestOpenSlot(doc: NewMangaSeoAbFile): NewMangaSeoAbSlot | undefined {
  let open: NewMangaSeoAbSlot | undefined;
  for (const slot of doc.assignments) {
    if (slot.workId !== null) continue;
    if (!open || slot.order < open.order) open = slot;
  }
  return open;
}

function acceptRegistration(
  doc: NewMangaSeoAbFile,
  candidate: NewMangaRegistration,
  existingWorkIds: ReadonlySet<string>,
  usedWorkIds: ReadonlySet<string>
): string | null {
  const workId = candidate.workId?.trim() ?? "";
  if (!workId) return null;
  if (candidate.mediaType !== "manga") return null;
  if (existingWorkIds.has(workId)) return null;
  if (usedWorkIds.has(workId)) return null;
  const registeredMs = Date.parse(candidate.registeredAt);
  if (Number.isNaN(registeredMs) || registeredMs < cutoffMs(doc)) return null;
  return workId;
}

/**
 * 登録順の候補を、空いている最小 order へ1件ずつ入れる。
 * 入力の doc と group は変更しない。
 */
export function assignNewMangaRegistrations(
  doc: NewMangaSeoAbFile,
  candidates: readonly NewMangaRegistration[],
  existingWorkIds: ReadonlySet<string>
): { doc: NewMangaSeoAbFile; assigned: NewMangaAssignment[] } {
  if (!isFixedAssignmentBoard(doc)) {
    return { doc, assigned: [] };
  }

  const next = structuredClone(doc);
  const assigned: NewMangaAssignment[] = [];
  const used = assignedWorkIds(next);

  for (const candidate of candidates) {
    const workId = acceptRegistration(next, candidate, existingWorkIds, used);
    if (!workId) continue;
    const open = lowestOpenSlot(next);
    if (!open) break;

    const slot = next.assignments.find((item) => item.order === open.order);
    if (!slot || slot.workId !== null || slot.group !== open.group) break;
    slot.workId = workId;
    used.add(workId);
    assigned.push({ workId, group: slot.group, order: slot.order });
  }

  if (assigned.length > 0) {
    next.counts.assignedWorkIds = used.size;
  }
  return { doc: next, assigned };
}

/** 同期前後の作品一覧から、今回新規登録された漫画だけを登録順で返す。 */
export function selectNewMangaInRegistrationOrder(
  before: ReadonlyMap<string, WorkIdentity>,
  after: Iterable<WorkIdentity>
): NewMangaRegistration[] {
  const fresh: { workId: string; registeredAt: string; registeredMs: number }[] = [];

  for (const row of after) {
    const workId = row.id?.trim() ?? "";
    if (!workId || before.has(workId)) continue;
    if (row.mediaType !== "manga") continue;
    const registeredMs = Date.parse(row.updatedAt);
    if (Number.isNaN(registeredMs) || registeredMs < STARTED_AT_MS) continue;
    fresh.push({ workId, registeredAt: row.updatedAt, registeredMs });
  }

  fresh.sort(
    (a, b) =>
      a.registeredMs - b.registeredMs ||
      (a.workId < b.workId ? -1 : a.workId > b.workId ? 1 : 0)
  );

  return fresh.map(({ workId, registeredAt }) => ({
    workId,
    mediaType: "manga",
    registeredAt,
  }));
}
