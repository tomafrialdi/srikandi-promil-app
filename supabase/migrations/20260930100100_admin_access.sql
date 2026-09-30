-- Admin console access: profiles + the single access-control gate.

create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.admin_role not null default 'support',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;

-- The one gate every console policy/RPC uses. Requires an active admin AND a
-- session that completed 2FA (aal2). Relax the aal2 check here if needed.
create function public.is_console_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (
      select 1
      from public.admin_profiles p
      where p.id = (select auth.uid()) and p.is_active
    );
$$;

create function public.assert_console_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_console_admin() then
    raise exception 'console access denied' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.is_console_admin() from public, anon;
revoke execute on function public.assert_console_admin() from public, anon;
grant execute on function public.is_console_admin() to authenticated;
grant execute on function public.assert_console_admin() to authenticated;

-- An admin can always read their own profile (needed before 2FA completes).
create policy "admin reads own profile"
  on public.admin_profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "admins read all profiles"
  on public.admin_profiles for select
  to authenticated
  using ((select public.is_console_admin()));
