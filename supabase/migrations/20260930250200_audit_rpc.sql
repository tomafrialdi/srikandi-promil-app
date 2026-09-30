-- Audit log: summary, event table, event detail, export, chain verification, alerts, data subject requests, saved views.

-- Role changes now remember the keys, so they can be reverted from the audit log.
create or replace function public.admin_members_update(p_id uuid, p_payload jsonb)
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
      jsonb_build_object('summary', 'Changed role: ' || split_part(t.full_name, ' ', 1) || ' → ' || v_new_label, 'from', v_old_label, 'to', v_new_label,
                         'from_role', t.role, 'to_role', v_role, 'target_id', p_id, 'target_name', v_name));
    if coalesce((select policy #>> '{sessions,signout_on_role_change}' from public.admin_security_policy where id = 1)::boolean, false) then
      delete from auth.sessions where user_id = p_id;
    end if;
  end if;
  perform analytics_private.write_audit('admin.update', p_id::text, jsonb_build_object('summary', 'Updated team member ' || v_name));
end;
$$;

create function analytics_private.audit_rows(p_filters jsonb)
returns setof public.audit_log
language plpgsql
stable
set search_path = ''
as $$
declare
  v_cat text := nullif(p_filters ->> 'category', '');
  v_risk text := nullif(p_filters ->> 'risk', '');
  v_search text := nullif(trim(coalesce(p_filters ->> 'search', '')), '');
  v_from timestamptz := coalesce(nullif(p_filters ->> 'from', '')::timestamptz, now() - interval '24 hours');
  v_to timestamptz := coalesce(nullif(p_filters ->> 'to', '')::timestamptz, now() + interval '1 minute');
begin
  return query
  select a.* from public.audit_log a
  where a.created_at >= v_from and a.created_at <= v_to
    and (v_cat is null or a.category = v_cat)
    and (v_risk is null or a.risk = v_risk)
    and (v_search is null or a.action ilike '%' || v_search || '%' or coalesce(a.resource, '') ilike '%' || v_search || '%' or coalesce(a.ip, '') ilike '%' || v_search || '%'
         or coalesce(a.actor_email, '') ilike '%' || v_search || '%' or coalesce(a.metadata ->> 'summary', '') ilike '%' || v_search || '%'
         or exists (select 1 from public.admin_profiles p where p.id = a.actor_id and p.full_name ilike '%' || v_search || '%'));
end;
$$;

create function analytics_private.audit_actor(a public.audit_log)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case
    when a.actor_id is not null then jsonb_build_object('name', p.full_name, 'role', c.label, 'id', a.actor_id)
    when a.metadata ? 'system' then jsonb_build_object('name', 'system', 'role', a.metadata ->> 'system', 'id', null)
    when a.action like 'auth.failed%' then jsonb_build_object('name', 'unknown', 'role', null, 'id', null)
    else jsonb_build_object('name', coalesce(a.actor_email, 'system'), 'role', null, 'id', null) end
  from (select 1) x left join public.admin_profiles p on p.id = a.actor_id left join public.admin_role_catalog c on c.role = p.role
$$;

create function analytics_private.audit_row_json(a public.audit_log)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', a.id, 'evt', 'evt_' || lpad(a.id::text, 8, '0'), 'at', a.created_at, 'actor', analytics_private.audit_actor(a), 'category', a.category, 'risk', a.risk,
    'action', a.action, 'summary', a.metadata ->> 'summary', 'resource', a.resource, 'ip', a.ip, 'device', a.device,
    'flagged', exists (select 1 from public.audit_event_flags f where f.event_id = a.id)
  )
$$;

create function public.admin_audit_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_cur bigint;
  v_prev bigint;
  v_chk public.audit_chain_checks;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  select count(*) into v_cur from public.audit_log where created_at > v_now - interval '24 hours';
  select count(*) into v_prev from public.audit_log where created_at > v_now - interval '48 hours' and created_at <= v_now - interval '24 hours';
  select * into v_chk from public.audit_chain_checks order by id desc limit 1;

  return jsonb_build_object(
    'events', v_cur, 'events_prev', v_prev,
    'health_access', (select count(*) from public.audit_log where category = 'data_access' and created_at > v_now - interval '24 hours'),
    'unmasked', (select count(*) from public.audit_log where action like '%unmask%' and created_at > v_now - interval '24 hours'),
    'failed_logins', (select count(*) from public.audit_log where action like 'auth.failed%' and created_at > v_now - interval '24 hours'),
    'flagged_ips', (select count(*) from (select ip from public.audit_log where action like 'auth.failed%' and created_at > v_now - interval '24 hours' and ip is not null
                                          group by ip, date_trunc('hour', created_at) having count(*) >= 5) x),
    'config_changes', (select count(*) from public.audit_log where created_at > v_now - interval '24 hours'
                         and (action in ('plan.update', 'plan.price_request', 'promo.create', 'promo.update', 'admin.role_change', 'admin.invite', 'admin.remove', 'admin.suspend', 'clinic.update', 'clinic.approve', 'doctor.update', 'medication.approve')
                              or action in ('engine.draft', 'engine.submit', 'engine.approve', 'engine.canary', 'engine.expand_25', 'engine.expand_100', 'engine.rollback') or action like 'security.%')),
    'config_areas', (select coalesce(jsonb_agg(distinct g), '[]'::jsonb) from (select case when action like 'engine.%' then 'engine' when action like 'plan.%' or action like 'promo.%' then 'pricing'
                        when action like 'admin.%' or action like 'security.%' then 'roles' else 'care' end as g from public.audit_log where created_at > v_now - interval '24 hours'
                        and (action like 'engine.%' and action <> 'engine.override' or action like 'plan.%' or action like 'promo.%' or action like 'admin.%' or action like 'security.%' or action like 'clinic.%' or action like 'doctor.update' or action like 'medication.approve')) x),
    'chain', case when v_chk.id is null then null else jsonb_build_object('ok', v_chk.ok, 'at', v_chk.checked_at, 'rows', v_chk.rows_checked, 'broken_at', v_chk.broken_at) end,
    'head', (select encode(hash, 'hex') from public.audit_log order by id desc limit 1),
    'alerts', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'number', number, 'severity', severity, 'title', title, 'detail', detail, 'at', created_at, 'status', status) order by created_at desc), '[]'::jsonb)
               from (select * from public.audit_alerts where status <> 'closed' order by created_at desc limit 3) a),
    'dsr_due', (select jsonb_build_object('id', id, 'number', number, 'type', type, 'subject_ref', subject_ref, 'due_at', due_at, 'received_at', received_at)
                from public.pdp_requests where status <> 'completed' order by due_at limit 1),
    'can_act', analytics_private.console_role() in ('super_admin', 'admin'),
    'can_export', analytics_private.console_role() in ('super_admin', 'admin'),
    'can_revert', analytics_private.console_role() = 'super_admin'
  );
