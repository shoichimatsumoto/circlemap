-- 媒体 AI 追加（本番で1回実行）

alter table circles
  add column if not exists ai_count int not null default 0;

-- media_type の CHECK を作り直し（Postgres は check 内容の変更が直接できないため）
alter table works drop constraint if exists works_media_type_check;
alter table works
  add constraint works_media_type_check
  check (media_type in ('manga', 'cg', 'voice', 'game', 'ai'));

-- 既存データの振り分け（タグ／タイトルから）
update works
set media_type = 'ai'
where media_type is distinct from 'ai'
  and (
    tags && array['AI', 'AI生成', '一部AI', 'AI一部利用']::text[]
    or title ~ 'AI生成|一部AI|AI一部利用|【AI生成】|【一部AI】|【AI】'
  );

-- サークル集計の ai_count を再計算
update circles c
set ai_count = coalesce(s.cnt, 0)
from (
  select circle_id, count(*)::int as cnt
  from works
  where media_type = 'ai'
  group by circle_id
) s
where c.id = s.circle_id;

update circles
set ai_count = 0
where id not in (
  select distinct circle_id from works where media_type = 'ai'
);
