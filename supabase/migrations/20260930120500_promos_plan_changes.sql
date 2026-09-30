-- Promo codes and the history of plan changes made from the console.

create table public.promo_codes (
  code text primary key,
  description text not null,
  audience text not null,
  discount_pct integer not null check (discount_pct between 1 and 100),
  applies_to public.plan_type not null,
  duration_months integer not null,
  max_uses integer not null,
  used_count integer not null default 0,
  valid_until date not null,
  sponsor_plan public.plan_type
);

create table public.plan_changes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  from_plan public.plan_type not null,
  to_plan public.plan_type not null,
  promo_code text references public.promo_codes (code),
  apply_when text not null check (apply_when in ('immediately', 'next_renewal')),
  refund_idr integer not null default 0,
  refund_method text,
  reason text not null,
  ticket_ref text,
  changed_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index plan_changes_user_idx on public.plan_changes (user_id, created_at desc);

alter table public.promo_codes enable row level security;
alter table public.plan_changes enable row level security;
create policy "admins read promo codes" on public.promo_codes for select to authenticated using ((select public.is_console_admin()));
create policy "admins read plan changes" on public.plan_changes for select to authenticated using ((select public.is_console_admin()));
