-- Fertility engine: everything the console pages read.

create function analytics_private.engine_version_json(v public.engine_versions, p_config boolean default false)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', v.id, 'version', v.version, 'status', v.status, 'rollout_pct', v.rollout_pct, 'summary', v.summary, 'notes', v.notes,
    'auto_rollback', v.auto_rollback, 'golden', v.golden, 'signed_off_by', v.signed_off_by,
    'created_at', v.created_at, 'updated_at', v.updated_at, 'submitted_at', v.submitted_at,
    'canary_at', v.canary_at, 'live_at', v.live_at, 'archived_at', v.archived_at,
    'author', (select analytics_private.short_name(full_name) from public.admin_profiles where id = v.created_by)
  ) || case when p_config then jsonb_build_object('config', v.config) else '{}'::jsonb end
$$;

-- The version the console shows and edits: the one being drafted / reviewed, else the canary, else the live one.
create function analytics_private.engine_subject()
returns public.engine_versions
language sql
stable
set search_path = ''
as $$
  select v from public.engine_versions v
  where v.status in ('draft', 'in_review', 'canary', 'live')
  order by case v.status when 'draft' then 1 when 'in_review' then 1 when 'canary' then 2 else 3 end
  limit 1
$$;

create function public.admin_engine_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_role public.admin_role := analytics_private.console_role();
  v_subject public.engine_versions := analytics_private.engine_subject();
  v_live public.engine_versions;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_engine_view();
  select * into v_live from public.engine_versions where status = 'live';

  return jsonb_build_object(
    'me', jsonb_build_object(
      'can_edit', analytics_private.engine_level() = 'full',
      'can_release', v_role in ('super_admin', 'engine_engineer'),
      'is_reviewer', exists (select 1 from public.engine_reviewers where admin_id = v_me)
    ),
    'versions', (
      select coalesce(jsonb_agg(analytics_private.engine_version_json(v) order by v.created_at desc, v.version desc), '[]'::jsonb)
      from public.engine_versions v
    ),
    'subject', case when v_subject.id is null then null else analytics_private.engine_version_json(v_subject, true) end,
    'live', case when v_live.id is not null and v_live.id is distinct from v_subject.id then analytics_private.engine_version_json(v_live, true) end,
    'approvals', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'reviewer_id', a.reviewer_id, 'name', p.full_name, 'credentials', r.credentials, 'decision', a.decision,
        'decided_at', a.decided_at, 'mine', a.reviewer_id = v_me
      ) order by r.sort_order), '[]'::jsonb)
      from public.engine_approvals a
      join public.admin_profiles p on p.id = a.reviewer_id
      join public.engine_reviewers r on r.admin_id = a.reviewer_id
      where a.version_id = v_subject.id
    ),
    'users_now', coalesce((
      select jsonb_object_agg(s ->> 'key', n.total)
      from jsonb_array_elements(v_subject.config -> 'statuses') s
      cross join lateral (
        select (select count(*) from public.engine_runs r
                where r.status in (select jsonb_array_elements_text(coalesce(s -> 'counts_as', '[]'::jsonb))))
             + case when s ? 'counts_mode' then (select count(*) from public.app_users u where u.tracking_mode::text = s ->> 'counts_mode') else 0 end as total
      ) n
    ), '{}'::jsonb),
    'mode_users', jsonb_build_object(
      'ttc', (select count(*) from public.app_users where tracking_mode = 'ttc'),
      'pcos', (select count(*) from public.app_users where tracking_mode = 'pcos'),
      'iui_ivf', (select count(*) from public.app_users where tracking_mode in ('iui', 'ivf')),
      'after_loss', (select count(*) from public.app_users where tracking_mode = 'after_loss')
    ),
    'programs', jsonb_build_object(
      'iui', (select count(*) from public.app_users where tracking_mode = 'iui'),
      'ivf', (select count(*) from public.app_users where tracking_mode = 'ivf')
    ),
    'metrics', coalesce((
      select jsonb_object_agg(scope, rows)
      from (select scope, jsonb_agg(jsonb_build_object('key', key, 'label', label, 'sub', sub, 'value', value, 'chip', chip, 'tone', tone) order by sort_order) as rows
            from public.engine_metrics group by scope) m
    ), '{}'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'mode', e.mode, 'kind', e.kind, 'tone', e.tone, 'title', e.title, 'detail', e.detail, 'at', e.created_at)
                       order by e.created_at desc)
      from (
        select ev.*, row_number() over (partition by ev.mode order by ev.created_at desc) as rn from public.engine_events ev
      ) e where e.rn <= 6
    ), '[]'::jsonb),
    'canary_window_days', 7
  );
end;
$$;

create function public.admin_engine_golden()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_engine_view();
  return coalesce((
    select jsonb_agg(jsonb_build_object('key', key, 'mode', mode, 'label', label, 'description', description, 'signals', signals, 'truth_ov', truth_ov)
                     order by sort_order)
    from public.engine_golden_cases
  ), '[]'::jsonb);
end;
$$;

-- Entry point for apps/mobile: the rule set this user should run. Canary users are picked by a stable hash of their id.
create function public.engine_active_config(p_user uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.engine_versions;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select * into v from public.engine_versions
   where status = 'canary' and p_user is not null and abs(hashtext(p_user::text)) % 100 < rollout_pct;
  if not found then
    select * into v from public.engine_versions where status = 'live';
  end if;
  if not found then
    return null;
  end if;
  return jsonb_build_object('version', v.version, 'rollout_pct', v.rollout_pct, 'config', v.config);
end;
$$;
