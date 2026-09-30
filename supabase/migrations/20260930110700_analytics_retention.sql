-- Analytics › Retention.

-- Any session in [from_day, from_day + p_days) days after sign-up.
create function analytics_private.active_in_days(p_user uuid, p_created timestamptz, p_from_day integer, p_days integer)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.app_sessions s
    where s.user_id = p_user
      and s.started_at >= p_created + make_interval(days => p_from_day)
      and s.started_at < p_created + make_interval(days => p_from_day + p_days)
  )
$$;

-- Share (%) of users active in the 30 days before p_day-29 who were not active in the 30 days to p_day.
create function analytics_private.monthly_churn(p_day date)
returns numeric
language sql
stable
set search_path = ''
as $$
  with prior as (
    select distinct user_id from public.app_sessions
    where started_at >= analytics_private.jkt(p_day - 59) and started_at < analytics_private.jkt(p_day - 29)
  ),
  curr as (
    select distinct user_id from public.app_sessions
    where started_at >= analytics_private.jkt(p_day - 29) and started_at < analytics_private.jkt(p_day + 1)
  )
  select analytics_private.pct(
    (select count(*) from prior where user_id not in (select user_id from curr)),
    (select count(*) from prior)
  )
$$;

-- Users who came back after 30+ days away in the 30 days ending p_day.
create function analytics_private.resurrected(p_day date)
returns table (user_id uuid, return_source text)
language sql
stable
set search_path = ''
as $$
  select distinct on (s.user_id) s.user_id, s.source
  from public.app_sessions s
  where s.started_at >= analytics_private.jkt(p_day - 29) and s.started_at < analytics_private.jkt(p_day + 1)
    and not exists (
      select 1 from public.app_sessions g
      where g.user_id = s.user_id
        and g.started_at >= analytics_private.jkt(p_day - 59) and g.started_at < analytics_private.jkt(p_day - 29))
    and exists (
      select 1 from public.app_sessions e
      where e.user_id = s.user_id and e.started_at < analytics_private.jkt(p_day - 59))
  order by s.user_id, s.started_at
$$;

