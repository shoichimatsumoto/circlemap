import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  assignNewMangaRegistrations,
  boardFromSlots,
  selectNewMangaInRegistrationOrder,
  type AssignmentSlot,
  type NewMangaSeoAbFile,
  type WorkIdentity,
} from "./new-manga-seo-ab";
import {
  getNewMangaSeoAbGroup,
  readNewMangaSeoAbGroup,
  supabaseAssignmentGroupQuery,
} from "./new-manga-seo-ab-group";
import {
  saveNewMangaRegistrations,
  type AssignmentRepository,
} from "./new-manga-seo-ab-register";

const STARTED = "2026-10-11T23:41:14+09:00";
const AFTER = "2026-10-11T23:50:00+09:00";
const BEFORE = "2026-10-11T23:41:13+09:00";
const ASSIGNED_AT = "2026-10-11T23:56:00.000Z";
const REAL_FILE = path.join(
  process.cwd(),
  "data",
  "new-manga-seo-ab-assignments.json"
);

function board(filled?: { order: number; workId: string }[]): NewMangaSeoAbFile {
  const taken = new Map(filled?.map((item) => [item.order, item.workId]));
  return {
    experiment: "new-manga-seo-ab",
    note: "test",
    experimentStartedAt: STARTED,
    eligibility: {
      mediaType: "manga",
      registeredAfter: STARTED,
      excludeExisting: true,
      limit: 60,
    },
    rule: { by: "registrationOrder", sequence: ["A", "B"], startGroup: "A", size: 60 },
    counts: { A: 30, B: 30, assignedWorkIds: taken.size },
    assignments: Array.from({ length: 60 }, (_, index) => {
      const order = index + 1;
      return {
        workId: taken.get(order) ?? null,
        group: order % 2 === 1 ? "A" : "B",
        order,
      } as const;
    }),
  };
}

function emptySlots(): AssignmentSlot[] {
  return Array.from({ length: 60 }, (_, index) => {
    const order = index + 1;
    return {
      order,
      group: order % 2 === 1 ? "A" : "B",
      workId: null,
      assignedAt: null,
    } as const;
  });
}

function memoryRepository(slots: AssignmentSlot[]): AssignmentRepository {
  return {
    async load() {
      return slots.map((slot) => ({ ...slot }));
    },
    async assignOpenSlot(input) {
      const slot = slots.find((item) => item.order === input.order);
      if (!slot || slot.workId !== null || slot.group !== input.group) return false;
      if (slots.some((item) => item.workId === input.workId)) return false;
      slot.workId = input.workId;
      slot.assignedAt = input.assignedAt;
      return true;
    },
  };
}

function groupsOf(doc: NewMangaSeoAbFile): string[] {
  return doc.assignments.map((slot) => slot.group);
}

