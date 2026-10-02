-- Calendar (mobile): one month, day by day. Past days use the user's real cycles (user_cycles),
-- the running cycle and the future use the prediction engine (analytics_private.cycle_model),
-- and logged periods always show as period days. Each day also carries a one-line summary of
-- what the user logged.

create function public.app_calendar_month(p_month text, p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_first date;
  v_last date;
  m jsonb;
  v_has boolean;
  v_len integer;
  v_period integer;
  v_luteal integer;
  v_cur_start date;
  v_model_next date;
  v_eff_next date;
  v_model_ov date;
  v_model_fs date;
  v_model_fe date;
  v_first_start date;
  v_summaries jsonb;
  v_flow jsonb;
  v_days jsonb := '[]'::jsonb;
  d date;
  v_cd integer;
  v_phase text;
  v_k integer;
  v_sk date;
  v_ov date;
  c record;
  v_found boolean;
begin
  if p_month is null or p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid month' using errcode = '22023';
  end if;
  v_first := (p_month || '-01')::date;
  if v_first < date '2000-01-01' or v_first > date '2100-01-01' then
    raise exception 'invalid month' using errcode = '22023';
  end if;
  v_last := (v_first + interval '1 month')::date - 1;

  m := analytics_private.cycle_model(v_user, p_today);
  v_has := coalesce((m ->> 'hasData')::boolean, false);
  if v_has then
    v_len := (m ->> 'cycleLength')::int;
    v_period := (m ->> 'periodLength')::int;
    v_luteal := (m ->> 'lutealDays')::int;
    v_cur_start := (m ->> 'cycleStart')::date;
    v_model_next := (m ->> 'nextPeriod')::date;
    v_model_ov := (m ->> 'ovulationDate')::date;
    v_model_fs := (m ->> 'fertileStart')::date;
    v_model_fe := (m ->> 'fertileEnd')::date;
    -- A period that hasn't started yet is expected no earlier than today.
    v_eff_next := greatest(v_model_next, p_today);
    select min(start_date) into v_first_start from public.user_cycles where user_id = v_user;
  end if;

  -- What was logged each day, in one line.
  select coalesce(jsonb_object_agg(to_char(logged_on, 'YYYY-MM-DD'), line), '{}'::jsonb)
    into v_summaries
  from (
    select logged_on,
      concat_ws(' · ',
        case when max(value) filter (where kind = 'mood') is not null
             then 'Feeling ' || max(value) filter (where kind = 'mood') end,
        (select string_agg(upper(left(s, 1)) || substr(replace(s, '_', ' '), 2), ', ')
           from jsonb_array_elements_text(coalesce((array_agg(payload -> 'symptoms') filter (where kind = 'symptom'))[1], '[]'::jsonb)) s),
        case when max(number_value) filter (where kind = 'temperature') is not null
             then 'Basal temp ' || trim(to_char(max(number_value) filter (where kind = 'temperature'), 'FM990.0')) || '°C' end,
        case when max(value) filter (where kind = 'cervical_fluid') is not null
             then 'Fluid: ' || replace(max(value) filter (where kind = 'cervical_fluid'), '_', ' ') end,
        case when max(value) filter (where kind = 'lh_test') is not null
             then 'LH: ' || max(value) filter (where kind = 'lh_test') end,
        case when max(value) filter (where kind = 'intimacy') = 'yes' then 'Intimacy' end,
        case when max(value) filter (where kind = 'pregnancy_test') is not null
             then 'Pregnancy test: ' || replace(max(value) filter (where kind = 'pregnancy_test'), '_', ' ') end,
        case when max(value) filter (where kind = 'flow') is not null
                  and max(value) filter (where kind = 'flow') <> 'none'
             then 'Flow: ' || max(value) filter (where kind = 'flow') end,
        case when max(payload ->> 'text') filter (where kind = 'note') is not null
             then 'Note: ' || left(max(payload ->> 'text') filter (where kind = 'note'), 40) end
      ) as line
    from public.user_daily_logs
    where user_id = v_user and logged_on between v_first and v_last
    group by logged_on
  ) x
  where line <> '';

  select coalesce(jsonb_object_agg(to_char(logged_on, 'YYYY-MM-DD'), true), '{}'::jsonb)
    into v_flow
  from public.user_daily_logs
  where user_id = v_user and kind = 'flow' and value <> 'none' and logged_on between v_first and v_last;

  d := v_first;
  while d <= v_last loop
    v_cd := null;
    v_phase := null;

    if v_has and d >= v_first_start then
      v_found := false;

      -- A finished cycle: real length, ovulation only when it was confirmed.
      for c in
        select start_date, length_days, ovulation_day from public.user_cycles
        where user_id = v_user and length_days is not null and d >= start_date and d < start_date + length_days
      loop
        v_found := true;
        v_cd := d - c.start_date + 1;
        v_phase := case
          when v_cd <= v_period then 'period'
          when c.ovulation_day is not null and v_cd = c.ovulation_day then 'ovulation'
          when c.ovulation_day is not null and v_cd between c.ovulation_day - 5 and c.ovulation_day + 1 then 'fertile'
        end;
      end loop;

      if not v_found then
        if d >= v_cur_start and d < v_eff_next then
          -- The running cycle (days after a late period was due have no phase).
          v_cd := d - v_cur_start + 1;
          if d < v_model_next then
            v_phase := case
              when v_cd <= v_period then 'period'
              when d = v_model_ov then 'ovulation'
              when d between v_model_fs and v_model_fe then 'fertile'
            end;
          end if;
        elsif d >= v_eff_next then
          -- Predicted cycles repeat the learned length.
          v_k := floor((d - v_eff_next)::numeric / v_len)::int;
          v_sk := v_eff_next + v_k * v_len;
          v_ov := v_sk + (v_len - v_luteal);
          v_cd := d - v_sk + 1;
          v_phase := case
            when v_cd <= v_period then 'period'
            when d = v_ov then 'ovulation'
            when d between v_ov - 5 and v_ov + 1 then 'fertile'
          end;
        end if;
      end if;
    end if;

    -- A period the user actually logged always shows as a period day.
    if v_flow ? to_char(d, 'YYYY-MM-DD') then
      v_phase := 'period';
    end if;

    v_days := v_days || jsonb_build_object(
      'date', to_char(d, 'YYYY-MM-DD'),
      'cycleDay', v_cd,
      'phase', v_phase,
      'summary', v_summaries -> to_char(d, 'YYYY-MM-DD'));
    d := d + 1;
  end loop;

  return jsonb_build_object('month', p_month, 'days', v_days);
end;
$$;

revoke execute on function public.app_calendar_month(text, date) from public, anon;
grant execute on function public.app_calendar_month(text, date) to authenticated;