end;
$$;

create function public.admin_audit_list(p_filters jsonb default '{}', p_limit integer default 10, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
  v_total bigint;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  select count(*) into v_total from analytics_private.audit_rows(p_filters);
  select coalesce(jsonb_agg(analytics_private.audit_row_json(a) order by a.created_at desc, a.id desc), '[]'::jsonb) into v_rows
  from (select * from analytics_private.audit_rows(p_filters) order by created_at desc, id desc limit least(greatest(coalesce(p_limit, 10), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) a;
  return jsonb_build_object('rows', v_rows, 'total', v_total, 'head', (select encode(hash, 'hex') from public.audit_log order by id desc limit 1));
end;
$$;

create function public.admin_audit_get(p_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  a public.audit_log;
  v_user uuid;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  select * into a from public.audit_log where id = p_id;
  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  select u.id into v_user from public.app_users u where a.resource like 'usr\_%' and analytics_private.user_ref(u.id) = a.resource limit 1;

  return analytics_private.audit_row_json(a) || jsonb_build_object(
    'metadata', a.metadata,
    'hash', encode(a.hash, 'hex'), 'prev_hash', encode(a.prev_hash, 'hex'),
    'user_id', coalesce(v_user, nullif(a.metadata ->> 'user_id', '')::uuid),
    'related', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'at', r.created_at, 'text', coalesce(r.metadata ->> 'summary', r.action), 'self', r.id = a.id, 'category', r.category) order by r.created_at, r.id)
      from (select * from public.audit_log r where (r.id = a.id or (a.resource is not null and r.resource = a.resource and r.created_at between a.created_at - interval '1 day' and a.created_at + interval '1 day')
                                                  or (a.metadata ? 'ticket' and r.metadata ->> 'ticket' = a.metadata ->> 'ticket'))
            order by r.created_at desc, r.id desc limit 8) r), '[]'::jsonb),
    'flag', (select jsonb_build_object('at', f.flagged_at, 'by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = f.flagged_by), 'note', f.note) from public.audit_event_flags f where f.event_id = a.id)
  );
end;
$$;

create function public.admin_audit_count(p_filters jsonb default '{}')
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  return (select count(*) from analytics_private.audit_rows(p_filters));
end;
$$;

-- The export is itself an audit event (with purpose and scope). Up to 50,000 rows per export.
create function public.admin_audit_export(p_filters jsonb, p_purpose text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
  v_n bigint;
  v_purpose text := analytics_private.require_reason(p_purpose);
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  select count(*) into v_n from analytics_private.audit_rows(p_filters);
  if v_n > 50000 then
    raise exception 'that is % events; narrow the period or categories (max 50,000 per export)', v_n using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(analytics_private.audit_row_json(a) || jsonb_build_object('hash', encode(a.hash, 'hex'), 'prev_hash', encode(a.prev_hash, 'hex'), 'metadata', a.metadata) order by a.id), '[]'::jsonb)
    into v_rows from analytics_private.audit_rows(p_filters) a;
  perform analytics_private.write_audit('audit.export', 'audit_log', jsonb_build_object('summary', 'Exported ' || v_n || ' audit events', 'rows', v_n, 'purpose', v_purpose, 'filters', p_filters));
  return jsonb_build_object('rows', v_rows, 'count', v_n);
end;
$$;

create function public.admin_audit_verify()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  j jsonb;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  j := analytics_private.audit_verify();
  insert into public.audit_chain_checks (ok, rows_checked, head_hash, broken_at, checked_by)
  values ((j ->> 'ok')::boolean, (j ->> 'rows')::bigint, decode(nullif(j ->> 'head', ''), 'hex'), (j ->> 'broken_at')::bigint, (select auth.uid()));
  return j;
end;
$$;

create function public.admin_audit_flag(p_id bigint, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  if not exists (select 1 from public.audit_log where id = p_id) then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  insert into public.audit_event_flags (event_id, flagged_by, note) values (p_id, (select auth.uid()), nullif(left(trim(coalesce(p_note, '')), 300), ''))
  on conflict (event_id) do nothing;
  perform analytics_private.write_audit('audit.flag', 'evt_' || lpad(p_id::text, 8, '0'), jsonb_build_object('summary', 'Flagged evt_' || lpad(p_id::text, 8, '0') || ' for DPO review'));
end;
$$;

create function public.admin_audit_revert(p_id bigint)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.audit_log;
  v_target uuid;
  v_from public.admin_role;
  t public.admin_profiles;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin']::public.admin_role[]);
  select * into a from public.audit_log where id = p_id;
  if not found or a.action <> 'admin.role_change' or not (a.metadata ? 'target_id') or not (a.metadata ? 'from_role') then
    raise exception 'only role changes made after this feature can be reverted' using errcode = '22023';
  end if;
  v_target := (a.metadata ->> 'target_id')::uuid;
  v_from := (a.metadata ->> 'from_role')::public.admin_role;
  select * into t from public.admin_profiles where id = v_target;
  if not found then
    raise exception 'that member no longer exists' using errcode = 'P0002';
  end if;
  if t.role::text <> a.metadata ->> 'to_role' then
    raise exception 'the role changed again since; nothing to revert' using errcode = '22023';
  end if;
  if v_target = (select auth.uid()) then
    raise exception 'you can not change your own role' using errcode = '42501';
  end if;
  perform analytics_private.assert_not_last_super_admin(v_target);
  update public.admin_profiles set role = v_from where id = v_target;
  perform analytics_private.write_audit('admin.role_change', v_target::text, jsonb_build_object('summary', 'Reverted role: ' || split_part(t.full_name, ' ', 1) || ' → ' || (select label from public.admin_role_catalog where role = v_from),
    'from_role', t.role, 'to_role', v_from, 'target_id', v_target, 'reverts', a.id));
end;
$$;

-- ── alerts ───────────────────────────────────────────────────────────────────

create function public.admin_audit_alert_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  a public.audit_alerts;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  select * into a from public.audit_alerts where id = p_id;
  if not found then
    raise exception 'alert not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'id', a.id, 'number', a.number, 'rule_key', a.rule_key, 'severity', a.severity, 'title', a.title, 'detail', a.detail, 'subject', a.subject, 'status', a.status,
    'resolution', a.resolution, 'note', a.note, 'created_at', a.created_at, 'containment', a.containment,
    'actor', (select jsonb_build_object('id', p.id, 'name', p.full_name, 'role', c.label, 'email', u.email) from public.admin_profiles p join public.admin_role_catalog c on c.role = p.role
              join auth.users u on u.id = p.id where p.id = a.actor_id),
    'assigned', (select analytics_private.short_name(full_name) from public.admin_profiles where id = a.assigned_to),
    'unmask_block_until', (select until from public.admin_unmask_blocks where admin_id = a.actor_id and until > now()),
    'hourly', (select coalesce(jsonb_agg(coalesce(n, 0) order by h), '[]'::jsonb) from generate_series(0, 23) h
               left join (select extract(hour from created_at at time zone 'Asia/Jakarta')::int as hr, count(*) as n from public.audit_log
                          where actor_id = a.actor_id and action like '%unmask%' and (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date group by 1) x on x.hr = h),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('at', l.created_at, 'resource', l.resource, 'ticket', coalesce(l.metadata ->> 'ticket', substring(coalesce(l.metadata ->> 'reason', '') from 'TCK-[0-9]+'))) order by l.created_at), '[]'::jsonb)
                 from (select * from public.audit_log where actor_id = a.actor_id and action like '%unmask%' and created_at > a.created_at - interval '2 hours' order by created_at desc limit 30) l)
  );
