-- Security settings: read, validate, propose (two-person rule), approve. Policy is stored and audited here;
-- enforcement (session lifetime, IP allowlist ...) is applied by the auth layer that reads admin_security_policy.

create function analytics_private.policy_bool(p jsonb, k text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p -> k) is distinct from 'boolean' then
    raise exception 'setting "%" must be on or off', k using errcode = '22023';
  end if;
  return (p ->> k)::boolean;
end;
$$;

create function analytics_private.policy_int(p jsonb, k text, p_allowed integer[])
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  v integer;
begin
  if jsonb_typeof(p -> k) is distinct from 'number' then
    raise exception 'setting "%" must be a number', k using errcode = '22023';
  end if;
  v := (p ->> k)::numeric::integer;
  if not v = any (p_allowed) then
    raise exception 'setting "%" has an unsupported value', k using errcode = '22023';
  end if;
  return v;
end;
$$;

-- Returns the normalised policy. Locked settings (2FA, health-data masking, audit retention) always stay on;
-- DPO and alert channels are only editable by database migration.
create function analytics_private.validate_security_policy(p_draft jsonb, p_current jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  a jsonb := p_draft -> 'authentication';
  s jsonb := p_draft -> 'sessions';
  n jsonb := p_draft -> 'network';
  d jsonb := p_draft -> 'data';
  l jsonb := p_draft -> 'alerts';
begin
  if a is null or s is null or n is null or d is null or l is null then
    raise exception 'the policy is incomplete' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'authentication', jsonb_build_object(
      'sso', analytics_private.policy_bool(a, 'sso'),
      'require_2fa', true,
      'passkeys', analytics_private.policy_bool(a, 'passkeys'),
      'sms_fallback', analytics_private.policy_bool(a, 'sms_fallback'),
      'min_length', analytics_private.policy_int(a, 'min_length', array[8, 10, 12, 14, 16]),
      'rotation_days', analytics_private.policy_int(a, 'rotation_days', array[0, 30, 60, 90, 180]),
      'history', analytics_private.policy_int(a, 'history', array[0, 3, 5, 10]),
      'block_breached', analytics_private.policy_bool(a, 'block_breached')
    ),
    'sessions', jsonb_build_object(
      'idle_minutes', analytics_private.policy_int(s, 'idle_minutes', array[10, 15, 30, 60]),
      'absolute_hours', analytics_private.policy_int(s, 'absolute_hours', array[4, 8, 12, 24]),
      'max_concurrent', analytics_private.policy_int(s, 'max_concurrent', array[1, 2, 3, 5]),
      'signout_on_role_change', analytics_private.policy_bool(s, 'signout_on_role_change'),
      'trust_device', analytics_private.policy_bool(s, 'trust_device'),
      'managed_export_only', analytics_private.policy_bool(s, 'managed_export_only'),
      'block_mobile_browsers', analytics_private.policy_bool(s, 'block_mobile_browsers')
    ),
    'network', jsonb_build_object(
      'ip_restricted', analytics_private.policy_bool(n, 'ip_restricted'),
      'indonesia_only', analytics_private.policy_bool(n, 'indonesia_only'),
      'failed_logins', analytics_private.policy_int(n, 'failed_logins', array[3, 5, 10]),
      'lock_minutes', analytics_private.policy_int(n, 'lock_minutes', array[5, 15, 30, 60]),
      'autoblock_per_hour', analytics_private.policy_int(n, 'autoblock_per_hour', array[10, 20, 50, 100])
    ),
    'data', jsonb_build_object(
      'mask_default', true,
      'pseudonymise_exports', analytics_private.policy_bool(d, 'pseudonymise_exports'),
      'watermark_exports', analytics_private.policy_bool(d, 'watermark_exports'),
      'export_approval', analytics_private.policy_bool(d, 'export_approval'),
      'export_approval_rows', 10000,
      'deleted_purge_days', analytics_private.policy_int(d, 'deleted_purge_days', array[7, 14, 30, 60, 90]),
      'audit_years', 5,
      'attachments_days', analytics_private.policy_int(d, 'attachments_days', array[30, 90, 180, 365]),
      'dpo_name', p_current -> 'data' -> 'dpo_name'
    ),
    'alerts', jsonb_build_object(
      'auto_lock_high', analytics_private.policy_bool(l, 'auto_lock_high'),
      'reauth_medium', analytics_private.policy_bool(l, 'reauth_medium'),
      'channels', p_current -> 'alerts' -> 'channels'
    )
  );
end;
$$;

