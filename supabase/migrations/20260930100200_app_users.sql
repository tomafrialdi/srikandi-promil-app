-- End users of the Srikandi Promil mobile app, as seen by the console.

create table public.plan_prices (
  plan public.plan_type primary key,
  monthly_idr integer not null check (monthly_idr >= 0)
);

insert into public.plan_prices (plan, monthly_idr) values
  ('free', 0),
  ('trial', 0),
  ('plus_monthly', 79000),
  ('plus_yearly', 49000);

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  email text not null unique,
  city text,
  province text,
  birth_year integer,
  plan public.plan_type not null default 'free',
  tracking_mode public.tracking_mode not null default 'ttc',
  journey_stage public.journey_stage not null default 'getting_started',
  cycles_tracked integer not null default 0,
  onboarded_at timestamptz,
  first_signal_at timestamptz,
  first_cycle_at timestamptz,
  trial_started_at timestamptz,
  paid_at timestamptz,
  conceived_at timestamptz,
  referred_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_users_set_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();

create index app_users_created_at_idx on public.app_users (created_at desc);
create index app_users_last_active_idx on public.app_users (last_active_at);
create index app_users_province_idx on public.app_users (province);
create index app_users_plan_idx on public.app_users (plan);

alter table public.plan_prices enable row level security;
alter table public.app_users enable row level security;

create policy "admins read plan prices"
  on public.plan_prices for select
  to authenticated
  using ((select public.is_console_admin()));

create policy "admins read app users"
  on public.app_users for select
  to authenticated
  using ((select public.is_console_admin()));