end;
$$;

create function public.admin_audit_alert_contain(p_id uuid, p_kind text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.audit_alerts;
  v_me uuid := (select auth.uid());
  v_done text;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  select * into a from public.audit_alerts where id = p_id for update;
  if not found or a.status = 'closed' then
    raise exception 'that alert is closed' using errcode = 'P0002';
  end if;
  if p_kind = 'reauth' then
    if a.actor_id is null then raise exception 'this alert has no actor' using errcode = '22023'; end if;
    delete from auth.sessions where user_id = a.actor_id;
    v_done := 'Signed the actor out everywhere; they must re-authenticate with 2FA';
  elsif p_kind = 'suspend_unmask' then
    if a.actor_id is null then raise exception 'this alert has no actor' using errcode = '22023'; end if;
    insert into public.admin_unmask_blocks (admin_id, until, reason, created_by) values (a.actor_id, now() + interval '24 hours', 'Alert #' || a.number, v_me)
    on conflict (admin_id) do update set until = excluded.until, reason = excluded.reason, created_by = excluded.created_by, created_at = now();
    v_done := 'Suspended unmask permission for 24 hours';
  elsif p_kind = 'notify' then
    v_done := 'Logged a notification to the DPO and Super admins';
  else
    raise exception 'unknown containment action' using errcode = '22023';
  end if;
  update public.audit_alerts set containment = containment || jsonb_build_array(jsonb_build_object('kind', p_kind, 'at', now(), 'by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = v_me))),
    assigned_to = coalesce(assigned_to, v_me), status = 'in_progress' where id = p_id;
  perform analytics_private.write_audit('security.contain', 'alert_' || lpad(a.number::text, 4, '0'), jsonb_build_object('summary', v_done, 'kind', p_kind, 'risk', 'high'));
end;
$$;

create function public.admin_audit_alert_resolve(p_id uuid, p_resolution text, p_note text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.audit_alerts;
  v_me uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  if p_resolution not in ('legitimate', 'follow_up', 'misuse') then
    raise exception 'pick a resolution' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_note, ''))) < 3 then
    raise exception 'add a short note explaining the decision' using errcode = '22023';
  end if;
  select * into a from public.audit_alerts where id = p_id for update;
  if not found then
    raise exception 'alert not found' using errcode = 'P0002';
  end if;
  update public.audit_alerts set resolution = p_resolution, note = left(trim(p_note), 600), assigned_to = coalesce(assigned_to, v_me),
    status = case when p_resolution = 'follow_up' then 'in_progress' else 'closed' end, closed_at = case when p_resolution = 'follow_up' then null else now() end where id = p_id;
  perform analytics_private.write_audit('security.alert_resolve', 'alert_' || lpad(a.number::text, 4, '0'),
    jsonb_build_object('summary', 'Alert #' || a.number || ' ' || case p_resolution when 'legitimate' then 'closed as legitimate' when 'misuse' then 'closed as confirmed misuse' else 'needs follow-up' end, 'resolution', p_resolution));
end;
$$;

-- ── UU PDP data subject requests ─────────────────────────────────────────────

create function analytics_private.pdp_json(r public.pdp_requests)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id, 'number', r.number, 'type', r.type, 'subject_ref', r.subject_ref, 'user_id', r.user_id, 'status', r.status, 'status_note', r.status_note,
    'received_at', r.received_at, 'due_at', r.due_at, 'completed_at', r.completed_at, 'identity_check', r.identity_check, 'plan_note', r.plan_note,
    'owner', (select analytics_private.short_name(full_name) from public.admin_profiles where id = r.owner_id), 'systems', r.systems, 'timeline', r.timeline, 'certificate_at', r.certificate_at
  )
