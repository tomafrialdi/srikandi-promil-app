-- Analytics › Health outcomes. Self-reported outcomes, aggregated only.

create function public.analytics_health(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_to::timestamp)::date;
  v_prev_from date := p_from - (p_to - p_from + 1);
  v_prev_to date := p_from - 1;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with
  conc as (select * from public.app_users where conceived_at is not null),
  conc_n as (select count(*) as n from conc),
  months as (
    select (v_month - make_interval(months => 11 - g))::date as m from generate_series(0, 11) g
  ),
  ages as (
    select *, extract(year from now())::int - birth_year as age from public.app_users where birth_year is not null
  ),
  age_buckets as (
    select label, lo, hi, ord from (values
      ('< 25', 0, 24, 1), ('25–29', 25, 29, 2), ('30–34', 30, 34, 3), ('35–39', 35, 39, 4), ('40+', 40, 200, 5)
    ) as b(label, lo, hi, ord)
  ),
  modes as (
    select key, label, ord from (values
      ('ttc', 'Trying to conceive', 1), ('pcos', 'PCOS', 2), ('iui', 'IUI program', 3),
      ('ivf', 'IVF program', 4), ('after_loss', 'After loss', 5)
    ) as m(key, label, ord)
  ),
  depth as (
    select tracking_depth, percentile_disc(0.5) within group (order by cycles_tracked) as median_cycles
    from conc group by tracking_depth
  ),
  care as (
    select
      count(*) filter (where event_type = 'pregnancy_loss' and occurred_at >= analytics_private.jkt(p_from) and occurred_at < analytics_private.jkt(p_to + 1)) as losses,
      count(*) filter (where event_type = 'counsellor_session' and occurred_at >= analytics_private.jkt(p_from) and occurred_at < analytics_private.jkt(p_to + 1)) as sessions,
      count(*) filter (where event_type = 'counsellor_session' and occurred_at >= analytics_private.jkt(v_prev_from) and occurred_at < analytics_private.jkt(v_prev_to + 1)) as sessions_prev,
      count(*) filter (where event_type = 'wellbeing_trigger' and occurred_at >= analytics_private.jkt(p_from) and occurred_at < analytics_private.jkt(p_to + 1)) as triggers
    from public.care_events
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'conceived_total', (select n from conc_n),
      'conceived_this_month', (select count(*) from conc where conceived_at >= analytics_private.jkt(v_month) and conceived_at < analytics_private.jkt((v_month + interval '1 month')::date)),
      'conceived_prev_month', (select count(*) from conc where conceived_at >= analytics_private.jkt((v_month - interval '1 month')::date) and conceived_at < analytics_private.jkt(v_month)),
      'within_6_cycles_pct', (select analytics_private.pct(count(*) filter (where cycles_tracked <= 6), count(*))
                              from conc where tracking_depth <> 'calendar_only'),
      'median_cycles', (select percentile_disc(0.5) within group (order by cycles_tracked) from conc),
      'mean_cycles', (select round(avg(cycles_tracked), 1) from conc),
      'ovulation_confirmed_pct', (select analytics_private.pct(count(*) filter (where ovulation_confirmed), count(*), 0)
                                  from public.app_users where ovulation_confirmed is not null)
    ),
    'pregnancies_per_month', (
      select jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM-DD'), 'count', (
        select count(*) from conc where conceived_at >= analytics_private.jkt(m)
          and conceived_at < analytics_private.jkt((m + interval '1 month')::date))) order by m)
      from months
    ),
    'time_to_pregnancy', jsonb_build_object(
      'within_6_pct', (select analytics_private.pct(count(*) filter (where cycles_tracked <= 6), count(*), 0) from conc),
      'rows', (
        select jsonb_agg(jsonb_build_object('cycle', c, 'pct', analytics_private.pct(
          (select count(*) from conc where least(cycles_tracked, 12) = c), (select n from conc_n))) order by c)
        from generate_series(1, 12) c
      )
    ),
    'by_mode', (
      select jsonb_agg(jsonb_build_object(
        'mode', m.key, 'label', m.label,
        'users', s.users,
        'conceived_pct', s.conceived_pct,
        'median_cycles', s.median_cycles,
        'ovulation_confirmed_pct', case when m.key in ('iui', 'ivf') then null else s.ovu end,
        'referred_pct', case when m.key in ('iui', 'ivf') then null else s.referred end
      ) order by m.ord)
      from modes m
      cross join lateral (
        select count(*) as users,
          analytics_private.pct(count(*) filter (where conceived_at is not null), count(*), 0) as conceived_pct,
          percentile_disc(0.5) within group (order by cycles_tracked) filter (where conceived_at is not null) as median_cycles,
          analytics_private.pct(count(*) filter (where ovulation_confirmed), count(*) filter (where ovulation_confirmed is not null), 0) as ovu,
          analytics_private.pct(count(*) filter (where referred_at is not null), count(*), 0) as referred
        from public.app_users u
        where u.tracking_mode = m.key::public.tracking_mode and u.cycles_tracked >= 3
      ) s
    ),
    'by_age', (
      select jsonb_agg(jsonb_build_object('label', b.label, 'pct', (
        select analytics_private.pct(count(*) filter (where conceived_at is not null and cycles_tracked <= 6), count(*), 0)
        from ages a where a.age between b.lo and b.hi and a.tracking_depth <> 'calendar_only')) order by b.ord)
      from age_buckets b
    ),
    'signals', jsonb_build_object(
      'rows', (select coalesce(jsonb_agg(jsonb_build_object('depth', tracking_depth, 'median_cycles', median_cycles)
        order by median_cycles), '[]'::jsonb) from depth)
    ),
    'care', jsonb_build_object(
      'pregnancy_losses', care.losses,
      'counsellor_sessions', care.sessions,
      'counsellor_sessions_delta_pct', analytics_private.pct(care.sessions - care.sessions_prev, care.sessions_prev, 0),
      'wellbeing_triggers', care.triggers
    )
  )
  into v_result
  from care;

  return v_result;
end;
$$;
