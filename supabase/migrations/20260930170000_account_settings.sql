-- Account settings: own profile, preferences, backup codes, API tokens, sessions, security activity.
-- Everything here acts on the caller (auth.uid()); no admin can read or change another admin's account.

alter table public.admin_profiles
  add column display_name text check (char_length(display_name) <= 60),
  add column phone text check (char_length(phone) <= 30),
  add column job_title text check (char_length(job_title) <= 80),
  add column department text check (char_length(department) <= 80),
  add column avatar_url text,
  add column password_changed_at timestamptz,
  add column deactivation_requested_at timestamptz;

-- Notification + display preferences as one validated jsonb document.
create table public.admin_account_prefs (
  admin_id uuid primary key references public.admin_profiles (id) on delete cascade,
  prefs jsonb not null default '{}' check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) < 8192),
  updated_at timestamptz not null default now()
);

-- Hashed (sha256) one-time recovery codes. Plaintext is shown once, at generation.
create table public.admin_backup_codes (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.admin_profiles (id) on delete cascade,
  code_hash bytea not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index admin_backup_codes_admin_idx on public.admin_backup_codes (admin_id);

create table public.admin_api_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  last4 text not null,
  token_hash bytea not null unique,
  scopes text[] not null check (cardinality(scopes) > 0),
  allowed_ips text,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index admin_api_tokens_admin_idx on public.admin_api_tokens (admin_id);

-- Written by the API gateway that will verify tokens.
create table public.admin_api_usage (
  token_id uuid not null references public.admin_api_tokens (id) on delete cascade,
  day date not null,
  calls integer not null default 0,
  errors integer not null default 0,
  primary key (token_id, day)
);

alter table public.admin_account_prefs enable row level security;
alter table public.admin_backup_codes enable row level security;
alter table public.admin_api_tokens enable row level security;
alter table public.admin_api_usage enable row level security;
-- No policies: these tables are only reachable through the RPCs below.

create function public.admin_account_get()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.admin_profiles;
  v_uid uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  select * into p from public.admin_profiles where id = v_uid;

  return jsonb_build_object(
    'full_name', p.full_name, 'display_name', p.display_name, 'phone', p.phone, 'job_title', p.job_title,
    'department', p.department, 'avatar_url', p.avatar_url,
    'email', (select email from auth.users where id = v_uid),
    'role', p.role, 'role_label', (select label from public.admin_role_catalog where role = p.role),
    'permissions', coalesce((select jsonb_agg(jsonb_build_object('area', area, 'level', level) order by sort_order)
                             from public.admin_role_permissions where role = p.role), '[]'::jsonb),
    'member_since', p.created_at,
    'invited_by', (select a.full_name from public.admin_invitations i join public.admin_profiles a on a.id = i.invited_by
                   where lower(i.email) = lower((select email from auth.users where id = v_uid)) and i.status = 'accepted' limit 1),
    'deactivation_requested_at', p.deactivation_requested_at,
    'security', jsonb_build_object(
      'totp', exists (select 1 from auth.mfa_factors f where f.user_id = v_uid and f.factor_type = 'totp' and f.status = 'verified'),
      'totp_added_at', (select min(f.created_at) from auth.mfa_factors f where f.user_id = v_uid and f.factor_type = 'totp' and f.status = 'verified'),
      'password_changed_at', p.password_changed_at,
      'backup_codes_left', (select count(*) from public.admin_backup_codes where admin_id = v_uid and used_at is null),
      'backup_codes_total', (select count(*) from public.admin_backup_codes where admin_id = v_uid)
    )
  );
end;
$$;

create function public.admin_account_update_profile(p_payload jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_payload ->> 'full_name', ''));
begin
  perform public.assert_console_admin();
  if char_length(v_name) < 2 then
    raise exception 'enter your full name' using errcode = '22023';
  end if;
  begin
    update public.admin_profiles set
      full_name = v_name,
      display_name = nullif(trim(p_payload ->> 'display_name'), ''),
      phone = nullif(trim(p_payload ->> 'phone'), ''),
      job_title = nullif(trim(p_payload ->> 'job_title'), ''),
      department = nullif(trim(p_payload ->> 'department'), ''),
      avatar_url = nullif(p_payload ->> 'avatar_url', '')
    where id = (select auth.uid());
  exception
    when check_violation then
      raise exception 'a profile field is too long' using errcode = '22023';
  end;
  perform analytics_private.write_audit('account.profile_update', 'admin_profiles');
end;
$$;

-- Called by the console after Supabase Auth accepted the new password.
create function public.admin_account_password_changed()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  update public.admin_profiles set password_changed_at = now() where id = (select auth.uid());
  perform analytics_private.write_audit('auth.password_change', 'admin_profiles');
end;
$$;

create function public.admin_account_sessions()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current text := (select auth.jwt() ->> 'session_id');
begin
  perform public.assert_console_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'user_agent', s.user_agent, 'ip', host(s.ip), 'created_at', s.created_at,
      'last_seen_at', coalesce(s.refreshed_at, s.updated_at, s.created_at), 'current', s.id::text = v_current
    ) order by (s.id::text = v_current) desc, coalesce(s.refreshed_at, s.updated_at, s.created_at) desc)
    from auth.sessions s
    where s.user_id = (select auth.uid()) and (s.not_after is null or s.not_after > now())
  ), '[]'::jsonb);
end;
$$;

