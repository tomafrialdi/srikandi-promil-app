-- Subscriptions › overview page.

create function public.admin_subscriptions_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_month date := date_trunc('month', now() at time zone 'Asia/Jakarta')::date;
begin
  perform public.assert_console_admin();

  with
  mrr as (
    select
      coalesce(sum(mrr_delta_idr), 0) as now_v,
      coalesce(sum(mrr_delta_idr) filter (where occurred_at < now() - interval '30 days'), 0) as prev_v,
      coalesce(-sum(mrr_delta_idr) filter (where event_type = 'churn' and occurred_at >= now() - interval '30 days'), 0) as churn_30,
      coalesce(-sum(mrr_delta_idr) filter (where event_type = 'churn' and occurred_at >= now() - interval '60 days' and occurred_at < now() - interval '30 days'), 0) as churn_prev,
      coalesce(sum(mrr_delta_idr) filter (where occurred_at < now() - interval '60 days'), 0) as start_prev
    from public.subscription_events
  ),
  subs as (
    select
      count(*) filter (where plan in ('plus_monthly', 'plus_yearly')) as paying,
      count(*) filter (where plan in ('plus_monthly', 'plus_yearly') and paid_at <= now() - interval '30 days'
                         and (churned_at is null or churned_at > now() - interval '30 days')) as paying_prev,
      count(*) filter (where plan = 'plus_monthly') as monthly,
      count(*) filter (where plan = 'plus_yearly') as yearly,
      count(*) filter (where plan = 'clinic_sponsored') as sponsored
    from public.app_users
  ),
  months as (select (v_month - make_interval(months => 11 - g))::date as m from generate_series(0, 11) g),
  tx30 as (
    select * from public.transactions where created_at >= now() - interval '30 days'
  ),
  promos as (
    select c.*, analytics_private.promo_status(c.status, c.starts_at, c.ends_at, c.used_count, c.max_uses) as st
    from public.promo_codes c
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'mrr', mrr.now_v,
      'mrr_delta_pct', analytics_private.pct(mrr.now_v - mrr.prev_v, mrr.prev_v),
      'arr', mrr.now_v * 12,
      'paying', subs.paying,
      'paying_delta', subs.paying - subs.paying_prev,
      'churn_pct', analytics_private.pct(mrr.churn_30, mrr.prev_v),
      'churn_delta', analytics_private.pct(mrr.churn_30, mrr.prev_v) - analytics_private.pct(mrr.churn_prev, mrr.start_prev),
      'arppu', round(mrr.now_v::numeric / nullif(subs.paying, 0)),
      'arppu_prev', round(mrr.prev_v::numeric / nullif(subs.paying_prev, 0))
    ),
    'mrr_chart', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m.m, 'YYYY-MM-DD'),
        'monthly', (select coalesce(sum(mrr_delta_idr), 0) from public.subscription_events e
                    where e.plan = 'plus_monthly' and e.occurred_at < ((m.m + interval '1 month')::timestamp at time zone 'Asia/Jakarta')),
        'yearly', (select coalesce(sum(mrr_delta_idr), 0) from public.subscription_events e
                   where e.plan = 'plus_yearly' and e.occurred_at < ((m.m + interval '1 month')::timestamp at time zone 'Asia/Jakarta'))
      ) order by m.m)
      from months m
    ),
    'payment_mix', jsonb_build_object(
      'total', (select count(*) from tx30),
      'rows', (select coalesce(jsonb_agg(jsonb_build_object('channel', channel, 'pct', analytics_private.pct(n, (select count(*) from tx30), 0)) order by n desc), '[]'::jsonb)
               from (select channel, count(*) as n from tx30 group by channel) c)
    ),
    'plans', jsonb_build_array(
      (select jsonb_build_object('plan', plan, 'label', label, 'badge', badge_label, 'price_idr', price_idr, 'period_months', period_months,
         'savings', savings_label, 'subscribers', subs.monthly) from public.plan_catalog where plan = 'plus_monthly'),
      (select jsonb_build_object('plan', plan, 'label', label, 'badge', badge_label, 'price_idr', price_idr, 'period_months', period_months,
         'savings', savings_label, 'subscribers', subs.yearly) from public.plan_catalog where plan = 'plus_yearly'),
      (select jsonb_build_object('plan', plan, 'label', label, 'badge', badge_label, 'price_idr', price_idr, 'period_months', period_months,
         'savings', null, 'subscribers', subs.sponsored, 'clinics', (select count(*) from public.clinics)) from public.plan_catalog where plan = 'clinic_sponsored')
    ),
    'promos', jsonb_build_object(
      'summary', jsonb_build_object(
        'active', (select count(*) from promos where st in ('active', 'limit_reached')),
        'scheduled', (select count(*) from promos where st = 'scheduled'),
        'expired', (select count(*) from promos where st = 'expired')),
      'rows', (select coalesce(jsonb_agg(jsonb_build_object(
          'code', code, 'offer', analytics_private.promo_offer(discount_type, discount_pct, fixed_amount_idr, duration_kind, duration_months, trial_extend_days), 'sub', coalesce(audience, eligibility),
          'used', used_count, 'max', max_uses, 'status', st,
          'valid', analytics_private.promo_valid_label(starts_at, ends_at)
        ) order by array_position(array['active', 'limit_reached', 'scheduled', 'paused', 'expired', 'draft'], st), code), '[]'::jsonb)
        from (select * from promos order by array_position(array['active', 'limit_reached', 'scheduled', 'paused', 'expired', 'draft'], st), code limit 6) p)
    ),
    'code_usage', jsonb_build_object(
      'discounted_30d', (select coalesce(sum(discount_idr), 0) from public.promo_redemptions where outcome = 'applied' and redeemed_at >= now() - interval '30 days'),
      'rows', (select coalesce(jsonb_agg(jsonb_build_object(
          'name', split_part(u.full_name, ' ', 1) || ' ' || left(coalesce(split_part(u.full_name, ' ', 2), ''), 1) || '.',
          'code', r.code, 'plan', r.plan, 'at', r.redeemed_at, 'discount_idr', r.discount_idr, 'outcome', r.outcome, 'note', r.note
        ) order by r.redeemed_at desc), '[]'::jsonb)
        from (select * from public.promo_redemptions order by redeemed_at desc limit 6) r join public.app_users u on u.id = r.user_id)
    ),
    'recent_transactions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'invoice', t.invoice_no, 'user', u.full_name, 'plan', t.plan, 'channel', t.channel,
        'amount_idr', t.amount_idr, 'status', t.status, 'retry', t.retry_count, 'at', t.created_at
      ) order by t.created_at desc), '[]'::jsonb)
      from (select * from public.transactions order by created_at desc limit 5) t join public.app_users u on u.id = t.user_id
    )
  )
  into v_result
  from mrr, subs;

  return v_result;
end;
$$;
