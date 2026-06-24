-- CircleMap Step 2 で Supabase SQL Editor に貼り付けて実行

create table if not exists circles (
  id text primary key,
  name text not null,
  initial text not null default '?',
  description text,
  work_count int not null default 0,
  latest_date text,
  avg_price int not null default 0,
  manga_count int not null default 0,
  cg_count int not null default 0,
  voice_count int not null default 0,
  game_count int not null default 0,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists works (
  id text primary key,
  title text not null,
  media_type text not null check (media_type in ('manga', 'cg', 'voice', 'game')),
  price int not null default 0,
  date text,
  tags text[] not null default '{}',
  circle_id text not null references circles(id) on delete cascade,
  circle_name text not null,
  affiliate_url text,
  thumbnail_url text,
  sample_images text[] not null default '{}',
  description text,
  updated_at timestamptz not null default now()
);

create index if not exists works_circle_id_idx on works(circle_id);
create index if not exists works_media_type_idx on works(media_type);
create index if not exists works_date_idx on works(date desc);
create index if not exists circles_name_idx on circles(name);

-- サイトからは読み取りのみ（書き込みは同期バッチ用）
alter table circles enable row level security;
alter table works enable row level security;

create policy "circles are publicly readable"
  on circles for select
  using (true);

create policy "works are publicly readable"
  on works for select
  using (true);
