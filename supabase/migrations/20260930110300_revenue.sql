-- Revenue: subscription MRR events and non-subscription revenue.

create table public.subscription_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  event_type public.subscription_event_type not null,
  mrr_delta_idr integer not null,
  cancel_reason public.cancel_reason,
  occurred_at timestamptz not null
);
create index subscription_events_occurred_idx on public.subscription_events (occurred_at);
create index subscription_events_user_idx on public.subscription_events (user_id);

create table public.other_revenue (
  id bigint generated always as identity primary key,
  source public.revenue_source not null,
  amount_idr bigint not null,
  occurred_on date not null
);
create index other_revenue_occurred_idx on public.other_revenue (occurred_on);

alter table public.subscription_events enable row level security;
alter table public.other_revenue enable row level security;

create policy "admins read subscription events" on public.subscription_events for select to authenticated using ((select public.is_console_admin()));
create policy "admins read other revenue" on public.other_revenue for select to authenticated using ((select public.is_console_admin()));
