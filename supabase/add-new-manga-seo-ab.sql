-- 新規漫画SEO A/Bの割当状態。本番の正本はこのテーブル。
-- data/new-manga-seo-ab-assignments.json は A/B 設計の参照で、本番では書き換えない。
-- slot_order = order 1〜60。奇数=A、偶数=B。既存商品は同期処理側で入れない。

create table if not exists new_manga_seo_ab_assignments (
  slot_order smallint primary key check (slot_order between 1 and 60),
  ab_group text not null check (ab_group in ('A', 'B')),
  work_id text,
  assigned_at timestamptz,
  constraint new_manga_seo_ab_group_parity check (
    (slot_order % 2 = 1 and ab_group = 'A')
    or (slot_order % 2 = 0 and ab_group = 'B')
  ),
  constraint new_manga_seo_ab_assignment_pair check (
    (work_id is null and assigned_at is null)
    or (work_id is not null and assigned_at is not null and work_id <> '')
  )
);

create unique index if not exists new_manga_seo_ab_work_id_unique
  on new_manga_seo_ab_assignments (work_id)
  where work_id is not null;

alter table new_manga_seo_ab_assignments enable row level security;

insert into new_manga_seo_ab_assignments (slot_order, ab_group)
select n, case when n % 2 = 1 then 'A' else 'B' end
from generate_series(1, 60) as n
on conflict (slot_order) do nothing;
