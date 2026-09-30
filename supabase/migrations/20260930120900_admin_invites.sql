-- Users › invite admins (role catalogue + invitations).

create function public.admin_role_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'roles', (
      select jsonb_agg(jsonb_build_object(
        'role', c.role, 'label', c.label, 'summary', c.summary, 'approvals', c.approvals_required,
        'permissions', (select jsonb_agg(jsonb_build_object('area', p.area, 'level', p.level) order by p.sort_order)
                        from public.admin_role_permissions p where p.role = c.role)
      ) order by c.sort_order)
      from public.admin_role_catalog c
    ),
    'allowed_domains', (select jsonb_agg(domain order by domain) from public.allowed_admin_domains),
    'departments', jsonb_build_array('Customer care', 'Engineering', 'Medical', 'Content', 'Community', 'Finance', 'Operations'),
    'team', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', full_name) order by full_name), '[]'::jsonb)
             from public.admin_profiles where is_active),
    'me', (select auth.uid()),
    'my_role', analytics_private.console_role()
  );
end;
$$;

create function public.admin_invite_admins(p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_role public.admin_role := (p_payload ->> 'role')::public.admin_role;
  v_approvals integer;
  v_created jsonb := '[]';
  v_email text;
  v_name text;
  v_domain text;
  v_days integer := coalesce((p_payload ->> 'expires_days')::int, 7);
  v_acc jsonb := coalesce(p_payload -> 'access', '{}');
  v_id uuid;
  v_expires timestamptz;
  i jsonb;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  if v_role = 'super_admin' and analytics_private.console_role() <> 'super_admin' then
    raise exception 'only a Super admin can invite Super admins' using errcode = '42501';
  end if;
  if jsonb_array_length(coalesce(p_payload -> 'invitees', '[]')) = 0 then
    raise exception 'add at least one invitee' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_payload ->> 'department', '')), '') is null then
    raise exception 'department is required' using errcode = '22023';
  end if;

  select approvals_required into v_approvals from public.admin_role_catalog where role = v_role;
  v_expires := now() + make_interval(days => v_days);

  for i in select * from jsonb_array_elements(p_payload -> 'invitees') loop
    v_email := lower(trim(i ->> 'email'));
    v_name := nullif(trim(coalesce(i ->> 'full_name', '')), '');
    v_domain := split_part(v_email, '@', 2);

    if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception '% is not a valid email', v_email using errcode = '22023';
    end if;
    if not exists (select 1 from public.allowed_admin_domains where domain = v_domain) then
      raise exception '% is outside allowed domains', v_email using errcode = '22023';
    end if;
    if exists (select 1 from public.admin_invitations where lower(email) = v_email and status in ('pending', 'pending_approval'))
       or exists (select 1 from auth.users where lower(email) = v_email) then
      raise exception '% already has an invitation or account', v_email using errcode = '23505';
    end if;

    insert into public.admin_invitations (
      email, full_name, job_title, department, reports_to, language, role, personal_message, expires_at,
      require_2fa, sso_google, allow_passkeys, access_type, access_expires_on, session_timeout_minutes,
      ip_restricted, allowed_ips, block_personal_export, require_dpa, require_training, overrides, status, invited_by
    ) values (
      v_email, v_name, nullif(p_payload ->> 'job_title', ''), p_payload ->> 'department',
      nullif(p_payload ->> 'reports_to', '')::uuid, coalesce(p_payload ->> 'language', 'English'), v_role,
      nullif(p_payload ->> 'message', ''), v_expires,
      true, coalesce((v_acc ->> 'sso')::boolean, true), coalesce((v_acc ->> 'passkeys')::boolean, true),
      coalesce(v_acc ->> 'access_type', 'permanent'), nullif(v_acc ->> 'access_expires_on', '')::date,
      coalesce((v_acc ->> 'session_timeout_minutes')::int, 30),
      coalesce((v_acc ->> 'ip_restricted')::boolean, false), nullif(v_acc ->> 'allowed_ips', ''),
      coalesce((v_acc ->> 'block_personal_export')::boolean, true), coalesce((v_acc ->> 'require_dpa')::boolean, true),
      coalesce((v_acc ->> 'require_training')::boolean, true), coalesce(p_payload -> 'overrides', '{}'),
      case when v_approvals > 0 then 'pending_approval' else 'pending' end::public.invitation_status,
      (select auth.uid())
    ) returning id into v_id;

    perform analytics_private.write_audit('admin.invite', v_email, jsonb_build_object('role', v_role, 'department', p_payload ->> 'department', 'invitation', v_id));
    v_created := v_created || jsonb_build_array(jsonb_build_object(
      'id', v_id, 'email', v_email, 'status', case when v_approvals > 0 then 'pending_approval' else 'pending' end));
  end loop;

  return jsonb_build_object('created', v_created, 'expires_at', v_expires, 'needs_approval', v_approvals > 0);
end;
$$;
