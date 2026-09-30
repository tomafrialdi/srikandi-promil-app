-- Immutable audit log. Rows are only written through log_console_event().

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  resource text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id);

create function public.audit_log_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is immutable';
end;
$$;

create trigger audit_log_no_update
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

alter table public.audit_log enable row level security;

create policy "admins read audit log"
  on public.audit_log for select
  to authenticated
  using ((select public.is_console_admin()));

-- Any signed-in console user can record their own events (e.g. sign-in).
create function public.log_console_event(
  p_action text,
  p_resource text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.audit_log (actor_id, actor_email, action, resource, metadata)
  values (
    (select auth.uid()),
    (select auth.jwt() ->> 'email'),
    p_action,
    p_resource,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke execute on function public.log_console_event(text, text, jsonb) from public, anon;
grant execute on function public.log_console_event(text, text, jsonb) to authenticated;
