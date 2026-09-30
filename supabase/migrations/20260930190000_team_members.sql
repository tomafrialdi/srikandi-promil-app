-- Team members: list, summary, edit, suspend / reactivate, remove console access.
-- Only Super admins and Admins manage members; Admins cannot touch Super admins. Nobody manages themselves here
-- (own profile lives in Account settings), and the last active Super admin can never be demoted, suspended or removed.

create function analytics_private.can_manage_member(p_target uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_target <> (select auth.uid())
    and case analytics_private.console_role()
      when 'super_admin' then true
      when 'admin' then coalesce((select role <> 'super_admin' from public.admin_profiles where id = p_target), false)
      else false
    end
$$;

-- Raises unless the caller may manage p_target; returns the target row.
create function analytics_private.member_for_update(p_target uuid)
returns public.admin_profiles
language plpgsql
stable
set search_path = ''
as $$
declare
  t public.admin_profiles;
begin
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  select * into t from public.admin_profiles where id = p_target;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if t.id = (select auth.uid()) then
    raise exception 'use Account settings to change your own profile' using errcode = '42501';
  end if;
  if not analytics_private.can_manage_member(p_target) then
    raise exception 'only a Super admin can manage a Super admin' using errcode = '42501';
  end if;
  return t;
end;
$$;

create function analytics_private.assert_not_last_super_admin(p_target uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if exists (select 1 from public.admin_profiles where id = p_target and role = 'super_admin' and is_active)
     and not exists (select 1 from public.admin_profiles where id <> p_target and role = 'super_admin' and is_active) then
    raise exception 'there must always be one active Super admin' using errcode = '22023';
  end if;
end;
$$;

create function analytics_private.member_tfa(p_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when exists (select 1 from auth.mfa_factors f where f.user_id = p_id and f.status = 'verified' and f.factor_type = 'webauthn') then 'passkey'
    when exists (select 1 from auth.mfa_factors f where f.user_id = p_id and f.status = 'verified') then 'authenticator'
    else 'none'
  end
$$;

create function public.admin_members_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  return jsonb_build_object(
    'counts', jsonb_build_object(
      'all', (select count(*) from public.admin_profiles),
      'active', (select count(*) from public.admin_profiles where is_active),
      'suspended', (select count(*) from public.admin_profiles where not is_active)
    ),
    'mini', jsonb_build_object(
      'active', (select count(*) from public.admin_profiles where is_active),
      'online', (select count(*) from public.admin_profiles p where p.is_active and (
        p.id = (select auth.uid()) or analytics_private.admin_last_seen(p.id) > now() - interval '5 minutes')),
      'tfa', (select count(*) from public.admin_profiles p where p.is_active and analytics_private.member_tfa(p.id) <> 'none'),
      'pending_invites', (select count(*) from public.admin_invitations where status in ('pending', 'pending_approval') and expires_at > now()),
      'expiring_invites', (select count(*) from public.admin_invitations
                            where status in ('pending', 'pending_approval') and expires_at > now() and expires_at < now() + interval '48 hours')
    ),
    'departments', jsonb_build_array('Customer care', 'Engineering', 'Medical', 'Content', 'Community', 'Finance', 'Operations'),
    'can_manage', analytics_private.console_role() in ('super_admin', 'admin')
  );
end;
$$;

create function public.admin_members_list(
  p_tab text default 'all',
  p_search text default null,
  p_role public.admin_role default null,
  p_department text default null,
  p_tfa text default null,
  p_limit integer default 10,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_rows jsonb;
  v_total integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();

  with f as (
    select p.*, u.email, c.label as role_label
    from public.admin_profiles p
    join auth.users u on u.id = p.id
    join public.admin_role_catalog c on c.role = p.role
    where (p_tab = 'all' or (p_tab = 'active' and p.is_active) or (p_tab = 'suspended' and not p.is_active))
      and (p_role is null or p.role = p_role)
      and (nullif(p_department, '') is null or p.department = p_department)
      and (nullif(p_tfa, '') is null or analytics_private.member_tfa(p.id) = p_tfa)
      and (v_search is null or p.full_name ilike '%' || v_search || '%' or u.email ilike '%' || v_search || '%')
  ), page as (
    select * from f order by full_name, id
    limit least(greatest(coalesce(p_limit, 10), 1), 5000) offset greatest(coalesce(p_offset, 0), 0)
  )
  select
    (select count(*) from f),
    coalesce((select jsonb_agg(jsonb_build_object(
      'id', g.id, 'name', g.full_name, 'email', g.email, 'role', g.role, 'role_label', g.role_label,
      'job_title', g.job_title, 'department', g.department,
      'status', case when g.is_active then 'active' else 'suspended' end,
      'last_seen', analytics_private.admin_last_seen(g.id),
      'online', g.id = v_me or coalesce(analytics_private.admin_last_seen(g.id) > now() - interval '5 minutes', false),
      'joined', g.created_at, 'tfa', analytics_private.member_tfa(g.id),
      'is_me', g.id = v_me, 'can_manage', analytics_private.can_manage_member(g.id)
    ) order by g.full_name, g.id) from page g), '[]'::jsonb)
  into v_total, v_rows;

  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

create function public.admin_members_update(p_id uuid, p_payload jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.admin_profiles;
  v_name text := trim(coalesce(p_payload ->> 'full_name', ''));
  v_role public.admin_role := coalesce(nullif(p_payload ->> 'role', '')::public.admin_role, (select role from public.admin_profiles where id = p_id));
  v_old_label text;
  v_new_label text;
begin
  perform public.assert_console_admin();
  t := analytics_private.member_for_update(p_id);

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'enter a full name (2–80 characters)' using errcode = '22023';
  end if;
  if v_role = 'super_admin' and analytics_private.console_role() <> 'super_admin' then
    raise exception 'only a Super admin can grant Super admin' using errcode = '42501';
  end if;
  if v_role is distinct from t.role then
    perform analytics_private.assert_not_last_super_admin(p_id);
  end if;

  begin
    update public.admin_profiles set
      full_name = v_name,
      job_title = nullif(trim(coalesce(p_payload ->> 'job_title', '')), ''),
      department = nullif(trim(coalesce(p_payload ->> 'department', '')), ''),
      role = v_role
    where id = p_id;
  exception
    when check_violation then
      raise exception 'a field is too long' using errcode = '22023';
  end;

  if v_role is distinct from t.role then
    select label into v_old_label from public.admin_role_catalog where role = t.role;
    select label into v_new_label from public.admin_role_catalog where role = v_role;
    perform analytics_private.write_audit('admin.role_change', p_id::text,
      jsonb_build_object('summary', 'Changed role: ' || split_part(t.full_name, ' ', 1) || ' → ' || v_new_label, 'from', v_old_label, 'to', v_new_label));
    if coalesce((select policy #>> '{sessions,signout_on_role_change}' from public.admin_security_policy where id = 1)::boolean, false) then
      delete from auth.sessions where user_id = p_id;
    end if;
  end if;
  perform analytics_private.write_audit('admin.update', p_id::text, jsonb_build_object('summary', 'Updated team member ' || v_name));
end;
$$;

create function public.admin_members_set_active(p_id uuid, p_active boolean, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.admin_profiles;
  v_reason text := analytics_private.require_reason(p_reason);
begin
  perform public.assert_console_admin();
  t := analytics_private.member_for_update(p_id);
  if t.is_active = p_active then
    return;
  end if;
  if not p_active then
    perform analytics_private.assert_not_last_super_admin(p_id);
  end if;
  update public.admin_profiles set is_active = p_active where id = p_id;
  if not p_active then
    delete from auth.sessions where user_id = p_id;
  end if;
  perform analytics_private.write_audit(case when p_active then 'admin.reactivate' else 'admin.suspend' end, p_id::text,
    jsonb_build_object('summary', case when p_active then 'Reactivated ' else 'Suspended ' end || t.full_name, 'reason', v_reason));
end;
$$;

-- Removes console access (profile + sessions). The sign-in identity is kept so audit history stays attributable.
create function public.admin_members_delete(p_id uuid, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.admin_profiles;
  v_reason text := analytics_private.require_reason(p_reason);
  v_email text;
begin
  perform public.assert_console_admin();
  t := analytics_private.member_for_update(p_id);
  perform analytics_private.assert_not_last_super_admin(p_id);
  select email into v_email from auth.users where id = p_id;

  delete from auth.sessions where user_id = p_id;
  delete from public.admin_profiles where id = p_id;
  perform analytics_private.write_audit('admin.remove', p_id::text,
    jsonb_build_object('summary', 'Removed team member ' || t.full_name, 'email', v_email, 'reason', v_reason));
end;
$$;
