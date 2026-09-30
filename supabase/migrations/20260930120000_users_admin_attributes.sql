-- Users module: extra account fields, plan catalogue, new roles.

create type public.user_status as enum ('active', 'suspended');

alter type public.plan_type add value if not exists 'clinic_sponsored';

alter type public.admin_role add value if not exists 'admin';
alter type public.admin_role add value if not exists 'medical_reviewer';
alter type public.admin_role add value if not exists 'engine_engineer';
alter type public.admin_role add value if not exists 'content_editor';
alter type public.admin_role add value if not exists 'moderator';
alter type public.admin_role add value if not exists 'support_agent';
alter type public.admin_role add value if not exists 'analyst';

alter table public.app_users
  add column phone text,
  add column signup_method text not null default 'Email',
  add column trying_since date,
  add column partner_name text,
  add column status public.user_status not null default 'active',
  add column suspended_at timestamptz,
  add column suspended_reason text,
  add column deletion_requested_at timestamptz,
  add column discreet_mode boolean not null default true,
  add column device_model text,
  add column payment_method text,
  add column auto_renew boolean not null default true,
  add column plan_renews_at timestamptz,
  add column consent_health boolean not null default true,
  add column consent_research boolean not null default false,
  add column consent_marketing boolean not null default true;

create index app_users_status_idx on public.app_users (status);
create index app_users_last_active_desc_idx on public.app_users (last_active_at desc nulls last);

-- Plan catalogue: what each plan costs per billing period.
create table public.plan_catalog (
  plan public.plan_type primary key,
  label text not null,
  price_idr integer not null check (price_idr >= 0),
  period_months integer not null default 1,
  tagline text not null,
  sort_order integer not null default 0
);

alter table public.plan_catalog enable row level security;
create policy "admins read plan catalog" on public.plan_catalog for select to authenticated using ((select public.is_console_admin()));
