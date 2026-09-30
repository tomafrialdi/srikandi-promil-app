-- Dashboard: headline KPIs, monthly growth and plan split.

create function public.dashboard_kpis()
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

  with cur as (
    select
      count(*) as total,
      count(*) filter (where plan = 'free') as free,
      count(*) filter (where plan in ('plus_monthly', 'plus_yearly')) as paid,
      count(*) filter (where plan = 'trial') as trial,
      count(*) filter (where last_active_at >= now() - interval '1 day') as dau,
      count(*) filter (where last_active_at >= now() - interval '30 days') as mau
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
      coalesce(sum(pp.monthly_idr), 0) as cur,
      coalesce(sum(pp.monthly_idr) filter (where u.paid_at <= now() - interval '30 days'), 0) as prev
    from public.app_users u
    join public.plan_prices pp on pp.plan = u.plan
  )
  select jsonb_build_object(
    'total_users', cur.total,
    'free_users', cur.free,
    'paid_users', cur.paid,
    'trial_users', cur.trial,
    'daily_active', cur.dau,
    'monthly_active', cur.mau,
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

create function public.dashboard_user_growth(p_months integer default 12)
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

  select coalesce(jsonb_agg(row_to_json(m) order by m.month), '[]'::jsonb)
  into v_result
  from (
    select
      to_char(gs.month, 'YYYY-MM-DD') as month,
      count(u.id) filter (where u.plan in ('free', 'trial')) as free,
      count(u.id) filter (where u.plan in ('plus_monthly', 'plus_yearly')) as paid
    from generate_series(
      date_trunc('month', now()) - make_interval(months => p_months - 1),
      date_trunc('month', now()),
      interval '1 month'
    ) as gs(month)
    left join public.app_users u
      on u.created_at >= gs.month and u.created_at < gs.month + interval '1 month'
    group by gs.month
  ) m;

  return v_result;
end;
$$;

create function public.dashboard_plan_split()
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
    'plans', (
      select coalesce(jsonb_agg(jsonb_build_object('plan', p.plan, 'count', p.n) order by p.ord), '[]'::jsonb)
      from (
        select t.plan, t.ord, count(u.id) as n
        from (values ('free', 1), ('plus_yearly', 2), ('plus_monthly', 3), ('trial', 4)) as t(plan, ord)
        left join public.app_users u on u.plan = t.plan::public.plan_type
        group by t.plan, t.ord
      ) p
    ),
    'paid_pct', (
      select round(100.0 * count(*) filter (where plan in ('plus_monthly', 'plus_yearly')) / nullif(count(*), 0), 1)
      from public.app_users
    ),
    'trial_conversion_pct', (
      select round(
        100.0 * count(*) filter (where paid_at is not null) / nullif(count(*), 0), 1
      )
      from public.app_users
      where trial_started_at is not null
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.dashboard_kpis() from public, anon;
revoke execute on function public.dashboard_user_growth(integer) from public, anon;
revoke execute on function public.dashboard_plan_split() from public, anon;
grant execute on function public.dashboard_kpis() to authenticated;
grant execute on function public.dashboard_user_growth(integer) to authenticated;
grant execute on function public.dashboard_plan_split() to authenticated;
