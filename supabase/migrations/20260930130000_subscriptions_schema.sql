-- Subscriptions module: transactions, richer promo codes, editable plan catalogue.

create type public.payment_channel as enum ('gopay', 'qris', 'ovo_dana', 'card', 'google_play', 'apple_iap', 'clinic_invoice');
create type public.transaction_status as enum ('paid', 'pending', 'failed', 'refunded', 'refund_requested', 'sponsored');

-- MRR events remember which plan they belong to (for the monthly / yearly split).
alter table public.subscription_events add column plan public.plan_type;

create function public.subscription_events_default_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.plan is null then
    select plan into new.plan from public.app_users where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger subscription_events_default_plan
  before insert on public.subscription_events
  for each row execute function public.subscription_events_default_plan();

-- Plan catalogue: editable fields.
alter table public.plan_catalog
  add column plan_id text,
  add column billing_label text,
  add column trial_days integer not null default 0,
  add column grace_days integer not null default 3,
  add column badge_label text,
  add column savings_label text,
  add column features jsonb not null default '[]',
  add column price_google_idr integer,
  add column price_apple_idr integer,
  add column google_tier text,
  add column apple_tier text,
  add column updated_at timestamptz not null default now();

create table public.plan_change_requests (
  id bigint generated always as identity primary key,
  plan public.plan_type not null references public.plan_catalog (plan),
  payload jsonb not null,
  migrate_existing boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid references public.admin_profiles (id) on delete set null,
  reviewed_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Promo codes: richer offer definition (legacy columns stay in sync for the plan-change quote).
alter table public.promo_codes drop constraint promo_codes_discount_pct_check;
alter table public.promo_codes alter column max_uses drop not null;

alter table public.promo_codes
  add column discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed', 'extend_trial', 'sponsored')),
  add column fixed_amount_idr integer,
  add column trial_extend_days integer,
  add column duration_kind text not null default 'first_billing' check (duration_kind in ('first_billing', 'months', 'always')),
  add column max_discount_idr integer,
  add column plans public.plan_type[] not null default '{}',
  add column channels text[] not null default '{midtrans}',
  add column eligibility text not null default 'Public',
  add column per_user_limit integer not null default 1,
  add column starts_at timestamptz,
  add column ends_at timestamptz,
  add column internal_note text,
  add column combinable boolean not null default false,
  add column status text not null default 'active' check (status in ('draft', 'active', 'paused')),
  add column created_by uuid references public.admin_profiles (id) on delete set null,
  add column created_at timestamptz not null default now();

create table public.promo_redemptions (
  id bigint generated always as identity primary key,
  code text not null references public.promo_codes (code) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  plan public.plan_type not null,
  discount_idr integer not null default 0,
  outcome text not null default 'applied' check (outcome in ('applied', 'rejected')),
  note text,
  flagged boolean not null default false,
  redeemed_at timestamptz not null
);
create index promo_redemptions_code_idx on public.promo_redemptions (code, redeemed_at desc);
create index promo_redemptions_at_idx on public.promo_redemptions (redeemed_at desc);

create table public.promo_history (
  id bigint generated always as identity primary key,
  code text not null references public.promo_codes (code) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  text text not null
);
create index promo_history_code_idx on public.promo_history (code, at desc);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  user_id uuid not null references public.app_users (id) on delete cascade,
  plan public.plan_type not null,
  channel public.payment_channel not null,
  promo_code text references public.promo_codes (code) on delete set null,
  list_amount_idr integer not null,
  discount_idr integer not null default 0,
  amount_idr integer not null,
  fee_idr integer not null default 0,
  net_idr integer not null,
  status public.transaction_status not null,
  retry_count integer not null default 0,
  order_id text not null,
  payment_ref text,
  created_at timestamptz not null,
  paid_at timestamptz,
  settlement_on date,
  refund_reason text,
  refunded_at timestamptz
);
create index transactions_created_idx on public.transactions (created_at desc);
create index transactions_user_idx on public.transactions (user_id);
create index transactions_status_idx on public.transactions (status);

do $$
declare t text;
begin
  foreach t in array array['plan_change_requests', 'promo_redemptions', 'promo_history', 'transactions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admins read %1$s" on public.%1$I for select to authenticated using ((select public.is_console_admin()))', t);
  end loop;
end $$;
