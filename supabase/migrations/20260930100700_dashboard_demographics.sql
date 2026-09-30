-- Dashboard: location and age demographics.

create function public.dashboard_locations(p_top integer default 8)
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

  with totals as (select count(*) as n from public.app_users),
  by_province as (
    select
      coalesce(province, 'Unknown') as name,
      count(*) as n,
      row_number() over (order by count(*) desc) as rank
    from public.app_users
    group by 1
  ),
  city_growth as (
    select
      city,
      count(*) as n,
      count(*) filter (where created_at >= now() - interval '30 days') as new_30d
    from public.app_users
    where city is not null
    group by city
    having count(*) >= 20
  )
  select jsonb_build_object(
    'total', (select n from totals),
    'provinces', (
      select coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', n) order by rank), '[]'::jsonb)
      from by_province where rank <= p_top
    ),
    'others', jsonb_build_object(
      'count', coalesce((select sum(n) from by_province where rank > p_top), 0),
      'provinces', coalesce((select count(*) from by_province where rank > p_top), 0)
    ),
    'java_share_pct', (
      select round(100.0 * count(*) filter (
        where province in ('DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten', 'DI Yogyakarta')
      ) / nullif(count(*), 0), 1)
      from public.app_users
    ),
    'top_city', (
      select jsonb_build_object('name', city, 'count', n)
      from city_growth order by n desc limit 1
    ),
    'fastest_growing_city', (
      select jsonb_build_object(
        'name', city,
        'growth_pct', round(100.0 * new_30d / nullif(n - new_30d, 0), 0)
      )
      from city_growth where n > new_30d order by new_30d::numeric / (n - new_30d) desc limit 1
    )
  )
  into v_result;

  return v_result;
end;
$$;

create function public.dashboard_age_distribution()
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

  with ages as (
    select extract(year from now())::int - birth_year as age
    from public.app_users
    where birth_year is not null and last_active_at >= now() - interval '30 days'
  )
  select jsonb_build_object(
    'median_age', (select percentile_disc(0.5) within group (order by age) from ages),
    'buckets', (
      select jsonb_agg(jsonb_build_object('label', b.label, 'count', b.n) order by b.ord)
      from (
        select t.label, t.ord, count(a.age) as n
        from (values ('< 25', 1, 0, 24), ('25–29', 2, 25, 29), ('30–34', 3, 30, 34), ('35–39', 4, 35, 39), ('40+', 5, 40, 200))
          as t(label, ord, lo, hi)
        left join ages a on a.age between t.lo and t.hi
        group by t.label, t.ord
      ) b
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.dashboard_locations(integer) from public, anon;
revoke execute on function public.dashboard_age_distribution() from public, anon;
grant execute on function public.dashboard_locations(integer) to authenticated;
grant execute on function public.dashboard_age_distribution() to authenticated;
