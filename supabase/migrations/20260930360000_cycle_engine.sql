-- Cycle prediction engine.
--   analytics_private.cycle_model(user, today)  the one place that decides where the user is in
--                                               their cycle (shared by Home, Calendar, Insights, report)
--   app_cycle_summary(today)                    what Home shows
-- Calendar-based by default (ovulation = cycle length - luteal phase after the period started),
-- sharpened by what the user logged: an LH peak or egg-white fluid moves ovulation. Closed cycles
-- (user_cycles) replace the user's typed averages as they accumulate.
-- Saving a period (flow) well after the current cycle began now rolls the cycle over.

create or replace function public.app_log_save(
  p_kind text,
  p_date date,
  p_value text default null,
  p_number numeric default null,
  p_payload jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_payload jsonb := coalesce(p_payload, '{}');
  v_symptoms jsonb;
  v_feature text;
  v_inserted boolean;
  v_used_at timestamptz;
  oc public.user_cycles;
  v_peak date;
begin
  if p_date is null or p_date > current_date + 1 or p_date < current_date - 366 then
    raise exception 'invalid date' using errcode = '22023';
  end if;
  if jsonb_typeof(v_payload) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  case p_kind
    when 'temperature' then
      if p_number is null or p_number < 35 or p_number > 42
         or p_value is null or p_value not in ('morning', 'afternoon', 'evening') then
        raise exception 'invalid temperature' using errcode = '22023';
      end if;
      v_payload := '{}';
    when 'mood' then
      if p_value is null or p_value not in ('great', 'good', 'okay', 'low', 'hard')
         or char_length(coalesce(v_payload ->> 'note', '')) > 200 then
        raise exception 'invalid mood' using errcode = '22023';
      end if;
      v_payload := case when nullif(trim(coalesce(v_payload ->> 'note', '')), '') is null then '{}'
                        else jsonb_build_object('note', trim(v_payload ->> 'note')) end;
    when 'symptom' then
      v_symptoms := coalesce(v_payload -> 'symptoms', '[]');
      if jsonb_typeof(v_symptoms) <> 'array' or jsonb_array_length(v_symptoms) > 6
         or exists (select 1 from jsonb_array_elements_text(v_symptoms) s
                    where s not in ('cramping', 'bloating', 'headache', 'fatigue', 'nausea', 'tender_breasts')) then
        raise exception 'invalid symptoms' using errcode = '22023';
      end if;
      -- Nothing selected = clear today's symptoms.
      if jsonb_array_length(v_symptoms) = 0 then
        delete from public.user_daily_logs where user_id = v_user and kind = 'symptom' and logged_on = p_date;
        return;
      end if;
      v_payload := jsonb_build_object('symptoms', v_symptoms);
      p_value := null;
    when 'cervical_fluid' then
      if p_value is null or p_value not in ('dry', 'sticky', 'creamy', 'watery', 'egg_white') then
        raise exception 'invalid cervical fluid' using errcode = '22023';
      end if;
      v_payload := '{}';
    when 'lh_test' then
      if p_value is null or p_value not in ('negative', 'high', 'peak') then
        raise exception 'invalid LH test result' using errcode = '22023';
      end if;
      v_payload := '{}';
    when 'intimacy' then
      if p_value is null or p_value not in ('yes', 'no') then
        raise exception 'invalid intimacy entry' using errcode = '22023';
      end if;
      v_payload := '{}';
    when 'pregnancy_test' then
      if p_value is null or p_value not in ('negative', 'faint_line', 'positive')
         or coalesce(v_payload ->> 'testType', '') not in ('strip', 'digital', 'blood_hcg') then
        raise exception 'invalid pregnancy test' using errcode = '22023';
      end if;
      v_payload := jsonb_build_object('testType', v_payload ->> 'testType');
    when 'flow' then
      if p_value is null or p_value not in ('none', 'light', 'medium', 'heavy') then
        raise exception 'invalid flow' using errcode = '22023';
      end if;
      v_payload := '{}';
    when 'note' then
      if char_length(trim(coalesce(v_payload ->> 'text', ''))) not between 1 and 1000 then
        raise exception 'invalid note' using errcode = '22023';
      end if;
      v_payload := jsonb_build_object('text', trim(v_payload ->> 'text'));
      p_value := null;
    else
      raise exception 'unknown log kind' using errcode = '22023';
  end case;

  insert into public.user_daily_logs (user_id, kind, logged_on, value, number_value, payload)
  values (v_user, p_kind, p_date,
          p_value,
          case when p_kind = 'temperature' then round(p_number, 2) end,
          v_payload)
  on conflict (user_id, kind, logged_on) do update
    set value = excluded.value, number_value = excluded.number_value, payload = excluded.payload
  returning (xmax = 0) into v_inserted;

  -- A period logged well after the current cycle began starts the next cycle: close the open
  -- one (with its length and, when an LH peak was logged, ovulation / luteal length) and open a new one.
  if p_kind = 'flow' and p_value <> 'none' then
    select * into oc from public.user_cycles
      where user_id = v_user and length_days is null order by cycle_no desc limit 1;
    if found and p_date >= oc.start_date + 15 and p_date <= current_date + 1 then
      select max(logged_on) into v_peak from public.user_daily_logs
        where user_id = v_user and kind = 'lh_test' and value = 'peak'
          and logged_on >= oc.start_date and logged_on < p_date;
      update public.user_cycles set
        length_days = p_date - oc.start_date,
        ovulation_day = case when v_peak is not null then (v_peak + 1) - oc.start_date + 1 end,
        luteal_days = case when v_peak is not null then p_date - (v_peak + 1) end
      where id = oc.id;
      insert into public.user_cycles (user_id, cycle_no, start_date) values (v_user, oc.cycle_no + 1, p_date);
      update public.app_users set cycles_tracked = cycles_tracked + 1 where id = v_user;
    end if;
  end if;

  -- Feed product analytics (console "Tracking summary" signals): one event per new log, and
  -- mood + symptoms count as a single daily check-in.
  v_feature := case p_kind
    when 'temperature' then 'Basal temperature'
    when 'cervical_fluid' then 'Cervical fluid'
    when 'lh_test' then 'LH test scan'
    when 'mood' then 'Daily check-in'
    when 'symptom' then 'Daily check-in'
  end;
  if v_inserted and v_feature is not null then
    v_used_at := case when p_date = current_date then now() else p_date::timestamp::timestamptz + interval '12 hours' end;
    insert into public.feature_usage (user_id, feature, used_at)
    select v_user, v_feature, v_used_at
    where not exists (
      select 1 from public.feature_usage f
      where f.user_id = v_user and f.feature = v_feature
        and f.used_at >= p_date::timestamp::timestamptz and f.used_at < p_date::timestamp::timestamptz + interval '1 day'
    ) or v_feature <> 'Daily check-in';
  end if;
end;
$$;

create function analytics_private.cycle_model(p_user uuid, p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u public.app_users;
  oc public.user_cycles;
  v_closed integer;
  v_sum_len numeric;
  v_luteal_n integer;
  v_sum_luteal numeric;
  v_len integer;
  v_luteal integer;
  v_period integer;
  v_peak date;
  v_egg date;
  v_ov date;
  v_source text;
  v_next date;
  v_irregular boolean;
  v_confidence text;
begin
  select * into u from public.app_users where id = p_user;
  select * into oc from public.user_cycles where user_id = p_user and length_days is null order by cycle_no desc limit 1;
  if not found then
    return jsonb_build_object('hasData', false);
  end if;

  select count(*), coalesce(sum(length_days), 0), count(luteal_days), coalesce(sum(luteal_days), 0)
    into v_closed, v_sum_len, v_luteal_n, v_sum_luteal
  from (select * from public.user_cycles
        where user_id = p_user and length_days between 15 and 90
        order by cycle_no desc limit 6) c;

  -- What the user typed counts as two observations; real cycles take over as they accumulate.
  v_len := greatest(15, least(90, round((2 * coalesce(u.cycle_length_days, 28) + v_sum_len) / (2 + v_closed))::int));
  v_luteal := greatest(8, least(20, round((2 * coalesce(u.luteal_phase_days, 14) + v_sum_luteal) / (2 + v_luteal_n))::int));
  v_period := coalesce(u.period_length_days, 5);
  v_irregular := u.cycle_regularity = 'irregular' or u.tracking_mode = 'pcos';

  -- Signals from the current cycle only.
  select max(logged_on) filter (where kind = 'lh_test' and value = 'peak'),
         max(logged_on) filter (where kind = 'cervical_fluid' and value = 'egg_white')
    into v_peak, v_egg
  from public.user_daily_logs
  where user_id = p_user and logged_on >= oc.start_date and logged_on <= p_today;

  if v_peak is not null then
    v_ov := v_peak + 1; v_source := 'lh';
  elsif v_egg is not null then
    v_ov := v_egg + 1; v_source := 'fluid';
  else
    v_ov := oc.start_date + (v_len - v_luteal); v_source := 'calendar';
  end if;

  -- With a measured ovulation the period follows one luteal phase later.
  v_next := case when v_source = 'lh' then v_ov + v_luteal else oc.start_date + v_len end;

  v_confidence := case
    when v_source = 'lh' then 'high'
    when v_source = 'fluid' or (v_closed >= 3 and not v_irregular) then 'medium'
    else 'low' end;

  return jsonb_build_object(
    'hasData', true,
    'cycleNo', oc.cycle_no,
    'cycleStart', to_char(oc.start_date, 'YYYY-MM-DD'),
    'cycleLength', v_len,
    'periodLength', v_period,
    'lutealDays', v_luteal,
    'ovulationDate', to_char(v_ov, 'YYYY-MM-DD'),
    'ovulationSource', v_source,
    'fertileStart', to_char(v_ov - 5, 'YYYY-MM-DD'),
    'fertileEnd', to_char(v_ov + 1, 'YYYY-MM-DD'),
    'nextPeriod', to_char(v_next, 'YYYY-MM-DD'),
    'closedCycles', v_closed,
    'irregular', v_irregular,
    'confidence', v_confidence
  );
end;
$$;

create function public.app_cycle_summary(p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  m jsonb := analytics_private.cycle_model(analytics_private.current_app_user(), p_today);
  v_start date;
  v_ov date;
  v_fs date;
  v_fe date;
  v_next date;
  v_period integer;
  v_phase text;
begin
  if not (m ->> 'hasData')::boolean then
    return jsonb_build_object('hasData', false);
  end if;

  v_start := (m ->> 'cycleStart')::date;
  v_ov := (m ->> 'ovulationDate')::date;
  v_fs := (m ->> 'fertileStart')::date;
  v_fe := (m ->> 'fertileEnd')::date;
  v_next := (m ->> 'nextPeriod')::date;
  v_period := (m ->> 'periodLength')::int;

  v_phase := case
    when p_today >= v_next then 'late'
    when p_today - v_start + 1 <= v_period then 'period'
    when p_today = v_ov then 'ovulation'
    when p_today between v_fs and v_fe then 'fertile'
    when p_today < v_fs then 'follicular'
    else 'luteal' end;

  return m || jsonb_build_object(
    'today', to_char(p_today, 'YYYY-MM-DD'),
    'cycleDay', p_today - v_start + 1,
    'phase', v_phase,
    'daysToOvulation', v_ov - p_today,
    'daysToFertile', v_fs - p_today,
    'daysToNextPeriod', v_next - p_today,
    'daysLate', case when p_today >= v_next then p_today - v_next end
  );
end;
$$;

revoke execute on function analytics_private.cycle_model(uuid, date) from public, anon, authenticated;
revoke execute on function public.app_cycle_summary(date) from public, anon;
grant execute on function public.app_cycle_summary(date) to authenticated;
