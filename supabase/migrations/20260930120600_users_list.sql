-- Users › list, summary and shared helpers.

alter table public.app_users
  add column pending_plan public.plan_type,
  add column pending_plan_at timestamptz;

-- Console role of the signed-in admin.
create function analytics_private.console_role()
returns public.admin_role
language sql
stable
set search_path = ''
as $$ select role from public.admin_profiles where id = (select auth.uid()) and is_active $$;

-- Append an audit row on behalf of the current admin.
create function analytics_private.write_audit(p_action text, p_resource text, p_metadata jsonb default '{}')
returns void
language sql
set search_path = ''
as $$
  insert into public.audit_log (actor_id, actor_email, action, resource, metadata)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), p_action, p_resource, coalesce(p_metadata, '{}'))
$$;

create function analytics_private.phase_label(p_mode public.tracking_mode, p_status text, p_cd integer, p_ov integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_cd is null then '—'
    when p_mode in ('ivf', 'iui') then 'Stimulation · D' || p_cd
    when p_mode = 'pregnant' then 'Pregnant'
    when p_status = 'Menstrual' then 'Menstrual · CD ' || p_cd
    when p_status in ('High fertility', 'Peak fertility') then 'Fertile · CD ' || p_cd
    when p_status = 'Low fertility' then 'Follicular · CD ' || p_cd
    when p_status like 'Luteal%' or p_status = 'Post-ovulation' then '2WW · ' || greatest(p_cd - coalesce(p_ov, 14), 0) || ' DPO'
    else '—'
  end
$$;

create function analytics_private.user_ref(p_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$ select 'usr_' || substr(md5(p_id::text), 1, 8) $$;

create function public.admin_users_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.assert_console_admin();

  select jsonb_build_object(
    'counts', jsonb_build_object(
      'all', count(*),
      'free', count(*) filter (where plan = 'free'),
      'paid', count(*) filter (where plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored')),
      'trial', count(*) filter (where plan = 'trial'),
      'new', count(*) filter (where created_at >= now() - interval '7 days'),
      'suspended', count(*) filter (where status = 'suspended')
    ),
    'mini', jsonb_build_object(
      'new_week', count(*) filter (where created_at >= now() - interval '7 days'),
      'new_week_prev', count(*) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),
      'active_30d', count(*) filter (where last_active_at >= now() - interval '30 days'),
      'active_pct', analytics_private.pct(count(*) filter (where last_active_at >= now() - interval '30 days'), count(*), 0),
      'churn_risk', count(*) filter (where status = 'active' and last_active_at < now() - interval '21 days' and last_active_at >= now() - interval '60 days'),
      'deletion_requests', count(*) filter (where deletion_requested_at is not null),
      'deletion_due_days', greatest(0, ceil(extract(epoch from (
        min(deletion_requested_at) filter (where deletion_requested_at is not null) + interval '14 days' - now()
      )) / 86400))
    ),
    'cities', (
      select coalesce(jsonb_agg(city order by n desc), '[]'::jsonb)
      from (select city, count(*) as n from public.app_users where city is not null group by city order by count(*) desc limit 40) c
    )
  )
  into v_result
  from public.app_users;

  return v_result;
end;
$$;

create function public.admin_users_list(
  p_tab text default 'all',
  p_search text default null,
  p_plan public.plan_type default null,
  p_mode public.tracking_mode default null,
  p_city text default null,
  p_status text default null,
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
  v_result jsonb;
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  perform public.assert_console_admin();

  with base as (
    select
      u.*,
      analytics_private.user_ref(u.id) as ref,
      case
        when u.status = 'suspended' then 'suspended'
        when u.deletion_requested_at is not null then 'deletion_requested'
        when coalesce(u.last_active_at, u.created_at) < now() - interval '30 days' then 'inactive'
        else 'active'
      end as status_display
    from public.app_users u
    where (p_tab = 'all'
        or (p_tab = 'free' and u.plan = 'free')
        or (p_tab = 'paid' and u.plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored'))
        or (p_tab = 'trial' and u.plan = 'trial')
        or (p_tab = 'new' and u.created_at >= now() - interval '7 days')
        or (p_tab = 'suspended' and u.status = 'suspended'))
      and (p_plan is null or u.plan = p_plan)
      and (p_mode is null or u.tracking_mode = p_mode)
      and (p_city is null or u.city = p_city)
      and (v_search is null
        or u.full_name ilike '%' || v_search || '%'
        or u.email ilike '%' || v_search || '%'
        or analytics_private.user_ref(u.id) ilike '%' || v_search || '%')
  ),
  filtered as (
    select * from base where p_status is null or status_display = p_status
  ),
  page as (
    select * from filtered order by last_active_at desc nulls last, id limit greatest(p_limit, 1) offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'ref', p.ref, 'name', p.full_name, 'email', p.email, 'city', p.city,
        'plan', p.plan, 'mode', p.tracking_mode, 'status', p.status_display,
        'phase', analytics_private.phase_label(p.tracking_mode, e.status, oc.cd, e.predicted_ovulation_day),
        'logs_7d', (select count(*) from public.feature_usage fu join public.feature_catalog fc using (feature)
                    where fu.user_id = p.id and fc.is_signal and fu.used_at >= now() - interval '7 days'),
        'joined', to_char(p.created_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD'),
        'last_active_at', p.last_active_at
      ) order by p.last_active_at desc nulls last, p.id)
      from page p
      left join public.engine_runs e on e.user_id = p.id
      left join lateral (
        select (current_date - start_date + 1) as cd from public.user_cycles c
        where c.user_id = p.id and c.length_days is null limit 1
      ) oc on true
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;
