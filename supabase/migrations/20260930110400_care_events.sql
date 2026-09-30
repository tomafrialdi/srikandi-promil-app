-- Care & safety events (sensitive; the console only ever shows aggregates).

create table public.care_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.app_users (id) on delete set null,
  event_type public.care_event_type not null,
  occurred_at timestamptz not null
);
create index care_events_occurred_idx on public.care_events (occurred_at);

alter table public.care_events enable row level security;

create policy "admins read care events" on public.care_events for select to authenticated using ((select public.is_console_admin()));
