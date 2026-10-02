-- Insights (mobile): cycle statistics, length trend and most logged symptoms, from what the user
-- really recorded. Nothing is invented: with no finished cycle the cycle numbers are null.
--   avgCycleDays     average length of finished cycles that started in the window
--   avgPeriodDays    average length of periods logged over several days (first to last bleeding day); the user's own setting otherwise
--   regularityPercent share of finished cycles within 2 days of that average (needs 2+ cycles)
--   symptoms         share of the days with a symptom log on which each symptom appeared

create function public.app_insights(p_months integer, p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_months integer := least(greatest(coalesce(p_months, 6), 1), 24);
  v_from date := (date_trunc('month', p_today) - make_interval(months => v_months - 1))::date;
  u public.app_users;
  v_n integer;
  v_avg numeric;
  v_regular integer;
  v_period numeric;
begin
  select * into u from public.app_users where id = v_user;

  select count(*), avg(length_days) into v_n, v_avg
  from public.user_cycles
  where user_id = v_user and length_days between 15 and 90 and start_date >= v_from;

  select round(100.0 * count(*) filter (where abs(length_days - v_avg) <= 2) / nullif(count(*), 0))::int
    into v_regular
  from public.user_cycles
  where user_id = v_user and length_days between 15 and 90 and start_date >= v_from;

  -- Period length = first to last day with a flow log within the first 10 days of each cycle. People often log
  -- only day 1, so single-day entries are ignored (they would drag the average to 1); with no multi-day period
  -- logged at all, the user's own setting (Cycle preferences) is used.
  select avg(span) into v_period from (
    select max(l.logged_on) - min(l.logged_on) + 1 as span
    from public.user_cycles c
    join public.user_daily_logs l
      on l.user_id = c.user_id and l.kind = 'flow' and l.value <> 'none'
     and l.logged_on >= c.start_date and l.logged_on < c.start_date + 10
    where c.user_id = v_user and c.start_date >= v_from
    group by c.id
  ) per_cycle
  where span >= 2;

  return jsonb_build_object(
    'periodMonths', v_months,
    'cyclesCounted', v_n,
    'stats', jsonb_build_object(
      'avgCycleDays', case when v_n > 0 then round(v_avg)::int end,
      'avgPeriodDays', coalesce(round(v_period)::int, u.period_length_days),
      'regularityPercent', case when v_n >= 2 then v_regular end
    ),
    -- One bar per finished cycle, labelled by the month it started (the later cycle wins a shared month).
    'cycleTrend', coalesce((
      select jsonb_agg(jsonb_build_object('month', m, 'days', d) order by m)
      from (
        select distinct on (to_char(start_date, 'YYYY-MM')) to_char(start_date, 'YYYY-MM') as m, length_days as d
        from public.user_cycles
        where user_id = v_user and length_days between 15 and 90 and start_date >= v_from
        order by to_char(start_date, 'YYYY-MM'), start_date desc
      ) t
    ), '[]'::jsonb),
    'symptoms', coalesce((
      with logged as (
        select logged_on, payload -> 'symptoms' as s
        from public.user_daily_logs
        where user_id = v_user and kind = 'symptom' and logged_on >= v_from and logged_on <= p_today
      ), total as (select count(*) as n from logged),
      per as (
        select sym, count(*) as n from logged, jsonb_array_elements_text(s) as sym group by sym
      )
      select jsonb_agg(jsonb_build_object(
          'id', sym,
          'label', upper(left(sym, 1)) || substr(replace(sym, '_', ' '), 2),
          'percent', round(100.0 * per.n / total.n)::int
        ) order by per.n desc, sym)
      from (select * from per order by n desc, sym limit 5) per, total
      where total.n > 0
    ), '[]'::jsonb),
    'symptomDays', (select count(*) from public.user_daily_logs
                    where user_id = v_user and kind = 'symptom' and logged_on >= v_from and logged_on <= p_today)
  );
end;
$$;

revoke execute on function public.app_insights(integer, date) from public, anon;
grant execute on function public.app_insights(integer, date) to authenticated;
