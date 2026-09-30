-- Analytics › Acquisition.

-- One row per user who ever paid, with a 12-month LTV estimate.
create view analytics_private.paid_users as
select
  u.id as user_id,
  i.channel,
  e.mrr_delta_idr as price,
  e.mrr_delta_idr * least(12, greatest(1, ceil(
    extract(epoch from (coalesce(u.churned_at, now()) - u.paid_at)) / 2629800.0
  ))) as ltv_12m
from public.app_users u
join lateral (
  select mrr_delta_idr from public.subscription_events
  where user_id = u.id and event_type = 'new' order by occurred_at limit 1
) e on true
left join lateral (
  select channel from public.app_installs where user_id = u.id order by installed_at limit 1
) i on true
where u.paid_at is not null;

create function public.analytics_acquisition(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prev_from date := p_from - (p_to - p_from + 1);
  v_prev_to date := p_from - 1;
  v_week0 date := date_trunc('week', p_to::timestamp)::date - 77;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with
  inst as (
    select i.*, u.onboarded_at, u.first_signal_at, u.trial_started_at, u.paid_at, u.city, u.province,
           i.installed_at >= analytics_private.jkt(p_from) as in_cur
    from public.app_installs i
    left join public.app_users u on u.id = i.user_id
    where i.installed_at >= analytics_private.jkt(v_prev_from) and i.installed_at < analytics_private.jkt(p_to + 1)
  ),
  cur as (select * from inst where in_cur),
  prev as (select * from inst where not in_cur),
  spend as (
    select
      coalesce(sum(amount_idr) filter (where spend_date between p_from and p_to), 0) as cur,
      coalesce(sum(amount_idr) filter (where spend_date between v_prev_from and v_prev_to), 0) as prev
    from public.channel_spend
  ),
  ltv as (select avg(ltv_12m) as avg_ltv, avg(price) as avg_price from analytics_private.paid_users),
  paid_n as (
    select count(*) filter (where paid_at is not null and in_cur) as cur,
           count(*) filter (where paid_at is not null and not in_cur) as prev
    from inst
  ),
  ch as (
    select c.channel,
      count(cur.id) as installs,
      count(cur.user_id) as signups,
      count(cur.trial_started_at) as trials,
      count(cur.paid_at) as paid,
      coalesce((select sum(amount_idr) from public.channel_spend s
                where s.channel = c.channel and s.spend_date between p_from and p_to), 0) as spend,
      (select avg(ltv_12m) from analytics_private.paid_users pu where pu.channel = c.channel) as ltv
    from unnest(enum_range(null::public.acquisition_channel)) as c(channel)
    left join cur on cur.channel = c.channel
    group by c.channel
  ),
  regions as (
    select region, count(*) filter (where in_cur) as n_cur, count(*) filter (where not in_cur) as n_prev
    from (
      select in_cur, case
        when city ilike 'Jakarta%' or city in ('Bekasi', 'Depok', 'Bogor', 'Tangerang') then 'Jabodetabek'
        when province = 'Jawa Barat' then 'Jawa Barat'
        when province = 'Jawa Timur' then 'Jawa Timur'
        when province like 'Sumatera%' then 'Sumatra'
        when province like 'Sulawesi%' then 'Sulawesi'
        else 'Other' end as region
      from inst where user_id is not null
    ) r
    group by region
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'installs', jsonb_build_object(
        'value', (select count(*) from cur),
        'delta_pct', analytics_private.pct((select count(*) from cur) - (select count(*) from prev), (select count(*) from prev), 0)),
      'signups', jsonb_build_object(
        'value', (select count(user_id) from cur),
        'of_installs_pct', analytics_private.pct((select count(user_id) from cur), (select count(*) from cur))),
      'blended_cac', jsonb_build_object(
        'value', round(spend.cur::numeric / nullif(paid_n.cur, 0)),
        'delta', round(spend.cur::numeric / nullif(paid_n.cur, 0) - spend.prev::numeric / nullif(paid_n.prev, 0))),
      'ltv_cac', jsonb_build_object('value', round(ltv.avg_ltv / nullif(spend.cur::numeric / nullif(paid_n.cur, 0), 0), 1)),
      'payback_months', jsonb_build_object(
        'value', round(spend.cur::numeric / nullif(paid_n.cur, 0) / nullif(ltv.avg_price, 0), 1))
    ),
    'weekly_installs', (
      select jsonb_agg(jsonb_build_object(
        'week_start', to_char(w.d, 'YYYY-MM-DD'),
        'counts', (
          select jsonb_object_agg(c.channel, (
            select count(*) from public.app_installs i
            where i.channel = c.channel
              and i.installed_at >= analytics_private.jkt(w.d) and i.installed_at < analytics_private.jkt(w.d + 7)))
          from unnest(enum_range(null::public.acquisition_channel)) as c(channel))
      ) order by w.d)
      from (select v_week0 + 7 * g as d from generate_series(0, 11) g) w
    ),
    'funnel', jsonb_build_object('steps', jsonb_build_array(
      jsonb_build_object('key', 'installed', 'label', 'App installed', 'count', (select count(*) from cur)),
      jsonb_build_object('key', 'signed_up', 'label', 'Signed up', 'count', (select count(user_id) from cur)),
      jsonb_build_object('key', 'onboarded', 'label', 'Onboarding done', 'count', (select count(onboarded_at) from cur)),
      jsonb_build_object('key', 'first_signal', 'label', 'First signal logged', 'count', (select count(first_signal_at) from cur)),
      jsonb_build_object('key', 'trial', 'label', 'Trial started', 'count', (select count(trial_started_at) from cur)),
      jsonb_build_object('key', 'paid', 'label', 'Paid', 'count', (select count(paid_at) from cur)))),
    'channels', (
      select jsonb_agg(jsonb_build_object(
        'channel', channel, 'installs', installs,
        'signup_pct', analytics_private.pct(signups, installs, 0),
        'trial_pct', analytics_private.pct(trials, signups, 0),
        'paid_pct', analytics_private.pct(paid, signups),
        'spend_idr', spend,
        'cac_idr', case when spend = 0 then 0 else round(spend::numeric / nullif(paid, 0)) end,
        'ltv_cac', case when spend = 0 then null else round(ltv / nullif(spend::numeric / nullif(paid, 0), 0), 1) end
      ) order by installs desc)
      from ch
    ),
    'campaigns', (
      select coalesce(jsonb_agg(jsonb_build_object('channel', channel, 'campaign', campaign, 'conversions', n) order by n desc), '[]'::jsonb)
      from (
        select channel, campaign, count(*) as n from cur
        where paid_at is not null and campaign is not null
        group by channel, campaign order by count(*) desc limit 5
      ) t
    ),
    'regions', (
      select jsonb_agg(jsonb_build_object(
        'region', region,
        'pct', analytics_private.pct(n_cur, (select sum(n_cur) from regions), 0),
        'growth_pct', analytics_private.pct(n_cur - n_prev, n_prev, 0)
      ) order by array_position(array['Jabodetabek', 'Jawa Barat', 'Jawa Timur', 'Sumatra', 'Sulawesi', 'Other'], region))
      from regions
    )
  )
  into v_result
  from spend, ltv, paid_n;

  return v_result;
end;
$$;