-- 0-100. Weights favour the controls that stop account takeover and health-data leaks.
create function analytics_private.security_score(p jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (
    15 + 8 -- 2FA required, health data masked (both locked on)
    + case when (p #>> '{authentication,sso}')::boolean then 8 else 0 end
    + case when (p #>> '{authentication,passkeys}')::boolean then 6 else 0 end
    + case when not (p #>> '{authentication,sms_fallback}')::boolean then 8 else 0 end
    + case when (p #>> '{authentication,min_length}')::int >= 14 then 8 when (p #>> '{authentication,min_length}')::int >= 12 then 5 else 2 end
    + case when (p #>> '{authentication,rotation_days}')::int between 1 and 90 then 4 else 0 end
    + case when (p #>> '{authentication,history}')::int >= 5 then 3 else 0 end
    + case when (p #>> '{authentication,block_breached}')::boolean then 5 else 0 end
    + case when (p #>> '{sessions,idle_minutes}')::int <= 30 then 5 else 0 end
    + case when (p #>> '{sessions,absolute_hours}')::int <= 12 then 3 else 0 end
    + case when (p #>> '{sessions,max_concurrent}')::int <= 3 then 3 else 0 end
    + case when (p #>> '{sessions,signout_on_role_change}')::boolean then 3 else 0 end
    + case when (p #>> '{sessions,managed_export_only}')::boolean then 3 else 0 end
    + case when (p #>> '{network,ip_restricted}')::boolean then 6 else 0 end
    + case when (p #>> '{network,indonesia_only}')::boolean then 3 else 0 end
    + case when (p #>> '{network,failed_logins}')::int <= 5 then 3 else 0 end
    + case when (p #>> '{data,pseudonymise_exports}')::boolean then 3 else 0 end
    + case when (p #>> '{data,watermark_exports}')::boolean then 1 else 0 end
    + case when (p #>> '{data,export_approval}')::boolean then 2 else 0 end
  )
$$;

create function analytics_private.allowlist_json()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('cidr', cidr::text, 'label', label, 'expires_on', expires_on) order by cidr), '[]'::jsonb)
  from public.admin_ip_allowlist
$$;

create function analytics_private.rules_json()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(key, enabled), '{}'::jsonb) from public.admin_alert_rules
$$;

-- Normalises the allowlist part of a draft; every cidr must parse.
create function analytics_private.normalise_allowlist(p_list jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_out jsonb;
begin
  if jsonb_typeof(p_list) is distinct from 'array' then
    raise exception 'the IP allowlist is invalid' using errcode = '22023';
  end if;
  if jsonb_array_length(p_list) > 50 then
    raise exception 'the allowlist holds at most 50 ranges' using errcode = '22023';
  end if;
  begin
    select coalesce(jsonb_agg(jsonb_build_object('cidr', x.cidr::text, 'label', x.label, 'expires_on', x.expires_on) order by x.cidr), '[]'::jsonb)
    into v_out
    from (
      select distinct on ((e ->> 'cidr')::cidr)
        (e ->> 'cidr')::cidr as cidr,
        left(trim(coalesce(e ->> 'label', '')), 80) as label,
        nullif(e ->> 'expires_on', '')::date as expires_on
      from jsonb_array_elements(p_list) e
    ) x;
  exception
    when invalid_text_representation or invalid_datetime_format or datetime_field_overflow or numeric_value_out_of_range then
      raise exception 'an IP range is not valid CIDR (e.g. 103.12.44.0/24)' using errcode = '22023';
  end;
  if exists (select 1 from jsonb_array_elements(v_out) e where e ->> 'label' = '') then
    raise exception 'give every IP range a label' using errcode = '22023';
  end if;
  return v_out;
end;
$$;

create function public.admin_security_get()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_policy public.admin_security_policy;
  v_pending public.admin_security_requests;
  v_stale integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  select * into v_policy from public.admin_security_policy where id = 1;
  select * into v_pending from public.admin_security_requests where status = 'pending';

  select count(*) into v_stale
  from public.admin_profiles p
  where p.is_active and (v_policy.policy #>> '{authentication,rotation_days}')::int > 0
    and coalesce(p.password_changed_at, p.created_at) < now() - make_interval(days => (v_policy.policy #>> '{authentication,rotation_days}')::int);

  return jsonb_build_object(
    'policy', v_policy.policy,
    'score', analytics_private.security_score(v_policy.policy),
    'ip_allowlist', (
      select coalesce(jsonb_agg(jsonb_build_object('cidr', cidr::text, 'label', label, 'expires_on', expires_on, 'last_used_at', last_used_at) order by cidr), '[]'::jsonb)
      from public.admin_ip_allowlist
    ),
    'alert_rules', (
      select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', label, 'description', description, 'severity', severity, 'enabled', enabled) order by sort_order), '[]'::jsonb)
      from public.admin_alert_rules
    ),
    'my_ip', analytics_private.request_ip(),
    'can_edit', analytics_private.console_role() = 'super_admin',
    'last_changed', case when v_policy.requested_by is null and v_policy.approved_by is null then null else jsonb_build_object(
      'at', v_policy.updated_at,
      'by', (select string_agg(analytics_private.short_name(full_name), ' + ' order by full_name)
             from public.admin_profiles where id in (v_policy.requested_by, v_policy.approved_by))
    ) end,
    'pending', case when v_pending.id is null then null else jsonb_build_object(
      'id', v_pending.id, 'created_at', v_pending.created_at, 'changes', to_jsonb(v_pending.changes),
      'requested_by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = v_pending.requested_by),
      'mine', v_pending.requested_by = v_me
    ) end,
    'stats', jsonb_build_object(
      'members', (select count(*) from public.admin_profiles where is_active),
      'tfa', (select count(*) from public.admin_profiles p where p.is_active and exists (
        select 1 from auth.mfa_factors f where f.user_id = p.id and f.status = 'verified')),
      'passkeys', (select count(*) from public.admin_profiles p where p.is_active and exists (
        select 1 from auth.mfa_factors f where f.user_id = p.id and f.status = 'verified' and f.factor_type = 'webauthn')),
      'stale_passwords', v_stale
    ),
    'sessions', jsonb_build_object(
      'active', (select count(*) from auth.sessions s where s.user_id in (select id from public.admin_profiles) and (s.not_after is null or s.not_after > now())),
      'members', (select count(distinct s.user_id) from auth.sessions s where s.user_id in (select id from public.admin_profiles) and (s.not_after is null or s.not_after > now()))
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('kind', k.kind, 'active', (
        select count(*) from public.admin_devices d where d.kind = k.kind and d.last_seen_at > now() - interval '30 days'
      )) order by k.ord), '[]'::jsonb)
      from (values ('managed_laptop', 1), ('admin_app', 2), ('browser', 3)) as k(kind, ord)
    ),
    'super_admins', (select count(*) from public.admin_profiles where is_active and role = 'super_admin')
  );
end;
$$;

-- Is p_ip inside any of the given (draft) ranges? Lets the modal warn before an admin locks themselves out.
create function public.admin_security_check_ip(p_ranges text[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ip text := analytics_private.request_ip();
  v_allowed boolean := false;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  if v_ip is null then
    return jsonb_build_object('ip', null, 'allowed', null);
  end if;
  begin
    v_allowed := exists (select 1 from unnest(p_ranges) r where v_ip::inet <<= r::cidr);
  exception
    when invalid_text_representation then
      return jsonb_build_object('ip', v_ip, 'allowed', null);
  end;
  return jsonb_build_object('ip', v_ip, 'allowed', v_allowed);
end;
$$;

create function analytics_private.apply_security_draft(p_draft jsonb, p_requested_by uuid)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  update public.admin_security_policy
     set policy = p_draft -> 'policy', version = version + 1, updated_at = now(),
         requested_by = p_requested_by, approved_by = (select auth.uid())
   where id = 1;

  delete from public.admin_ip_allowlist a
   where not exists (select 1 from jsonb_array_elements(p_draft -> 'ip_allowlist') e where (e ->> 'cidr')::cidr = a.cidr);
  insert into public.admin_ip_allowlist (cidr, label, expires_on)
  select (e ->> 'cidr')::cidr, e ->> 'label', nullif(e ->> 'expires_on', '')::date
  from jsonb_array_elements(p_draft -> 'ip_allowlist') e
  on conflict (cidr) do update set label = excluded.label, expires_on = excluded.expires_on;

  update public.admin_alert_rules r set enabled = (p_draft -> 'alert_rules' ->> r.key)::boolean
   where p_draft -> 'alert_rules' ? r.key;
end;
$$;

-- A Super admin proposes the whole draft; a different Super admin has to approve it.
create function public.admin_security_request(p_draft jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_current public.admin_security_policy;
  v_policy jsonb;
  v_list jsonb;
  v_rules jsonb := analytics_private.rules_json();
  v_draft jsonb;
  v_changes text[];
  v_pending public.admin_security_requests;
  v_ip text := analytics_private.request_ip();
  v_id uuid;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin']::public.admin_role[]);

  select * into v_current from public.admin_security_policy where id = 1;
  v_policy := analytics_private.validate_security_policy(p_draft -> 'policy', v_current.policy);
  v_list := analytics_private.normalise_allowlist(coalesce(p_draft -> 'ip_allowlist', '[]'::jsonb));

  if jsonb_typeof(p_draft -> 'alert_rules') is distinct from 'object' then
    raise exception 'the alert rules are invalid' using errcode = '22023';
  end if;
  select jsonb_object_agg(r.key, coalesce((p_draft -> 'alert_rules' ->> r.key)::boolean, r.enabled)) into v_rules
  from public.admin_alert_rules r;

  v_draft := jsonb_build_object('policy', v_policy, 'ip_allowlist', v_list, 'alert_rules', v_rules);

  select array_agg(c order by c) into v_changes from (
    select s.key || '.' || k.key as c
    from jsonb_each(v_policy) s, jsonb_each(s.value) k
    where k.key not in ('channels', 'dpo_name') and (v_current.policy -> s.key -> k.key) is distinct from k.value
    union all
    select 'network.ip_allowlist' where v_list is distinct from analytics_private.allowlist_json()
    union all
    select 'alerts.rule.' || key from jsonb_each(v_rules) where analytics_private.rules_json() -> key is distinct from value
  ) x;

  if v_changes is null then
    raise exception 'there are no changes to submit' using errcode = '22023';
  end if;

  -- Lock-out guard, only when the network rules change.
  if (v_policy #>> '{network,ip_restricted}')::boolean
     and (v_changes && array['network.ip_restricted', 'network.ip_allowlist']) then
    if jsonb_array_length(v_list) = 0 then
      raise exception 'add at least one IP range before restricting the console' using errcode = '22023';
    end if;
    begin
      if v_ip is not null and not exists (
        select 1 from jsonb_array_elements(v_list) e
        where v_ip::inet <<= (e ->> 'cidr')::cidr and (nullif(e ->> 'expires_on', '') is null or (e ->> 'expires_on')::date >= current_date)
      ) then
        raise exception 'your current IP (%) is not in the allowlist; this would lock you out', v_ip using errcode = '22023';
      end if;
    exception
      when invalid_text_representation then null;
    end;
  end if;

  select * into v_pending from public.admin_security_requests where status = 'pending';
  if v_pending.id is not null then
    if v_pending.requested_by <> v_me then
      raise exception 'a change request from % is already awaiting approval',
        (select analytics_private.short_name(full_name) from public.admin_profiles where id = v_pending.requested_by)
        using errcode = '22023';
    end if;
    update public.admin_security_requests set status = 'cancelled', decided_at = now(), decided_by = v_me where id = v_pending.id;
  end if;

  insert into public.admin_security_requests (requested_by, draft, changes) values (v_me, v_draft, v_changes) returning id into v_id;
  perform analytics_private.write_audit('security.request', v_id::text,
    jsonb_build_object('summary', 'Requested security policy change', 'changes', to_jsonb(v_changes)));
  return v_id;
end;
$$;

create function public.admin_security_decide(p_id uuid, p_approve boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_req public.admin_security_requests;
  v_current public.admin_security_policy;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin']::public.admin_role[]);

  select * into v_req from public.admin_security_requests where id = p_id and status = 'pending' for update;
  if not found then
    raise exception 'that request is no longer pending' using errcode = 'P0002';
  end if;
  if v_req.requested_by = v_me then
    raise exception 'a second Super admin has to decide on your request' using errcode = '42501';
  end if;

  if p_approve then
    select * into v_current from public.admin_security_policy where id = 1;
    -- Re-validate against the live policy so a stale request cannot smuggle in locked values.
    v_req.draft := jsonb_set(v_req.draft, '{policy}', analytics_private.validate_security_policy(v_req.draft -> 'policy', v_current.policy));
    perform analytics_private.apply_security_draft(v_req.draft, v_req.requested_by);
  end if;

  update public.admin_security_requests
     set status = case when p_approve then 'approved' else 'rejected' end::public.security_request_status,
         decided_by = v_me, decided_at = now()
   where id = p_id;
  perform analytics_private.write_audit(case when p_approve then 'security.approve' else 'security.reject' end, p_id::text,
    jsonb_build_object('summary', case when p_approve then 'Approved security policy change' else 'Rejected security policy change' end,
                       'changes', to_jsonb(v_req.changes)));
end;
$$;

create function public.admin_security_cancel(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin']::public.admin_role[]);
  update public.admin_security_requests set status = 'cancelled', decided_by = (select auth.uid()), decided_at = now()
   where id = p_id and status = 'pending' and requested_by = (select auth.uid());
  if not found then
    raise exception 'that request is no longer pending' using errcode = 'P0002';
  end if;
  perform analytics_private.write_audit('security.cancel', p_id::text, jsonb_build_object('summary', 'Cancelled security policy request'));
end;
$$;

-- Ends every console session except the caller's.
create function public.admin_security_sign_out_all()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin']::public.admin_role[]);
  delete from auth.sessions s
   where s.user_id in (select id from public.admin_profiles)
     and s.id::text is distinct from (select auth.jwt() ->> 'session_id');
  get diagnostics v_count = row_count;
  perform analytics_private.write_audit('security.sign_out_all', 'auth.sessions',
    jsonb_build_object('summary', 'Signed out all console sessions', 'sessions', v_count));
  return v_count;
end;
$$;
