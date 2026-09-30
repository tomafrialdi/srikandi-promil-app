-- Fertility engine: versioned rule sets (config jsonb), medical approvals, change history, golden cases, metrics.
-- The console edits a draft config; the mobile app reads the released config through public.engine_active_config().
-- Everything here is reachable only through the admin_engine_* RPCs (RLS on, no policies).

create type public.engine_version_status as enum ('draft', 'in_review', 'canary', 'live', 'archived', 'rolled_back');
create type public.engine_decision as enum ('pending', 'approved', 'rejected');

create table public.engine_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (version ~ '^v[0-9]+\.[0-9]+$'),
  status public.engine_version_status not null default 'draft',
  rollout_pct integer not null default 0 check (rollout_pct in (0, 5, 25, 100)),
  config jsonb not null check (jsonb_typeof(config) = 'object' and pg_column_size(config) < 262144),
  summary text check (char_length(summary) <= 120),
  notes text check (char_length(notes) <= 500),
  auto_rollback boolean not null default true,
  golden jsonb,
  signed_off_by text,
  created_by uuid references public.admin_profiles (id) on delete set null,
  submitted_at timestamptz,
  canary_at timestamptz,
  live_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One live version, one canary, and at most one version being edited / reviewed.
create unique index engine_one_live on public.engine_versions ((true)) where status = 'live';
create unique index engine_one_canary on public.engine_versions ((true)) where status = 'canary';
create unique index engine_one_working on public.engine_versions ((true)) where status in ('draft', 'in_review');

create trigger engine_versions_set_updated_at
  before update on public.engine_versions
  for each row execute function public.set_updated_at();

-- The medical panel that signs off releases. Every panel member has to approve before a version goes past 5 %.
create table public.engine_reviewers (
  admin_id uuid primary key references public.admin_profiles (id) on delete cascade,
  credentials text not null,
  sort_order integer not null
);

create table public.engine_approvals (
  id bigint generated always as identity primary key,
  version_id uuid not null references public.engine_versions (id) on delete cascade,
  reviewer_id uuid not null references public.admin_profiles (id) on delete cascade,
  decision public.engine_decision not null default 'pending',
  note text,
  decided_at timestamptz,
  unique (version_id, reviewer_id)
);

-- Human-readable change history (shown per mode and in Version history).
create table public.engine_events (
  id bigint generated always as identity primary key,
  version_id uuid references public.engine_versions (id) on delete set null,
  mode text check (mode in ('ttc', 'pcos', 'iui_ivf', 'after_loss')),
  kind text not null,
  tone text not null default 'info' check (tone in ('success', 'info', 'warning', 'error')),
  title text not null,
  detail text,
  actor_id uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index engine_events_mode_idx on public.engine_events (mode, created_at desc);

-- Labelled cycles the simulator replays against two versions. truth_ov = ovulation day confirmed by clinicians.
create table public.engine_golden_cases (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  mode text not null check (mode in ('ttc', 'pcos', 'iui_ivf', 'after_loss')),
  label text not null,
  description text not null,
  signals jsonb not null,
  truth_ov integer not null,
  sort_order integer not null
);

-- Measured numbers (filled by the analytics pipeline). scope: 'global' | 'banner:<mode>' | 'perf:<mode>' | 'canary'.
create table public.engine_metrics (
  scope text not null,
  key text not null,
  label text not null,
  sub text,
  value text not null,
  chip text,
  tone text not null default 'neutral' check (tone in ('success', 'warning', 'error', 'info', 'neutral')),
  sort_order integer not null default 0,
  primary key (scope, key)
);

alter table public.engine_versions enable row level security;
alter table public.engine_reviewers enable row level security;
alter table public.engine_approvals enable row level security;
alter table public.engine_events enable row level security;
alter table public.engine_golden_cases enable row level security;
alter table public.engine_metrics enable row level security;

-- Who may do what. Viewing follows the "Engine" column of the access matrix.
create function analytics_private.engine_level()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((select m.level from public.admin_access_matrix m where m.role = analytics_private.console_role() and m.area = 'engine'), 'none')
$$;

create function analytics_private.require_engine_view()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if analytics_private.engine_level() = 'none' then
    raise exception 'your role is not allowed to view the fertility engine' using errcode = '42501';
  end if;
end;
$$;

-- Editing drafts: roles with Full access to the engine, except read-only reviewers' sign-off role is separate.
create function analytics_private.require_engine_edit()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if analytics_private.engine_level() <> 'full' then
    raise exception 'your role is not allowed to change the fertility engine' using errcode = '42501';
  end if;
end;
$$;

-- Fields the rule builder may use (mirrors apps/console engine/fields.ts).
create function analytics_private.engine_fields()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['lh', 'cm', 'flow', 'cd', 'score', 'days_to_ov', 'dpo', 'bbt_shift_days', 'bbt_shift_delta', 'bbt_shift_confirmed',
    'lh_peak_days_ago', 'lh_high_streak', 'cm_after_peak', 'ovulation_confirmed', 'period_started', 'positive_test', 'hcg',
    'fever_flag', 'pregnancy_mode', 'test_result', 'days_since_peak', 'flow_none_days', 'cycles_since_loss',
    'days_since_procedure', 'status']
$$;

create function analytics_private.engine_modes()
returns text[]
language sql
immutable
set search_path = ''
as $$ select array['ttc', 'pcos', 'iui_ivf', 'after_loss'] $$;

-- Next version label: v3.5 -> v3.6.
create function analytics_private.engine_next_version()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select 'v' || split_part(t, '.', 1) || '.' || (split_part(t, '.', 2)::int + 1)
     from (select regexp_replace(version, '^v', '') as t from public.engine_versions
           order by string_to_array(regexp_replace(version, '^v', ''), '.')::int[] desc limit 1) s),
    'v1.0')
$$;
