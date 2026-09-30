-- Dashboard: activation funnel, feature adoption, recent sign-ups, attention items,
-- and the aggregator the console calls once per page load.

create function public.dashboard_funnel(p_days integer default 30)
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
    'cohort_size', count(*),
    'steps', jsonb_build_array(
      jsonb_build_object('key', 'signed_up', 'label', 'Signed up', 'count', count(*)),
      jsonb_build_object('key', 'onboarded', 'label', 'Completed onboarding', 'count', count(onboarded_at)),
      jsonb_build_object('key', 'first_signal', 'label', 'Logged first signal', 'count', count(first_signal_at)),
      jsonb_build_object('key', 'first_cycle', 'label', 'Tracked 1 full cycle', 'count', count(first_cycle_at)),
      jsonb_build_object('key', 'trial', 'label', 'Started trial', 'count', count(trial_started_at)),
      jsonb_build_object('key', 'paid', 'label', 'Became paid', 'count', count(paid_at))
    )
  )
  into v_result
  from public.app_users
  where created_at >= now() - make_interval(days => p_days);

  return v_result;
end;
$$;

create function public.dashboard_feature_adoption()
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

  with mau as (
    select count(*) as n from public.app_users where last_active_at >= now() - interval '30 days'
  )
  select coalesce(jsonb_agg(jsonb_build_object('feature', f.feature, 'pct', f.pct) order by f.pct desc), '[]'::jsonb)
  into v_result
  from (
    select
      fu.feature,
      round(100.0 * count(distinct fu.user_id) / nullif((select n from mau), 0), 0) as pct
    from public.feature_usage fu
    where fu.used_at >= now() - interval '30 days'
    group by fu.feature
  ) f;

  return v_result;
end;
$$;

create function public.dashboard_recent_signups(p_limit integer default 5)
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

  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  into v_result
  from (
    select id, full_name, email, plan, tracking_mode, city, created_at
    from public.app_users
    order by created_at desc
    limit p_limit
  ) r;

  return v_result;
end;
$$;

create function public.dashboard_attention()
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

  select coalesce(jsonb_agg(row_to_json(a) order by a.created_at), '[]'::jsonb)
  into v_result
  from (
    select id, title, detail, icon, severity, created_at
    from public.attention_items
    where is_open
  ) a;

  return v_result;
end;
$$;

create function public.dashboard_overview(p_funnel_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();

  return jsonb_build_object(
    'kpis', public.dashboard_kpis(),
    'user_growth', public.dashboard_user_growth(12),
    'plan_split', public.dashboard_plan_split(),
    'journey', public.dashboard_journey(),
    'outcomes', public.dashboard_outcomes(),
    'locations', public.dashboard_locations(8),
    'age_distribution', public.dashboard_age_distribution(),
    'funnel', public.dashboard_funnel(p_funnel_days),
    'feature_adoption', public.dashboard_feature_adoption(),
    'recent_signups', public.dashboard_recent_signups(5),
    'attention', public.dashboard_attention()
  );
end;
$$;

revoke execute on function public.dashboard_funnel(integer) from public, anon;
revoke execute on function public.dashboard_feature_adoption() from public, anon;
revoke execute on function public.dashboard_recent_signups(integer) from public, anon;
revoke execute on function public.dashboard_attention() from public, anon;
revoke execute on function public.dashboard_overview(integer) from public, anon;
grant execute on function public.dashboard_funnel(integer) to authenticated;
grant execute on function public.dashboard_feature_adoption() to authenticated;
grant execute on function public.dashboard_recent_signups(integer) to authenticated;
grant execute on function public.dashboard_attention() to authenticated;
grant execute on function public.dashboard_overview(integer) to authenticated;
