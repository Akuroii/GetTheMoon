-- Two tables. No foreign key between them, by design — they're independent
-- and both written by the same ingestion job (scripts/ingest.ts). The chapter
-- config these tables track progress against lives in lib/milestones.ts, not here.

create table if not exists channel_stats (
  id integer primary key default 1,
  subscriber_count integer not null,
  total_views bigint not null,
  video_count integer not null,
  avatar_url_youtube text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

create table if not exists content_items (
  video_id text primary key,
  type text not null check (type in ('video', 'stream', 'short')),
  title text not null,
  thumbnail_url text not null,
  published_at timestamptz not null,
  view_count integer not null default 0,
  duration_seconds integer,
  is_short_heuristic boolean not null default false,
  url text not null,
  synced_at timestamptz not null default now()
);

-- Content Timeline reads recent items chronologically.
create index if not exists idx_content_items_published_at
  on content_items (published_at desc);

-- Fan Favorites reads long-form-only, ranked by views:
--   select * from content_items where type = 'video' order by view_count desc
create index if not exists idx_content_items_type_views
  on content_items (type, view_count desc);
