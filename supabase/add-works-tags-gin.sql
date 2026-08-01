-- 同じ系統の作品（tags overlaps）用。任意だが件数が多いと効く
create index if not exists works_tags_gin_idx on works using gin (tags);
