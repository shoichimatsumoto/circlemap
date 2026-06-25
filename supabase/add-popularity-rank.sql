-- 人気作品セクション用: FANZA 人気順ランク（1 = 最も人気）
alter table works add column if not exists popularity_rank int;

create index if not exists works_popularity_rank_idx
  on works(popularity_rank asc nulls last)
  where popularity_rank is not null;