$$;

create function public.admin_pdp_list()
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
    'open', (select count(*) from public.pdp_requests where status <> 'completed'),
    'rows', coalesce((select jsonb_agg(analytics_private.pdp_json(r) order by (r.status = 'completed'), r.due_at) from (select * from public.pdp_requests order by (status = 'completed'), due_at limit 6) r), '[]'::jsonb));
end;
$$;

create function public.admin_pdp_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.pdp_requests;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  select * into r from public.pdp_requests where id = p_id;
  if not found then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  return analytics_private.pdp_json(r) || jsonb_build_object(
    'plan', (select u.plan::text from public.app_users u where u.id = r.user_id),
    'email', (select u.email from public.app_users u where u.id = r.user_id),
    'invoices', (select count(*) from public.transactions t where t.user_id = r.user_id));
end;
$$;

create function public.admin_pdp_update(p_id uuid, p_patch jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.pdp_requests;
  v_me uuid := (select auth.uid());
  v_who text := (select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid()));
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  select * into r from public.pdp_requests where id = p_id for update;
  if not found then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  if p_patch ? 'status' then
    if not p_patch ->> 'status' in ('new', 'in_progress', 'blocked', 'completed') then
      raise exception 'unknown status' using errcode = '22023';
    end if;
    update public.pdp_requests set status = p_patch ->> 'status', status_note = nullif(left(trim(coalesce(p_patch ->> 'status_note', '')), 200), ''),
      completed_at = case when p_patch ->> 'status' = 'completed' then now() else null end, owner_id = coalesce(owner_id, v_me) where id = p_id;
  end if;
  if p_patch ? 'systems' then
    if jsonb_typeof(p_patch -> 'systems') <> 'array' then
      raise exception 'invalid systems' using errcode = '22023';
    end if;
    update public.pdp_requests set systems = p_patch -> 'systems' where id = p_id;
  end if;
  if p_patch ? 'note' and char_length(trim(coalesce(p_patch ->> 'note', ''))) >= 3 then
    update public.pdp_requests set timeline = timeline || jsonb_build_array(jsonb_build_object('at', now(), 'text', left(trim(p_patch ->> 'note'), 200), 'state', 'done', 'by', v_who)) where id = p_id;
  end if;
  perform analytics_private.write_audit('pdp.update', 'DSR-' || lpad(r.number::text, 4, '0'), jsonb_build_object('summary', 'Updated DSR-' || lpad(r.number::text, 4, '0'), 'status', p_patch ->> 'status'));
