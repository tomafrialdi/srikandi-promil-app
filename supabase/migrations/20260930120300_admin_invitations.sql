-- Admin team: role catalogue and invitations.

create table public.admin_role_catalog (
  role public.admin_role primary key,
  label text not null,
  summary text not null,
  approvals_required integer not null default 0,
  sort_order integer not null
);

create table public.admin_role_permissions (
  role public.admin_role not null references public.admin_role_catalog (role) on delete cascade,
  area text not null,
  level text not null,
  sort_order integer not null,
  primary key (role, area)
);

create table public.allowed_admin_domains (
  domain text primary key
);

create type public.invitation_status as enum ('pending', 'pending_approval', 'accepted', 'revoked', 'expired');

create table public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  job_title text,
  department text not null,
  reports_to uuid references public.admin_profiles (id) on delete set null,
  language text not null default 'English',
  role public.admin_role not null,
  personal_message text,
  expires_at timestamptz not null,
  require_2fa boolean not null default true,
  sso_google boolean not null default true,
  allow_passkeys boolean not null default true,
  access_type text not null default 'permanent' check (access_type in ('permanent', 'temporary')),
  access_expires_on date,
  session_timeout_minutes integer not null default 30,
  ip_restricted boolean not null default false,
  allowed_ips text,
  block_personal_export boolean not null default true,
  require_dpa boolean not null default true,
  require_training boolean not null default true,
  overrides jsonb not null default '{}',
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index admin_invitations_email_idx on public.admin_invitations (lower(email));

alter table public.admin_role_catalog enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.allowed_admin_domains enable row level security;
alter table public.admin_invitations enable row level security;

create policy "admins read role catalog" on public.admin_role_catalog for select to authenticated using ((select public.is_console_admin()));
create policy "admins read role permissions" on public.admin_role_permissions for select to authenticated using ((select public.is_console_admin()));
create policy "admins read allowed domains" on public.allowed_admin_domains for select to authenticated using ((select public.is_console_admin()));
create policy "admins read invitations" on public.admin_invitations for select to authenticated using ((select public.is_console_admin()));

insert into public.allowed_admin_domains (domain) values ('srikandipromil.id'), ('bundaclinic.id');