create function public.analytics_retention(p_from date, p_to date)
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
  v_lookback date := p_from - 91;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with
  cur as (
    select id, created_at from public.app_users
    where created_at >= analytics_private.jkt(p_from) and created_at < analytics_private.jkt(p_to + 1)
  ),
  prev as (
    select id, created_at from public.app_users
    where created_at >= analytics_private.jkt(v_prev_from) and created_at < analytics_private.jkt(v_prev_to + 1)
  ),
  -- Day-N retention = any session in a short window around day N (day 1: days 1-2, day 7: 6-8, day 30: 29-31).
  ret as (
    select
      analytics_private.pct(count(*) filter (where created_at + interval '3 days' <= now() and analytics_private.active_in_days(id, created_at, 1, 2)),
                            count(*) filter (where created_at + interval '3 days' <= now())) as d1_cur,
      analytics_private.pct(count(*) filter (where created_at + interval '9 days' <= now() and analytics_private.active_in_days(id, created_at, 6, 3)),
                            count(*) filter (where created_at + interval '9 days' <= now())) as d7_cur,
      analytics_private.pct(count(*) filter (where created_at + interval '32 days' <= now() and analytics_private.active_in_days(id, created_at, 29, 3)),
                            count(*) filter (where created_at + interval '32 days' <= now())) as d30_cur
    from cur
  ),
  ret_prev as (
    select
      analytics_private.pct(count(*) filter (where created_at + interval '3 days' <= now() and analytics_private.active_in_days(id, created_at, 1, 2)),
                            count(*) filter (where created_at + interval '3 days' <= now())) as d1,
      analytics_private.pct(count(*) filter (where created_at + interval '9 days' <= now() and analytics_private.active_in_days(id, created_at, 6, 3)),
                            count(*) filter (where created_at + interval '9 days' <= now())) as d7,
      analytics_private.pct(count(*) filter (where created_at + interval '32 days' <= now() and analytics_private.active_in_days(id, created_at, 29, 3)),
                            count(*) filter (where created_at + interval '32 days' <= now())) as d30
    from prev
  ),
  -- Week-12 needs 13 elapsed weeks: current = sign-ups from 13 weeks before the range;
  -- previous = the quarter before that (limited to the period sessions are recorded for).
  w12 as (
    select
      (select analytics_private.pct(
          count(*) filter (where analytics_private.active_in_week(id, created_at, 12)), count(*), 0)
       from public.app_users
       where created_at >= analytics_private.jkt(v_lookback) and created_at < analytics_private.jkt(p_to + 1)
         and created_at + interval '91 days' <= now()) as cur,
      (select analytics_private.pct(
          count(*) filter (where analytics_private.active_in_week(id, created_at, 12)), count(*), 0)
       from public.app_users
       where created_at >= greatest(analytics_private.jkt(v_lookback - 91), now() - interval '210 days')
         and created_at < analytics_private.jkt(v_lookback)
         and created_at + interval '91 days' <= now()) as prev
  ),
  -- Users signed up in the window plus 13 weeks before it, so week-12 is observable.
  curve_users as (
    select id, created_at,
      case when partner_linked then 'partner_linked'
           when tracking_depth = 'calendar_only' then 'calendar_only'
           else 'solo' end as seg
    from public.app_users
    where created_at >= analytics_private.jkt(v_lookback) and created_at < analytics_private.jkt(p_to + 1)
  ),
  curve as (
    select cu.seg, w,
      analytics_private.pct(
        count(*) filter (where cu.created_at + make_interval(days => (w + 1) * 7) <= now() and analytics_private.active_in_week(cu.id, cu.created_at, w)),
        count(*) filter (where cu.created_at + make_interval(days => (w + 1) * 7) <= now()), 0) as pct
    from curve_users cu cross join unnest(array[0, 1, 2, 4, 6, 8, 10, 12]) w
    group by cu.seg, w
  ),
  reasons as (
    select exit_reason, count(*) as n
    from public.app_users
    where exit_reason is not null and left_at >= analytics_private.jkt(p_to - 364)
    group by exit_reason
  ),
  wk_users as (
    select id, created_at, date_trunc('week', created_at at time zone 'Asia/Jakarta')::date as wk
    from public.app_users
    where created_at >= analytics_private.jkt((date_trunc('week', p_to::timestamp)::date) - 70)
      and created_at < analytics_private.jkt(p_to + 1)
  ),
  wk_weeks as (
    select wu.wk, w,
      count(*) as users,
      count(*) filter (where wu.created_at + make_interval(days => (w + 1) * 7) <= now()) as eligible,
      count(*) filter (where wu.created_at + make_interval(days => (w + 1) * 7) <= now()
                         and analytics_private.active_in_week(wu.id, wu.created_at, w)) as retained
    from wk_users wu cross join generate_series(0, 10) w
    group by wu.wk, w
  ),
  memb as (
    select 'plus' as k, id from public.app_users where plan in ('plus_monthly', 'plus_yearly')
    union all select 'free', id from public.app_users where plan in ('free', 'trial')
    union all select 'pcos', id from public.app_users where tracking_mode = 'pcos'
    union all select 'iui_ivf', id from public.app_users where tracking_mode in ('iui', 'ivf')
    union all select 'after_loss', id from public.app_users where tracking_mode = 'after_loss'
    union all select 'age_35_plus', id from public.app_users
      where birth_year is not null and extract(year from now())::int - birth_year >= 35
  ),
  prior_u as (
    select distinct user_id from public.app_sessions
    where started_at >= analytics_private.jkt(p_to - 59) and started_at < analytics_private.jkt(p_to - 29)
  ),
  curr_u as (
    select distinct user_id from public.app_sessions
    where started_at >= analytics_private.jkt(p_to - 29) and started_at < analytics_private.jkt(p_to + 1)
  ),
  seg_stats as (
    select m.k,
      count(*) as users,
      analytics_private.pct(count(*) filter (where pu.user_id is not null and cu.user_id is null),
                            count(*) filter (where pu.user_id is not null)) as churn,
      analytics_private.pct(
        count(*) filter (where u.created_at >= now() - interval '200 days' and u.created_at + interval '35 days' <= now() and analytics_private.active_in_week(u.id, u.created_at, 4)),
        count(*) filter (where u.created_at >= now() - interval '200 days' and u.created_at + interval '35 days' <= now()), 0) as w4,
      analytics_private.pct(
        count(*) filter (where u.created_at >= now() - interval '200 days' and u.created_at + interval '91 days' <= now() and analytics_private.active_in_week(u.id, u.created_at, 12)),
        count(*) filter (where u.created_at >= now() - interval '200 days' and u.created_at + interval '91 days' <= now()), 0) as w12
    from memb m
    join public.app_users u on u.id = m.id
    left join prior_u pu on pu.user_id = m.id
    left join curr_u cu on cu.user_id = m.id
    group by m.k
  ),
  back_cur as (select * from analytics_private.resurrected(p_to)),
  back_prev as (select count(*) as n from analytics_private.resurrected(p_to - 30)),
  push_win as (
    select count(*) as sent, count(opened_at) as opened
    from public.push_deliveries
    where kind = 'winback' and sent_at >= analytics_private.jkt(p_from) and sent_at < analytics_private.jkt(p_to + 1)
  ),
  best_title as (
    select title from public.push_deliveries
    where kind = 'winback' and opened_at is not null
      and sent_at >= analytics_private.jkt(p_from) and sent_at < analytics_private.jkt(p_to + 1)
    group by title order by count(*) desc limit 1
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'day1', jsonb_build_object('value', ret.d1_cur, 'delta', ret.d1_cur - rp.d1),
      'day7', jsonb_build_object('value', ret.d7_cur, 'delta', ret.d7_cur - rp.d7),
      'day30', jsonb_build_object('value', ret.d30_cur, 'delta', ret.d30_cur - rp.d30),
      'week12', jsonb_build_object('value', w12.cur, 'previous', w12.prev),
      'monthly_churn', jsonb_build_object(
        'value', analytics_private.monthly_churn(p_to),
        'delta', analytics_private.monthly_churn(p_to) - analytics_private.monthly_churn(p_to - 30))
    ),
    'curve', (
      select coalesce(jsonb_agg(jsonb_build_object('segment', seg, 'points', pts)), '[]'::jsonb)
      from (
        select seg, jsonb_agg(jsonb_build_object('week', w, 'pct', pct) order by w) as pts
        from curve group by seg
      ) s
    ),
    'exit_reasons', jsonb_build_object(
      'total', (select coalesce(sum(n), 0) from reasons),
      'rows', (select coalesce(jsonb_agg(jsonb_build_object('reason', exit_reason, 'count', n) order by n desc), '[]'::jsonb) from reasons)
    ),
    'weekly_cohorts', (
      select coalesce(jsonb_agg(jsonb_build_object('week_start', to_char(wk, 'YYYY-MM-DD'), 'users', users, 'weeks', weeks) order by wk), '[]'::jsonb)
      from (
        select wk, max(users) filter (where w = 0) as users,
          jsonb_agg(case when eligible >= 0.6 * users and eligible > 0
            then analytics_private.pct(retained, eligible, 0) end order by w) as weeks
        from wk_weeks group by wk
      ) c
    ),
    'segments', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', k, 'users', users, 'w4', w4, 'w12', w12,
        'churn', case when k = 'after_loss' then null else churn end) order by array_position(
          array['plus', 'free', 'pcos', 'iui_ivf', 'after_loss', 'age_35_plus'], k)), '[]'::jsonb)
      from seg_stats
    ),
    'win_back', jsonb_build_object(
      'resurrected', (select count(*) from back_cur),
      'resurrected_prev', (select n from back_prev),
      'top_source', (select jsonb_build_object('source', return_source, 'share_pct',
          analytics_private.pct(count(*), (select count(*) from back_cur)))
        from back_cur where return_source <> 'organic' group by return_source order by count(*) desc limit 1),
      'winback_ctr_pct', (select analytics_private.pct(opened, sent) from push_win),
      'best_campaign', (select title from best_title)
    )
  )
  into v_result
  from ret, ret_prev rp, w12;

  return v_result;
end;
$$;
