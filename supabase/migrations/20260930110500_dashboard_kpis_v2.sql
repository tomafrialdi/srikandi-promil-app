-- Dashboard KPIs now share their sources with Analytics:
--   * MRR comes from subscription_events
--   * daily / monthly active come from real sessions (Jakarta calendar days)

create or replace function public.dashboard_kpis()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  perform public.assert_console_admin();

  with cur as (
    select
      count(*) as total,
      count(*) filter (where plan = 'free') as free,
      count(*) filter (where plan in ('plus_monthly', 'plus_yearly')) as paid,
      count(*) filter (where plan = 'trial') as trial
    from public.app_users
  ),
  prev as (
    select
      count(*) as total,
      count(*) filter (
        where plan in ('plus_monthly', 'plus_yearly') and paid_at <= now() - interval '30 days'
      ) as paid
    from public.app_users
    where created_at <= now() - interval '30 days'
  ),
  mrr as (
    select
      coalesce(sum(mrr_delta_idr), 0) as cur,
      coalesce(sum(mrr_delta_idr) filter (where occurred_at <= now() - interval '30 days'), 0) as prev
    from public.subscription_events
  )
  select jsonb_build_object(
    'total_users', cur.total,
    'free_users', cur.free,
    'paid_users', cur.paid,
    'trial_users', cur.trial,
    'daily_active', analytics_private.active_users(v_today, 1),
    'monthly_active', analytics_private.active_users(v_today, 30),
    'mrr_idr', mrr.cur,
    'total_delta_pct', round(100.0 * (cur.total - prev.total) / nullif(prev.total, 0), 1),
    'paid_delta_pct', round(100.0 * (cur.paid - prev.paid) / nullif(prev.paid, 0), 1),
    'mrr_delta_pct', round(100.0 * (mrr.cur - mrr.prev) / nullif(mrr.prev, 0), 1)
  )
  into v_result
  from cur, prev, mrr;

  return v_result;
end;
$$;
