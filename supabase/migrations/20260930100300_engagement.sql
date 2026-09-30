-- Product engagement: feature usage events and items needing admin attention.

create table public.feature_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  feature text not null,
  used_at timestamptz not null default now()
);

create index feature_usage_used_at_idx on public.feature_usage (used_at desc);
create index feature_usage_user_id_idx on public.feature_usage (user_id);

create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  icon text not null,
  severity public.attention_severity not null default 'info',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.feature_usage enable row level security;
alter table public.attention_items enable row level security;

create policy "admins read feature usage"
  on public.feature_usage for select
  to authenticated
  using ((select public.is_console_admin()));

create policy "admins read attention items"
  on public.attention_items for select
  to authenticated
  using ((select public.is_console_admin()));
