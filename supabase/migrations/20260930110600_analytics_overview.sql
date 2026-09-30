-- Analytics › Overview.  p_from / p_to are inclusive Jakarta calendar days.

create function public.analytics_overview(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days integer := p_to - p_from + 1;
  v_prev_from date := p_from - (p_to - p_from + 1);
  v_prev_to date := p_from - 1;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with
  spark as (
    select d.d, analytics_private.active_users(d.d, 1) as dau,
           analytics_private.active_users(d.d, 7) as wau,
           analytics_private.active_users(d.d, 30) as mau
    from (select p_to - 11 + g as d from generate_series(0, 11) g) d
  ),
  logs_daily as (
    select (fu.used_at at time zone 'Asia/Jakarta')::date as d, count(*) as n
    from public.feature_usage fu
    join public.feature_catalog fc using (feature)
    where fc.is_signal
      and fu.used_at >= analytics_private.jkt(p_to - 13) and fu.used_at < analytics_private.jkt(p_to + 1)
    group by 1
  ),
  cur_now as (
    select analytics_private.active_users(p_to, 1) as dau,
           analytics_private.active_users(p_to, 7) as wau,
           analytics_private.active_users(p_to, 30) as mau
  ),
  cur_prev as (
    select analytics_private.active_users(v_prev_to, 1) as dau,
           analytics_private.active_users(v_prev_to, 7) as wau,
           analytics_private.active_users(v_prev_to, 30) as mau
  ),
  logs as (
    select
      (select count(*) from public.feature_usage fu join public.feature_catalog fc using (feature)
        where fc.is_signal and fu.used_at >= analytics_private.jkt(p_from) and fu.used_at < analytics_private.jkt(p_to + 1)) as n_cur,
      (select count(*) from (select distinct user_id, (started_at at time zone 'Asia/Jakarta')::date
        from public.app_sessions where started_at >= analytics_private.jkt(p_from) and started_at < analytics_private.jkt(p_to + 1)) x) as ud_cur,
      (select count(*) from public.feature_usage fu join public.feature_catalog fc using (feature)
        where fc.is_signal and fu.used_at >= analytics_private.jkt(v_prev_from) and fu.used_at < analytics_private.jkt(v_prev_to + 1)) as n_prev,
      (select count(*) from (select distinct user_id, (started_at at time zone 'Asia/Jakarta')::date
        from public.app_sessions where started_at >= analytics_private.jkt(v_prev_from) and started_at < analytics_private.jkt(v_prev_to + 1)) x) as ud_prev
  ),
  active_profile as (
    select distinct u.id, u.platform, u.app_version
    from public.app_users u
    join public.app_sessions s on s.user_id = u.id
    where s.started_at >= analytics_private.jkt(p_to - 29) and s.started_at < analytics_private.jkt(p_to + 1)
  ),
  cohort_users as (
    select id, created_at, date_trunc('month', created_at at time zone 'Asia/Jakarta')::date as m
    from public.app_users
    where created_at >= analytics_private.jkt((date_trunc('month', p_to::timestamp) - interval '5 months')::date)
      and created_at < analytics_private.jkt(p_to + 1)
  ),
  cohort_weeks as (
    select cu.m, w,
      count(*) as users,
      count(*) filter (where cu.created_at + make_interval(days => (w + 1) * 7) <= now()) as eligible,
      count(*) filter (
        where cu.created_at + make_interval(days => (w + 1) * 7) <= now()
          and analytics_private.active_in_week(cu.id, cu.created_at, w)
      ) as retained
    from cohort_users cu cross join generate_series(0, 6) w
    group by cu.m, w
  ),
  channel_stats as (
    select c.channel,
      count(*) filter (where i.user_id is not null) as new_users,
      count(*) filter (where u.paid_at is not null) as paid
    from unnest(enum_range(null::public.acquisition_channel)) as c(channel)
    left join public.app_installs i
      on i.channel = c.channel
     and i.installed_at >= analytics_private.jkt(p_from) and i.installed_at < analytics_private.jkt(p_to + 1)
    left join public.app_users u on u.id = i.user_id
    group by c.channel
  ),
  spend as (
    select channel, sum(amount_idr) as amount
    from public.channel_spend
    where spend_date between p_from and p_to
    group by channel
  ),
  depth as (
    select tracking_depth, count(*) as n,
           percentile_disc(0.5) within group (order by cycles_tracked) as median_cycles
    from public.app_users
    where conceived_at is not null
    group by tracking_depth
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'dau', jsonb_build_object(
        'value', cur_now.dau,
        'delta', analytics_private.pct(cur_now.dau - cur_prev.dau, cur_prev.dau),
        'spark', (select jsonb_agg(dau order by d) from spark)),
      'wau', jsonb_build_object(
        'value', cur_now.wau,
        'delta', analytics_private.pct(cur_now.wau - cur_prev.wau, cur_prev.wau),
        'spark', (select jsonb_agg(wau order by d) from spark)),
      'mau', jsonb_build_object(
        'value', cur_now.mau,
        'delta', analytics_private.pct(cur_now.mau - cur_prev.mau, cur_prev.mau),
        'spark', (select jsonb_agg(mau order by d) from spark)),
      'stickiness', jsonb_build_object(
        'value', analytics_private.pct(cur_now.dau, cur_now.mau),
        'delta', analytics_private.pct(cur_now.dau, cur_now.mau) - analytics_private.pct(cur_prev.dau, cur_prev.mau),
        'spark', (select jsonb_agg(analytics_private.pct(dau, mau) order by d) from spark)),
      'logs_per_user_day', jsonb_build_object(
        'value', round(logs.n_cur::numeric / nullif(logs.ud_cur, 0), 1),
        'delta', round(logs.n_cur::numeric / nullif(logs.ud_cur, 0) - logs.n_prev::numeric / nullif(logs.ud_prev, 0), 1),
        'spark', (
          select jsonb_agg(round(coalesce(ld.n, 0)::numeric / nullif(s.dau, 0), 2) order by s.d)
          from spark s left join logs_daily ld on ld.d = s.d))
    ),
    'daily_logs', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', to_char(g.d, 'YYYY-MM-DD'),
        'lh', coalesce(x.lh, 0), 'bbt', coalesce(x.bbt, 0), 'cervical', coalesce(x.cf, 0), 'mood', coalesce(x.mood, 0)
      ) order by g.d), '[]'::jsonb)
      from (select p_to - 13 + g as d from generate_series(0, 13) g) g
      left join (
        select (fu.used_at at time zone 'Asia/Jakarta')::date as d,
          count(*) filter (where feature = 'LH test scan') as lh,
          count(*) filter (where feature = 'Basal temperature') as bbt,
          count(*) filter (where feature = 'Cervical fluid') as cf,
          count(*) filter (where feature = 'Daily check-in') as mood
        from public.feature_usage fu
        where used_at >= analytics_private.jkt(p_to - 13) and used_at < analytics_private.jkt(p_to + 1)
        group by 1
      ) x on x.d = g.d
    ),
    'platform', jsonb_build_object(
      'total', (select count(*) from active_profile),
      'android_pct', (select analytics_private.pct(count(*) filter (where platform = 'android'), count(*)) from active_profile),
      'ios_pct', (select analytics_private.pct(count(*) filter (where platform = 'ios'), count(*)) from active_profile),
      'versions', jsonb_build_array(
        jsonb_build_object('key', 'latest', 'label', '2.4.1 (latest)',
          'pct', (select analytics_private.pct(count(*) filter (where app_version = '2.4.1'), count(*)) from active_profile)),
        jsonb_build_object('key', 'previous', 'label', '2.3.x',
          'pct', (select analytics_private.pct(count(*) filter (where app_version = '2.3.x'), count(*)) from active_profile)),
        jsonb_build_object('key', 'legacy', 'label', '≤ 2.2 (no LH scanner)',
          'pct', (select analytics_private.pct(count(*) filter (where app_version = '2.2.0'), count(*)) from active_profile)))
    ),
    'retention_cohorts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'cohort', to_char(m, 'YYYY-MM-DD'),
        'users', users,
        'weeks', weeks
      ) order by m), '[]'::jsonb)
      from (
        select m, max(users) filter (where w = 0) as users,
          jsonb_agg(case when eligible >= 0.6 * users and eligible > 0
            then analytics_private.pct(retained, eligible, 0) end order by w) as weeks
        from cohort_weeks
        group by m
      ) c
    ),
    'channels', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'channel', cs.channel, 'new_users', cs.new_users,
        'cac_idr', case when coalesce(sp.amount, 0) = 0 then 0 else round(sp.amount::numeric / nullif(cs.paid, 0)) end
      ) order by cs.new_users desc), '[]'::jsonb)
      from channel_stats cs left join spend sp on sp.channel = cs.channel
    ),
    'signals_vs_outcome', jsonb_build_object(
      'sample_size', (select coalesce(sum(n), 0) from depth),
      'rows', (
        select coalesce(jsonb_agg(jsonb_build_object('depth', tracking_depth, 'median_cycles', median_cycles)
          order by median_cycles), '[]'::jsonb) from depth)
    )
  )
  into v_result
  from cur_now, cur_prev, logs;

  return v_result;
end;
$$;