create function public.admin_account_revoke_session(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  if p_id::text = (select auth.jwt() ->> 'session_id') then
    raise exception 'use Sign out to end this device''s session' using errcode = '22023';
  end if;
  delete from auth.sessions where id = p_id and user_id = (select auth.uid());
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  perform analytics_private.write_audit('account.session_revoke', p_id::text);
end;
$$;

create function public.admin_account_security_activity()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object('action', action, 'at', created_at, 'resource', resource) order by created_at desc)
    from (
      select * from public.audit_log
      where actor_id = (select auth.uid()) and (action like 'auth.%' or action like 'account.%')
      order by created_at desc limit 5
    ) a
  ), '[]'::jsonb);
end;
$$;

create function public.admin_account_prefs_get()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return coalesce((select prefs from public.admin_account_prefs where admin_id = (select auth.uid())), '{}'::jsonb);
end;
$$;

create function public.admin_account_prefs_save(p_prefs jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  if p_prefs is null or jsonb_typeof(p_prefs) <> 'object' then
    raise exception 'preferences must be an object' using errcode = '22023';
  end if;
  begin
    insert into public.admin_account_prefs (admin_id, prefs) values ((select auth.uid()), p_prefs)
    on conflict (admin_id) do update set prefs = public.admin_account_prefs.prefs || excluded.prefs, updated_at = now();
  exception
    when check_violation then
      raise exception 'preferences are too large' using errcode = '22023';
  end;
end;
$$;

-- Recovery codes: 10 codes like 8KQ2-7HZD, stored as sha256. Replaces every previous code.
create function public.admin_account_backup_codes_generate()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_uid uuid := (select auth.uid());
  v_codes text[] := '{}';
  v_code text;
  i integer;
  j integer;
begin
  perform public.assert_console_admin();
  delete from public.admin_backup_codes where admin_id = v_uid;
  for i in 1..10 loop
    v_code := '';
    for j in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % length(v_alphabet)), 1);
      if j = 4 then v_code := v_code || '-'; end if;
    end loop;
    v_codes := v_codes || v_code;
    insert into public.admin_backup_codes (admin_id, code_hash) values (v_uid, extensions.digest(v_code, 'sha256'));
  end loop;
  perform analytics_private.write_audit('account.backup_codes_regenerate', 'admin_backup_codes');
  return to_jsonb(v_codes);
end;
$$;

create function public.admin_account_tokens()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'tokens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'last4', last4, 'scopes', scopes, 'allowed_ips', allowed_ips,
        'expires_at', expires_at, 'last_used_at', last_used_at, 'created_at', created_at
      ) order by created_at desc)
      from public.admin_api_tokens where admin_id = v_uid and revoked_at is null and expires_at > now()
    ), '[]'::jsonb),
    'max', 5,
    'usage', (
      select jsonb_build_object(
        'calls', coalesce(sum(u.calls), 0), 'errors', coalesce(sum(u.errors), 0),
        'days', coalesce((
          select jsonb_agg(coalesce(d.calls, 0) order by g.day)
          from generate_series(current_date - 29, current_date, interval '1 day') g(day)
          left join (
            select u2.day, sum(u2.calls) as calls from public.admin_api_usage u2
            join public.admin_api_tokens t2 on t2.id = u2.token_id where t2.admin_id = v_uid group by u2.day
          ) d on d.day = g.day::date
        ), '[]'::jsonb)
      )
      from public.admin_api_usage u join public.admin_api_tokens t on t.id = u.token_id
      where t.admin_id = v_uid and u.day >= current_date - 29
    )
  );
end;
$$;

create function public.admin_account_token_create(p_name text, p_scopes text[], p_expires_in_days integer, p_allowed_ips text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_token text;
  v_id uuid;
  v_name text := trim(coalesce(p_name, ''));
begin
  perform public.assert_console_admin();
  if char_length(v_name) < 2 then
    raise exception 'give the token a name' using errcode = '22023';
  end if;
  if p_scopes is null or cardinality(p_scopes) = 0 then
    raise exception 'choose at least one scope' using errcode = '22023';
  end if;
  if not p_scopes <@ array['analytics:read', 'subscriptions:read', 'users:read', 'content:write'] then
    raise exception 'that scope is not available for tokens' using errcode = '22023';
  end if;
  if p_expires_in_days is null or p_expires_in_days not between 1 and 365 then
    raise exception 'choose an expiry between 1 and 365 days' using errcode = '22023';
  end if;
  if (select count(*) from public.admin_api_tokens where admin_id = v_uid and revoked_at is null and expires_at > now()) >= 5 then
    raise exception 'you already have 5 active tokens; revoke one first' using errcode = '22023';
  end if;

  v_token := 'spa_live_' || encode(extensions.gen_random_bytes(20), 'hex');
  insert into public.admin_api_tokens (admin_id, name, last4, token_hash, scopes, allowed_ips, expires_at)
  values (v_uid, v_name, right(v_token, 4), extensions.digest(v_token, 'sha256'), p_scopes, nullif(trim(coalesce(p_allowed_ips, '')), ''),
          now() + make_interval(days => p_expires_in_days))
  returning id into v_id;
  perform analytics_private.write_audit('account.token_create', v_id::text, jsonb_build_object('scopes', p_scopes));
  return jsonb_build_object('id', v_id, 'token', v_token);
end;
$$;

create function public.admin_account_token_revoke(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  update public.admin_api_tokens set revoked_at = now() where id = p_id and admin_id = (select auth.uid()) and revoked_at is null;
  if not found then
    raise exception 'token not found' using errcode = 'P0002';
  end if;
  perform analytics_private.write_audit('account.token_revoke', p_id::text);
end;
$$;

create function public.admin_account_request_deactivation(p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text := analytics_private.require_reason(p_reason);
begin
  perform public.assert_console_admin();
  update public.admin_profiles set deactivation_requested_at = now() where id = (select auth.uid());
  perform analytics_private.write_audit('account.deactivation_request', 'admin_profiles', jsonb_build_object('reason', v_reason));
end;
$$;