end;
$$;

create function public.admin_pdp_certificate(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.pdp_requests;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  select * into r from public.pdp_requests where id = p_id for update;
  if not found or r.type <> 'deletion' then
    raise exception 'certificates exist only for deletion requests' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(r.systems) s where s ->> 'state' in ('pending', 'scheduled', 'notified')) then
    raise exception 'finish every system first (deleted, anonymised or retained by law)' using errcode = '22023';
  end if;
  update public.pdp_requests set certificate_at = now(), status = 'completed', completed_at = coalesce(completed_at, now()) where id = p_id;
  perform analytics_private.write_audit('pdp.certificate', 'DSR-' || lpad(r.number::text, 4, '0'), jsonb_build_object('summary', 'Issued deletion certificate for DSR-' || lpad(r.number::text, 4, '0')));
  return analytics_private.pdp_json(r) || jsonb_build_object('certificate_at', now());
end;
$$;

-- ── saved views ──────────────────────────────────────────────────────────────

create function public.admin_audit_views()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  return coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'name', v.name, 'filters', v.filters, 'shared', v.shared, 'mine', v.owner_id = (select auth.uid()),
    'owner', (select analytics_private.short_name(full_name) from public.admin_profiles where id = v.owner_id)) order by v.name)
    from public.audit_saved_views v where v.owner_id = (select auth.uid()) or v.shared), '[]'::jsonb);
end;
$$;

create function public.admin_audit_view_save(p_name text, p_filters jsonb, p_shared boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 50 then
    raise exception 'name the view (2–50 characters)' using errcode = '22023';
  end if;
  insert into public.audit_saved_views (owner_id, name, filters, shared) values ((select auth.uid()), trim(p_name), p_filters, coalesce(p_shared, false)) returning id into v_id;
  return v_id;
end;
$$;

create function public.admin_audit_view_delete(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  delete from public.audit_saved_views where id = p_id and owner_id = (select auth.uid());
end;
$$;
