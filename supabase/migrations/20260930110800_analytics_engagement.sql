-- Analytics › Engagement.

create function public.analytics_engagement(p_from date, p_to date)
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
  s_cur as (
    select count(*) as sessions, avg(duration_seconds) as avg_secs,
           count(distinct (user_id, (started_at at time zone 'Asia/Jakarta')::date)) as user_days
    from public.app_sessions
    where started_at >= analytics_private.jkt(p_from) and started_at < analytics_private.jkt(p_to + 1)
  ),
  s_prev as (
    select count(*) as sessions, avg(duration_seconds) as avg_secs,
           count(distinct (user_id, (started_at at time zone 'Asia/Jakarta')::date)) as user_days
    from public.app_sessions
    where started_at >= analytics_private.jkt(v_prev_from) and started_at < analytics_private.jkt(v_prev_to + 1)
  ),
  sig as (
    select
      count(*) filter (where used_at >= analytics_private.jkt(p_from) and used_at < analytics_private.jkt(p_to + 1)) as cur,
      count(*) filter (where used_at >= analytics_private.jkt(v_prev_from) and used_at < analytics_private.jkt(v_prev_to + 1)) as prev
    from public.feature_usage fu join public.feature_catalog fc using (feature)
    where fc.is_signal
  ),
  push as (
    select
      count(*) filter (where sent_at >= analytics_private.jkt(p_from) and sent_at < analytics_private.jkt(p_to + 1)) as sent_cur,
      count(opened_at) filter (where sent_at >= analytics_private.jkt(p_from) and sent_at < analytics_private.jkt(p_to + 1)) as open_cur,
      count(*) filter (where sent_at >= analytics_private.jkt(v_prev_from) and sent_at < analytics_private.jkt(v_prev_to + 1)) as sent_prev,
      count(opened_at) filter (where sent_at >= analytics_private.jkt(v_prev_from) and sent_at < analytics_private.jkt(v_prev_to + 1)) as open_prev
    from public.push_deliveries
  ),
  mau_users as (
    select distinct s.user_id, u.current_streak_days
    from public.app_sessions s join public.app_users u on u.id = s.user_id
    where s.started_at >= analytics_private.jkt(p_to - 29) and s.started_at < analytics_private.jkt(p_to + 1)
  ),
  heat as (
    select extract(isodow from st)::int as dow, extract(hour from st)::int as hr, count(*) as n
    from (
      select started_at at time zone 'Asia/Jakarta' as st
      from public.app_sessions
      where started_at >= analytics_private.jkt(p_from) and started_at < analytics_private.jkt(p_to + 1)
    ) t
    where extract(hour from st)::int in (5, 6, 7, 8, 9, 12, 15, 18, 20, 21, 22, 23)
    group by 1, 2
  ),
  f_cur as (
    select feature, count(distinct user_id) as users, count(*) as events
    from public.feature_usage
    where used_at >= analytics_private.jkt(p_to - 29) and used_at < analytics_private.jkt(p_to + 1)
    group by feature
  ),
  f_prev as (
    select feature, count(distinct user_id) as users
    from public.feature_usage
    where used_at >= analytics_private.jkt(p_to - 59) and used_at < analytics_private.jkt(p_to - 29)
    group by feature
  ),
  mau as (select count(*) as n from mau_users),
  buckets as (
    select label, lo, hi, ord from (values
      ('0', 0, 0, 1), ('1–2', 1, 2, 2), ('3–6', 3, 6, 3), ('7–13', 7, 13, 4), ('14–29', 14, 29, 5),
      ('30–59', 30, 59, 6), ('60–89', 60, 89, 7), ('90–179', 90, 179, 8), ('180+', 180, 100000, 9)
    ) as b(label, lo, hi, ord)
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'sessions_per_user_day', jsonb_build_object(
        'value', round(s_cur.sessions::numeric / nullif(s_cur.user_days, 0), 1),
        'delta', round(s_cur.sessions::numeric / nullif(s_cur.user_days, 0) - s_prev.sessions::numeric / nullif(s_prev.user_days, 0), 1)),
      'avg_session_seconds', jsonb_build_object(
        'value', round(s_cur.avg_secs), 'delta', round(s_cur.avg_secs - s_prev.avg_secs)),
      'signals_per_day', jsonb_build_object(
        'value', round(sig.cur::numeric / v_days),
        'delta', analytics_private.pct(sig.cur - sig.prev, sig.prev, 0)),
      'streak_7_pct', jsonb_build_object(
        'value', (select analytics_private.pct(count(*) filter (where current_streak_days >= 7), count(*), 0) from mau_users),
        'delta', null),
      'push_open_rate', jsonb_build_object(
        'value', analytics_private.pct(push.open_cur, push.sent_cur),
        'delta', analytics_private.pct(push.open_cur, push.sent_cur) - analytics_private.pct(push.open_prev, push.sent_prev))
    ),
    'dau_trend', (
      select jsonb_agg(jsonb_build_object('date', to_char(d, 'YYYY-MM-DD'), 'dau', analytics_private.active_users(d, 1)) order by d)
      from (select p_to - 29 + g as d from generate_series(0, 29) g) x
    ),
    'heatmap', (select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', hr, 'count', n)), '[]'::jsonb) from heat),
    'features', (
      select jsonb_agg(jsonb_build_object(
        'feature', fc.feature, 'plus_only', fc.plus_only,
        'users', coalesce(fcu.users, 0),
        'pct_of_mau', analytics_private.pct(coalesce(fcu.users, 0), mau.n, 0),
        'uses_per_user_week', round(fcu.events::numeric / nullif(fcu.users, 0) / (30 / 7.0), 1),
        'trend_pct', analytics_private.pct(coalesce(fcu.users, 0) - coalesce(fp.users, 0), fp.users, 0)
      ) order by fc.sort_order)
      from public.feature_catalog fc
      cross join mau
      left join f_cur fcu on fcu.feature = fc.feature
      left join f_prev fp on fp.feature = fc.feature
    ),
    'streaks', (
      select jsonb_agg(jsonb_build_object('label', b.label, 'count', (
        select count(*) from mau_users m where m.current_streak_days between b.lo and b.hi)) order by b.ord)
      from buckets b
    ),
    'top_content', (
      select coalesce(jsonb_agg(jsonb_build_object('title', title, 'reads', reads, 'avg_seconds', avg_secs) order by reads desc), '[]'::jsonb)
      from (
        select a.title, count(*) as reads, round(avg(r.read_seconds)) as avg_secs
        from public.article_reads r join public.articles a on a.id = r.article_id
        where r.read_at >= analytics_private.jkt(p_from) and r.read_at < analytics_private.jkt(p_to + 1)
        group by a.title order by count(*) desc limit 5
      ) t
    )
  )
  into v_result
  from s_cur, s_prev, sig, push;

  return v_result;
end;
$$;
