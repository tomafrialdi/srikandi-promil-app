-- Product activity: sessions, pushes, feature usage catalogue and content reads.
-- (app_sessions is created here; helper functions above reference it lazily.)

create table public.app_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  started_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  source text not null default 'organic'
);
create index app_sessions_started_at_idx on public.app_sessions (started_at);
create index app_sessions_user_started_idx on public.app_sessions (user_id, started_at);

-- Session-based helpers (need app_sessions to exist).
-- Distinct users with a session in the p_window days ending on p_day (Jakarta time).
create function analytics_private.active_users(p_day date, p_window integer)
returns bigint
language sql
stable
set search_path = ''
as $$
  select count(distinct user_id)
  from public.app_sessions
  where started_at >= analytics_private.jkt(p_day - (p_window - 1))
    and started_at < analytics_private.jkt(p_day + 1)
$$;

-- Was the user active in the Nth week after sign-up? (week 0 always counts.)
create function analytics_private.active_in_week(p_user uuid, p_created timestamptz, p_week integer)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_week = 0 or exists (
    select 1 from public.app_sessions s
    where s.user_id = p_user
      and s.started_at >= p_created + make_interval(days => p_week * 7)
      and s.started_at < p_created + make_interval(days => p_week * 7 + 7)
  )
$$;

create table public.push_deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null,
  title text not null,
  sent_at timestamptz not null,
  opened_at timestamptz
);
create index push_deliveries_sent_at_idx on public.push_deliveries (sent_at);

create table public.feature_catalog (
  feature text primary key,
  plus_only boolean not null default false,
  is_signal boolean not null default false,
  sort_order integer not null default 0
);

insert into public.feature_catalog (feature, plus_only, is_signal, sort_order) values
  ('LH test scan', false, true, 1),
  ('Basal temperature', false, true, 2),
  ('Cervical fluid', false, true, 3),
  ('Two-week wait', false, false, 4),
  ('Daily check-in', false, true, 5),
  ('Partner mode', false, false, 6),
  ('Community', false, false, 7),
  ('Doctor report', true, false, 8),
  ('Treatment program', true, false, 9);

alter table public.feature_usage
  add constraint feature_usage_feature_fkey foreign key (feature) references public.feature_catalog (feature);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  published_at timestamptz not null default now()
);

create table public.article_reads (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  read_at timestamptz not null,
  read_seconds integer not null
);
create index article_reads_read_at_idx on public.article_reads (read_at);

alter table public.app_sessions enable row level security;
alter table public.push_deliveries enable row level security;
alter table public.feature_catalog enable row level security;
alter table public.articles enable row level security;
alter table public.article_reads enable row level security;

create policy "admins read sessions" on public.app_sessions for select to authenticated using ((select public.is_console_admin()));
create policy "admins read pushes" on public.push_deliveries for select to authenticated using ((select public.is_console_admin()));
create policy "admins read feature catalog" on public.feature_catalog for select to authenticated using ((select public.is_console_admin()));
create policy "admins read articles" on public.articles for select to authenticated using ((select public.is_console_admin()));
create policy "admins read article reads" on public.article_reads for select to authenticated using ((select public.is_console_admin()));
