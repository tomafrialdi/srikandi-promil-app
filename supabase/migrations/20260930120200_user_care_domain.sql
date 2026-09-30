-- What the console can see about a user's fertility journey.

create table public.user_cycles (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  cycle_no integer not null,
  start_date date not null,
  length_days integer,
  ovulation_day integer,
  luteal_days integer,
  outcome text,
  unique (user_id, cycle_no)
);
create index user_cycles_user_idx on public.user_cycles (user_id, cycle_no desc);

create table public.engine_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  cycle_no integer not null,
  rule_set text not null,
  run_at timestamptz not null,
  status text not null,
  headline text not null,
  confidence integer not null,
  signals_used integer not null,
  predicted_ovulation_day integer,
  predicted_ovulation_date date,
  test_date date,
  contribution jsonb not null default '[]',
  day_by_day jsonb not null default '[]',
  decision_trace jsonb not null default '[]',
  overrides jsonb not null default '[]',
  flags text
);
create unique index engine_runs_user_idx on public.engine_runs (user_id);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  clinic_name text not null,
  city text not null,
  rating numeric(2, 1) not null default 4.8
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  address text,
  rating numeric(2, 1) not null default 4.7,
  bpjs boolean not null default false,
  ivf_lab boolean not null default false
);

create table public.user_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  name text not null,
  schedule text not null,
  source text not null,
  status text not null check (status in ('active', 'completed', 'scheduled', 'suggested', 'stopped')),
  purchase_status text not null,
  adherence_pct integer,
  detail jsonb not null default '{}'
);
create index user_medications_user_idx on public.user_medications (user_id);

create table public.user_care_team (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id),
  title text not null,
  relation text not null check (relation in ('visited', 'upcoming', 'recommended')),
  is_primary boolean not null default false,
  summary_1 text,
  summary_2 text,
  summary_3 text,
  detail jsonb not null default '{}'
);
create index user_care_team_user_idx on public.user_care_team (user_id);

create table public.user_clinics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id),
  status text not null check (status in ('visited', 'recommended', 'saved', 'dismissed')),
  program text,
  note text,
  detail jsonb not null default '{}'
);
create index user_clinics_user_idx on public.user_clinics (user_id);

create table public.user_integrations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null,
  status text not null,
  note text
);
create index user_integrations_user_idx on public.user_integrations (user_id);

do $$
declare t text;
begin
  foreach t in array array['user_cycles','engine_runs','doctors','clinics','user_medications','user_care_team','user_clinics','user_integrations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admins read %1$s" on public.%1$I for select to authenticated using ((select public.is_console_admin()))', t);
  end loop;
end $$;
