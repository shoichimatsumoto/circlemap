-- 既存DBに sample_images 列を追加（Supabase SQL Editor で1回実行）
alter table works
  add column if not exists sample_images text[] not null default '{}';
