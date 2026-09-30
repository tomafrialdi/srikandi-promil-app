-- Roles & access: permission matrix, security policy, IP allowlist, alert rules, approval requests, devices.
-- Everything is reachable only through the admin_roles_* / admin_security_* RPCs (RLS on, no policies).

-- Audit rows now remember where the action came from (masked when shown in the console).
alter table public.audit_log add column ip text;

create function analytics_private.request_ip()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(trim(split_part(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
    nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip', ''), ',', 1)), '')
$$;

create or replace function analytics_private.write_audit(p_action text, p_resource text, p_metadata jsonb default '{}')
returns void
language sql
set search_path = ''
as $$
  insert into public.audit_log (actor_id, actor_email, action, resource, metadata, ip)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), p_action, p_resource, coalesce(p_metadata, '{}'), analytics_private.request_ip())
$$;

create or replace function public.log_console_event(p_action text, p_resource text default null, p_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.audit_log (actor_id, actor_email, action, resource, metadata, ip)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), p_action, p_resource, coalesce(p_metadata, '{}'::jsonb), analytics_private.request_ip());
end;
$$;

-- Short one-line description shown under the role name in the matrix.
alter table public.admin_role_catalog add column short_summary text;

-- Matrix shown on the Roles & access page: one row per role, one column per product area.
create table public.admin_access_matrix (
  role public.admin_role not null references public.admin_role_catalog (role) on delete cascade,
  area text not null,
  area_label text not null,
  area_order integer not null,
  level text not null check (level in ('full', 'view', 'masked', 'none')),
  primary key (role, area)
);

-- Organisation-wide security policy: one validated jsonb document (see analytics_private.validate_security_policy).
create table public.admin_security_policy (
  id integer primary key default 1 check (id = 1),
  policy jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  requested_by uuid references public.admin_profiles (id) on delete set null,
  approved_by uuid references public.admin_profiles (id) on delete set null
);

create table public.admin_ip_allowlist (
  id uuid primary key default gen_random_uuid(),
  cidr cidr not null unique,
  label text not null check (char_length(label) between 1 and 80),
  expires_on date,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_alert_rules (
  key text primary key,
  label text not null,
  description text not null,
  severity text not null check (severity in ('high', 'medium', 'low')),
  enabled boolean not null default true,
  sort_order integer not null
);

create type public.security_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- Two-person rule: a Super admin proposes a change, a different Super admin approves it.
create table public.admin_security_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.admin_profiles (id) on delete cascade,
  draft jsonb not null,
  changes text[] not null,
  status public.security_request_status not null default 'pending',
  decided_by uuid references public.admin_profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index admin_security_requests_one_pending on public.admin_security_requests ((true)) where status = 'pending';

-- Devices registered by the MDM / admin app; browsers are anything else.
create table public.admin_devices (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_profiles (id) on delete cascade,
  kind text not null check (kind in ('managed_laptop', 'admin_app', 'browser')),
  last_seen_at timestamptz not null default now()
);
create index admin_devices_admin_idx on public.admin_devices (admin_id);

alter table public.admin_access_matrix enable row level security;
alter table public.admin_security_policy enable row level security;
alter table public.admin_ip_allowlist enable row level security;
alter table public.admin_alert_rules enable row level security;
alter table public.admin_security_requests enable row level security;
alter table public.admin_devices enable row level security;

-- Anyone whose role can see "Roles & audit log" (i.e. not None) may open the page.
create function analytics_private.require_roles_access()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.admin_role_permissions p
    where p.role = analytics_private.console_role() and p.area = 'Roles & audit log' and p.level <> 'None'
  ) then
    raise exception 'your role is not allowed to view roles & access' using errcode = '42501';
  end if;
end;
$$;

-- "Tommy Afrialdi" -> "Tommy A.", "dr. Sarah Lestari" -> "dr. Sarah L."
create function analytics_private.short_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when array_length(w, 1) is null then null
    when array_length(w, 1) = 1 then w[1]
    else array_to_string(w[1:array_length(w, 1) - 1], ' ') || ' ' || upper(left(w[array_length(w, 1)], 1)) || '.'
  end
  from (select regexp_split_to_array(trim(coalesce(p_name, '')), '\s+') as w) s
  where trim(coalesce(p_name, '')) <> ''
$$;

create function analytics_private.mask_ip(p_ip text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_ip is null then null
    when p_ip ~ '^\d+\.\d+\.\d+\.\d+$' then regexp_replace(p_ip, '^(\d+\.\d+)\.\d+\.\d+$', '\1.•.•')
    else split_part(p_ip, ':', 1) || ':' || split_part(p_ip, ':', 2) || ':•'
  end
$$;

-- Last activity of a team member: newest session refresh, else last sign-in.
create function analytics_private.admin_last_seen(p_id uuid)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select greatest(
    (select max(coalesce(s.refreshed_at, s.updated_at, s.created_at)) from auth.sessions s where s.user_id = p_id),
    (select u.last_sign_in_at from auth.users u where u.id = p_id)
  )
$$;