test("空いている最小 order へ登録順に1件ずつ入れ、group は変えない", () => {
  const source = board();
  const result = assignNewMangaRegistrations(
    source,
    [
      { workId: "d_new_1", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_new_2", mediaType: "manga", registeredAt: "2026-10-11T23:51:00+09:00" },
      { workId: "d_cg", mediaType: "cg", registeredAt: AFTER },
      { workId: "d_old", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_early", mediaType: "manga", registeredAt: BEFORE },
      { workId: "d_new_1", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_new_3", mediaType: "manga", registeredAt: STARTED },
    ],
    new Set(["d_old"])
  );

  assert.deepEqual(
    result.assigned.map((item) => `${item.order}:${item.group}:${item.workId}`),
    ["1:A:d_new_1", "2:B:d_new_2", "3:A:d_new_3"]
  );
  assert.equal(result.doc.assignments[3].workId, null);
  assert.deepEqual(groupsOf(result.doc), groupsOf(source));
  assert.equal(source.assignments[0].workId, null);
  assert.equal(result.doc.counts.A, 30);
  assert.equal(result.doc.counts.B, 30);
  assert.equal(result.doc.counts.assignedWorkIds, 3);
});

test("一度入った workId は動かさず、次の空き枠へ進む", () => {
  const source = board([{ order: 3, workId: "d_kept" }]);
  const result = assignNewMangaRegistrations(
    source,
    [
      { workId: "d_kept", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_next", mediaType: "manga", registeredAt: AFTER },
    ],
    new Set()
  );

  assert.equal(result.doc.assignments[0].workId, "d_next");
  assert.equal(result.doc.assignments[0].group, "A");
  assert.equal(result.doc.assignments[2].workId, "d_kept");
  assert.equal(result.doc.assignments[2].group, "A");
  assert.deepEqual(result.assigned, [{ workId: "d_next", group: "A", order: 1 }]);
});

test("60件埋まったら以降は何もしない", () => {
  const filled = Array.from({ length: 60 }, (_, index) => ({
    order: index + 1,
    workId: `d_filled_${index + 1}`,
  }));
  const source = board(filled);
  const result = assignNewMangaRegistrations(
    source,
    [{ workId: "d_overflow", mediaType: "manga", registeredAt: AFTER }],
    new Set()
  );

  assert.deepEqual(result.assigned, []);
  assert.equal(
    result.doc.assignments.some((slot) => slot.workId === "d_overflow"),
    false
  );
  assert.deepEqual(groupsOf(result.doc), groupsOf(source));
});

test("同期後の一覧では既存・漫画以外・開始前を除外し、更新時刻順にする", () => {
  const before = new Map<string, WorkIdentity>([
    ["d_old", { id: "d_old", mediaType: "manga", updatedAt: AFTER }],
  ]);
  const after: WorkIdentity[] = [
    { id: "d_old", mediaType: "manga", updatedAt: AFTER },
    { id: "d_second", mediaType: "manga", updatedAt: "2026-10-11T23:52:00+09:00" },
    { id: "d_cg", mediaType: "cg", updatedAt: "2026-10-11T23:46:00+09:00" },
    { id: "d_first", mediaType: "manga", updatedAt: "2026-10-11T23:45:00+09:00" },
    { id: "d_stale", mediaType: "manga", updatedAt: "2026-10-01T00:00:00+09:00" },
  ];

  assert.deepEqual(
    selectNewMangaInRegistrationOrder(before, after).map((item) => item.workId),
    ["d_first", "d_second"]
  );
});

test("DB枠の group が奇数A・偶数Bでなければ盤面にしない", () => {
  const slots = emptySlots();
  slots[0] = { ...slots[0], group: "B" };
  assert.equal(boardFromSlots(slots), null);

  const valid = boardFromSlots(emptySlots());
  assert.equal(valid?.assignments[0].group, "A");
  assert.equal(valid?.assignments[1].group, "B");
  assert.equal(valid?.assignments.length, 60);
});

test("保存先はメモリ上のDB枠で、order・group・workId・assignedAt を1件ずつ残す", async () => {
  const slots = emptySlots();
  const repo = memoryRepository(slots);
  const jsonBefore = fs.readFileSync(REAL_FILE);

  const first = await saveNewMangaRegistrations(
    [
      { workId: "d_save_1", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_voice", mediaType: "voice", registeredAt: AFTER },
      { workId: "d_save_2", mediaType: "manga", registeredAt: "2026-10-11T23:55:00+09:00" },
    ],
    new Set(["d_existing"]),
    repo,
    () => ASSIGNED_AT
  );
  const second = await saveNewMangaRegistrations(
    [
      { workId: "d_save_1", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_existing", mediaType: "manga", registeredAt: AFTER },
      { workId: "d_save_3", mediaType: "manga", registeredAt: "2026-10-12T00:01:00+09:00" },
    ],
    new Set(["d_existing"]),
    repo,
    () => ASSIGNED_AT
  );
  const jsonAfter = fs.readFileSync(REAL_FILE);

  assert.deepEqual(
    first.map((item) => `${item.order}:${item.group}:${item.workId}:${item.assignedAt}`),
    [
      `1:A:d_save_1:${ASSIGNED_AT}`,
      `2:B:d_save_2:${ASSIGNED_AT}`,
    ]
  );
  assert.deepEqual(second.map((item) => `${item.order}:${item.group}:${item.workId}`), [
    "3:A:d_save_3",
  ]);
  assert.equal(slots[0].workId, "d_save_1");
  assert.equal(slots[0].group, "A");
  assert.equal(slots[0].assignedAt, ASSIGNED_AT);
  assert.equal(slots[1].workId, "d_save_2");
  assert.equal(slots[1].group, "B");
  assert.equal(slots[2].workId, "d_save_3");
  assert.equal(slots[2].group, "A");
  assert.equal(slots.filter((slot) => slot.workId).length, 3);
  assert.equal(slots.some((slot) => slot.workId === "d_existing"), false);
  assert.deepEqual(jsonAfter, jsonBefore);
});

test("60枠が埋まっている保存先には追記しない", async () => {
  const slots = emptySlots().map((slot, index) => ({
    ...slot,
    workId: `d_filled_${index + 1}`,
    assignedAt: ASSIGNED_AT,
  }));
  const before = slots.map((slot) => slot.workId);
  const assigned = await saveNewMangaRegistrations(
    [{ workId: "d_overflow", mediaType: "manga", registeredAt: AFTER }],
    new Set(),
    memoryRepository(slots),
    () => ASSIGNED_AT
  );

  assert.deepEqual(assigned, []);
  assert.deepEqual(
    slots.map((slot) => slot.workId),
    before
  );
});

test("設計JSONの workId は空のまま", () => {
  const raw = fs.readFileSync(REAL_FILE, "utf8");
  const doc = JSON.parse(raw) as NewMangaSeoAbFile;
  assert.equal(doc.assignments.length, 60);
  assert.equal(
    doc.assignments.every((slot, index) => {
      const order = index + 1;
      return (
        slot.workId === null &&
        slot.order === order &&
        slot.group === (order % 2 === 1 ? "A" : "B")
      );
    }),
    true
  );
  assert.equal(doc.counts.A, 30);
  assert.equal(doc.counts.B, 30);
  assert.equal(doc.counts.assignedWorkIds, 0);
});

test("workId から A / B / null を返す", async () => {
  const rows = new Map<string, string | null>([
    ["d_a", "A"],
    ["d_b", "B"],
    ["d_bad", "C"],
  ]);
  const seen: string[] = [];
  const query = {
    async findGroupByWorkId(workId: string) {
      seen.push(workId);
      return rows.get(workId) ?? null;
    },
  };

  assert.equal(await readNewMangaSeoAbGroup("d_a", query), "A");
  assert.equal(await readNewMangaSeoAbGroup(" d_b ", query), "B");
  assert.equal(await readNewMangaSeoAbGroup("d_missing", query), null);
  assert.equal(await readNewMangaSeoAbGroup("d_bad", query), null);
  assert.equal(await readNewMangaSeoAbGroup("  ", query), null);
  assert.deepEqual(seen, ["d_a", "d_b", "d_missing", "d_bad"]);
});

test("割当テーブルは work_id で読み、取得失敗は null にしない", async () => {
  const calls: { table: string; column: string; value: string }[] = [];
  const supabase = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              calls.push({ table, column, value });
              return {
                maybeSingle: async () => ({
                  data: { ab_group: "A" },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  };

  const query = supabaseAssignmentGroupQuery(
    supabase as unknown as Parameters<typeof supabaseAssignmentGroupQuery>[0]
  );
  assert.equal(await query.findGroupByWorkId("d_a"), "A");
  assert.deepEqual(calls, [
    { table: "new_manga_seo_ab_assignments", column: "work_id", value: "d_a" },
  ]);

  const denied = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: null,
                  error: { message: "permission denied" },
                }),
              };
            },
          };
        },
      };
    },
  };
  await assert.rejects(
    () =>
      readNewMangaSeoAbGroup(
        "d_a",
        supabaseAssignmentGroupQuery(
          denied as unknown as Parameters<typeof supabaseAssignmentGroupQuery>[0]
        )
      ),
    /permission denied/
  );
});

test("anon キーにはフォールバックせず service role で読む", async () => {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    await assert.rejects(() => getNewMangaSeoAbGroup("d_a"), /service role/);
  } finally {
    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", previous.url);
    restoreEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", previous.anon);
    restoreEnv("SUPABASE_SERVICE_ROLE_KEY", previous.service);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
