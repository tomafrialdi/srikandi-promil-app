-- Doctor report preview (mobile): figures computed from what the user has actually recorded.
-- BBT / test / symptom logs don't exist server-side yet, so the preview carries no chart or flag.

create function public.app_report_preview(p_range text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  u public.app_users;
  v_limit integer := case p_range when 'last-3' then 3 when 'last-6' then 6 when 'all' then null else -1 end;
  v_count integer;
  v_first date;
  v_avg numeric;
  v_luteal numeric;
  v_confirmed integer;
  v_trying text;
begin
  if v_limit = -1 then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  select * into u from public.app_users where id = v_user;

  with picked as (
    select * from public.user_cycles where user_id = v_user order by cycle_no desc limit v_limit
  )
  select count(*), min(start_date),
         avg(length_days),
         avg(luteal_days),
         count(*) filter (where ovulation_day is not null)
  into v_count, v_first, v_avg, v_luteal, v_confirmed
  from picked;

  v_trying := case u.trying_duration
    when 'lt_6_months' then 'Under 6 months'
    when '6_12_months' then '6–12 months'
    when '1_2_years' then '1–2 years'
    when '2_plus_years' then '2+ years'
  end;

  return jsonb_build_object(
    'name', u.full_name,
    'ageYears', case when u.birth_date is not null then extract(year from age(current_date, u.birth_date))::int end,
    'cycleCount', v_count,
    'firstCycleStart', v_first,
    'stats', jsonb_build_array(
      jsonb_build_object('label', 'Avg. cycle',
        'value', coalesce(coalesce(round(v_avg)::int, u.cycle_length_days)::text || ' days', '—')),
      jsonb_build_object('label', 'Luteal phase',
        'value', coalesce(coalesce(round(v_luteal)::int, u.luteal_phase_days)::text || ' days', '—')),
      jsonb_build_object('label', 'Ovulation confirmed',
        'value', case when v_count = 0 then '—' else v_confirmed || ' of ' || v_count end),
      jsonb_build_object('label', 'Trying for', 'value', coalesce(v_trying, '—'))
    )
  );
end;
$$;

revoke execute on function public.app_report_preview(text) from public, anon;
grant execute on function public.app_report_preview(text) to authenticated;
