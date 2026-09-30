-- Analytics › Revenue. MRR is the running sum of subscription_events.

create function public.analytics_revenue(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prev_from date := p_from - (p_to - p_from + 1);
  v_prev_to date := p_from - 1;
  v_month date := date_trunc('month', p_to::timestamp)::date;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with
  mrr as (
    select
      coalesce(sum(mrr_delta_idr) filter (where occurred_at < analytics_private.jkt(p_to + 1)), 0) as now_v,
      coalesce(sum(mrr_delta_idr) filter (where occurred_at < analytics_private.jkt(p_from)), 0) as start_v,
      coalesce(sum(mrr_delta_idr) filter (where occurred_at < analytics_private.jkt(p_to - 29)), 0) as m30_start
    from public.subscription_events
  ),
  mv as (
    select
      coalesce(sum(mrr_delta_idr) filter (where event_type = 'new'), 0) as new_v,
      coalesce(sum(mrr_delta_idr) filter (where event_type = 'upgrade'), 0) as up_v,
      coalesce(sum(mrr_delta_idr) filter (where event_type = 'reactivation'), 0) as react_v,
      coalesce(sum(mrr_delta_idr) filter (where event_type = 'downgrade'), 0) as down_v,
      coalesce(sum(mrr_delta_idr) filter (where event_type = 'churn'), 0) as churn_v
    from public.subscription_events
    where occurred_at >= analytics_private.jkt(p_from) and occurred_at < analytics_private.jkt(p_to + 1)
  ),
  churn30 as (
    select coalesce(-sum(mrr_delta_idr), 0) as v
    from public.subscription_events
    where event_type = 'churn'
      and occurred_at >= analytics_private.jkt(p_to - 29) and occurred_at < analytics_private.jkt(p_to + 1)
  ),
  paid_now as (select count(*) as n from public.app_users where plan in ('plus_monthly', 'plus_yearly')),
  users_n as (select count(*) as n from public.app_users where created_at < analytics_private.jkt(p_to + 1)),
  users_prev_n as (select count(*) as n from public.app_users where created_at < analytics_private.jkt(p_from)),
  trial as (
    select
      count(*) filter (where trial_started_at >= analytics_private.jkt(p_from) and trial_started_at < analytics_private.jkt(p_to + 1)) as started,
      count(*) filter (where paid_at is not null and trial_started_at >= analytics_private.jkt(p_from) and trial_started_at < analytics_private.jkt(p_to + 1)) as converted,
      count(*) filter (where trial_started_at >= analytics_private.jkt(v_prev_from) and trial_started_at < analytics_private.jkt(v_prev_to + 1)) as started_prev,
      count(*) filter (where paid_at is not null and trial_started_at >= analytics_private.jkt(v_prev_from) and trial_started_at < analytics_private.jkt(v_prev_to + 1)) as converted_prev
    from public.app_users
  ),
  trial_users as (
    select id, trial_started_at, paid_at, paywall_seen_at,
      analytics_private.active_in_days(id, trial_started_at, 4, 2) as active_d5,
      (select count(*) from public.feature_usage fu join public.feature_catalog fc using (feature)
        where fu.user_id = u.id and fc.is_signal
          and fu.used_at >= u.trial_started_at and fu.used_at < u.trial_started_at + interval '3 days') >= 3 as strong_start
    from public.app_users u
    where trial_started_at >= analytics_private.jkt(p_from) and trial_started_at < analytics_private.jkt(p_to + 1)
  ),
  other as (
    select
      coalesce(sum(amount_idr) filter (where source = 'b2b_clinic'), 0) as b2b,
      coalesce(sum(amount_idr) filter (where source = 'teleconsult'), 0) as tele,
      coalesce(sum(amount_idr) filter (where source = 'refund'), 0) as refund
    from public.other_revenue
    where occurred_on >= v_month and occurred_on < (v_month + interval '1 month')::date
  ),
  months as (select (v_month - make_interval(months => 11 - g))::date as m from generate_series(0, 11) g),
  reasons as (
    select cancel_reason, count(*) as n
    from public.subscription_events
    where event_type = 'churn'
      and occurred_at >= analytics_private.jkt(p_from) and occurred_at < analytics_private.jkt(p_to + 1)
    group by cancel_reason
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'mrr', jsonb_build_object('value', mrr.now_v, 'delta_pct', analytics_private.pct(mrr.now_v - mrr.start_v, mrr.start_v)),
      'nrr', jsonb_build_object(
        'value', analytics_private.pct(mrr.start_v + mv.up_v + mv.react_v + mv.down_v + mv.churn_v, mrr.start_v, 0),
        'expansion_beats_churn', (mv.up_v + mv.react_v) > -(mv.churn_v + mv.down_v)),
      'arpu', jsonb_build_object(
        'value', round(mrr.now_v::numeric / nullif(users_n.n, 0)),
        'delta', round(mrr.now_v::numeric / nullif(users_n.n, 0) - mrr.start_v::numeric / nullif(users_prev_n.n, 0))),
      'ltv', jsonb_build_object(
        'value', round((mrr.now_v::numeric / nullif(paid_now.n, 0)) / nullif(churn30.v::numeric / nullif(mrr.m30_start, 0), 0)),
        'lifetime_months', round(1 / nullif(churn30.v::numeric / nullif(mrr.m30_start, 0), 0), 1)),
      'trial_to_paid', jsonb_build_object(
        'value', analytics_private.pct(trial.converted, trial.started),
        'delta', analytics_private.pct(trial.converted, trial.started) - analytics_private.pct(trial.converted_prev, trial.started_prev))
    ),
    'mrr_movement', jsonb_build_object(
      'start', mrr.start_v, 'new', mv.new_v, 'upgrades', mv.up_v, 'reactivations', mv.react_v,
      'downgrades', mv.down_v, 'churn', mv.churn_v, 'end', mrr.now_v),
    'revenue_by_plan', jsonb_build_object(
      'month', to_char(v_month, 'YYYY-MM-DD'),
      'rows', jsonb_build_array(
        jsonb_build_object('key', 'plus_yearly', 'label', 'Plus Yearly', 'amount', (
          select count(*) * (select monthly_idr from public.plan_prices where plan = 'plus_yearly')
          from public.app_users where plan = 'plus_yearly')),
        jsonb_build_object('key', 'plus_monthly', 'label', 'Plus Monthly', 'amount', (
          select count(*) * (select monthly_idr from public.plan_prices where plan = 'plus_monthly')
          from public.app_users where plan = 'plus_monthly')),
        jsonb_build_object('key', 'b2b_clinic', 'label', 'Clinic-sponsored (B2B)', 'amount', other.b2b),
        jsonb_build_object('key', 'teleconsult', 'label', 'Teleconsult fees (10%)', 'amount', other.tele),
        jsonb_build_object('key', 'refund', 'label', 'Refunds', 'amount', other.refund))
    ),
    'revenue_trend', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m.m, 'YYYY-MM-DD'),
        'subscriptions', (select coalesce(sum(mrr_delta_idr), 0) from public.subscription_events
                          where occurred_at < analytics_private.jkt((m.m + interval '1 month')::date)),
        'b2b_clinic', (select coalesce(sum(amount_idr), 0) from public.other_revenue
                       where source = 'b2b_clinic' and occurred_on >= m.m and occurred_on < (m.m + interval '1 month')::date),
        'teleconsult', (select coalesce(sum(amount_idr), 0) from public.other_revenue
                        where source = 'teleconsult' and occurred_on >= m.m and occurred_on < (m.m + interval '1 month')::date)
      ) order by m.m)
      from months m
    ),
    'ltv_by_channel', (
      select coalesce(jsonb_agg(jsonb_build_object('channel', channel, 'ltv', ltv) order by ltv desc), '[]'::jsonb)
      from (
        select channel, round(avg(ltv_12m)) as ltv from analytics_private.paid_users
        where channel is not null group by channel
      ) t
    ),
    'trial_funnel', jsonb_build_object(
      'started', (select count(*) from trial_users),
      'active_day5', (select count(*) from trial_users where active_d5),
      'saw_paywall', (select count(*) from trial_users where paywall_seen_at is not null),
      'converted', (select count(*) from trial_users where paid_at is not null),
      'strong_start_convert_pct', (select analytics_private.pct(count(*) filter (where paid_at is not null), count(*), 0) from trial_users where strong_start),
      'weak_start_convert_pct', (select analytics_private.pct(count(*) filter (where paid_at is not null), count(*), 0) from trial_users where not strong_start)
    ),
    'churn_reasons', jsonb_build_object(
      'total', (select coalesce(sum(n), 0) from reasons),
      'rows', (select coalesce(jsonb_agg(jsonb_build_object('reason', cancel_reason, 'count', n) order by n desc), '[]'::jsonb) from reasons)
    )
  )
  into v_result
  from mrr, mv, churn30, paid_now, users_n, users_prev_n, trial, other;

  return v_result;
end;
$$;
