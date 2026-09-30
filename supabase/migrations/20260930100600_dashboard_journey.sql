-- Dashboard: user journey status and fertility outcomes.
-- A user counts as "inactive" when they have not been active for 30+ days.

create function public.dashboard_journey()
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
    'total', (select count(*) from public.app_users),
    'stages', (
      select coalesce(jsonb_agg(jsonb_build_object('stage', s.stage, 'count', s.n) order by s.ord), '[]'::jsonb)
      from (
        select t.stage, t.ord, count(u.id) as n
        from (values
          ('getting_started', 1), ('trying', 2), ('two_week_wait', 3), ('in_treatment', 4),
          ('pregnant', 5), ('after_loss', 6), ('inactive', 7)
        ) as t(stage, ord)
        left join (
          select
            id,
            case
              when coalesce(last_active_at, created_at) < now() - interval '30 days' then 'inactive'
              else journey_stage::text
            end as stage
          from public.app_users
        ) u on u.stage = t.stage
        group by t.stage, t.ord
      ) s
    )
  )
  into v_result;

  return v_result;
end;
$$;

create function public.dashboard_outcomes()
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
    'conceived_total', count(*) filter (where conceived_at is not null),
    'conceived_this_month', count(*) filter (where conceived_at >= date_trunc('month', now())),
    'conceived_prev_month', count(*) filter (
      where conceived_at >= date_trunc('month', now()) - interval '1 month'
        and conceived_at < date_trunc('month', now())
    ),
    'conceived_within_6_cycles_pct', round(
      100.0 * count(*) filter (where conceived_at is not null and cycles_tracked <= 6)
      / nullif(count(*) filter (where conceived_at is not null), 0), 1
    ),
    'avg_cycles_to_conceive', round(avg(cycles_tracked) filter (where conceived_at is not null), 1),
    'median_cycles_to_conceive', percentile_disc(0.5) within group (order by cycles_tracked)
      filter (where conceived_at is not null),
    'referred_to_specialist', count(*) filter (where referred_at is not null)
  )
  into v_result
  from public.app_users;

  return v_result;
end;
$$;

revoke execute on function public.dashboard_journey() from public, anon;
revoke execute on function public.dashboard_outcomes() from public, anon;
grant execute on function public.dashboard_journey() to authenticated;
grant execute on function public.dashboard_outcomes() to authenticated;
