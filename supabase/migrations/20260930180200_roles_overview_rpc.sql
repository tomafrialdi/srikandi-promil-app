-- Roles & access page: permission matrix, team members, audit log (+ CSV export feed).

create function public.admin_roles_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_my_role public.admin_role := analytics_private.console_role();
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();

  return jsonb_build_object(
    'my_role', v_my_role,
    'can_invite', v_my_role in ('super_admin', 'admin'),
    'can_edit_security', v_my_role = 'super_admin',
    'columns', (
      select coalesce(jsonb_agg(jsonb_build_object('key', area, 'label', area_label) order by area_order), '[]'::jsonb)
      from (select distinct area, area_label, area_order from public.admin_access_matrix) a
    ),
    'roles', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'role', c.role, 'label', c.label, 'summary', coalesce(c.short_summary, c.summary),
        'members', (select count(*) from public.admin_profiles p where p.role = c.role and p.is_active),
        'levels', (select jsonb_agg(m.level order by m.area_order) from public.admin_access_matrix m where m.role = c.role)
      ) order by c.sort_order), '[]'::jsonb)
      from public.admin_role_catalog c
    ),
    'total_members', (select count(*) from public.admin_profiles where is_active),
    'team', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.full_name, 'role', t.role, 'role_label', t.role_label,
        'last_seen', t.last_seen, 'online', t.id = v_me or coalesce(t.last_seen > now() - interval '5 minutes', false)
      ) order by (t.id = v_me) desc, t.last_seen desc nulls last, t.full_name), '[]'::jsonb)
      from (
        select p.id, p.full_name, p.role, c.label as role_label, analytics_private.admin_last_seen(p.id) as last_seen
        from public.admin_profiles p
        join public.admin_role_catalog c on c.role = p.role
        where p.is_active
        order by (p.id = v_me) desc, analytics_private.admin_last_seen(p.id) desc nulls last, p.full_name
        limit 5
      ) t
    ),
    'audit', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'at', a.created_at, 'actor', coalesce(analytics_private.short_name(p.full_name), a.actor_email),
        'action', a.action, 'summary', a.metadata ->> 'summary', 'resource', a.resource, 'ip', analytics_private.mask_ip(a.ip)
      ) order by a.created_at desc, a.id desc), '[]'::jsonb)
      from (select * from public.audit_log order by created_at desc, id desc limit 6) a
      left join public.admin_profiles p on p.id = a.actor_id
    )
  );
end;
$$;

-- Feed for the "Export" button on the audit log card.
create function public.admin_roles_audit_export(p_limit integer default 1000)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_roles_access();

  select coalesce(jsonb_agg(jsonb_build_object(
    'at', a.created_at, 'actor', coalesce(p.full_name, a.actor_email), 'action', a.action,
    'summary', a.metadata ->> 'summary', 'resource', a.resource, 'ip', analytics_private.mask_ip(a.ip)
  ) order by a.created_at desc, a.id desc), '[]'::jsonb)
  into v_rows
  from (select * from public.audit_log order by created_at desc, id desc limit least(greatest(coalesce(p_limit, 1000), 1), 5000)) a
  left join public.admin_profiles p on p.id = a.actor_id;

  perform analytics_private.write_audit('audit.export', 'audit_log', jsonb_build_object('rows', jsonb_array_length(v_rows)));
  return v_rows;
end;
$$;
