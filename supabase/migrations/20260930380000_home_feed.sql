-- Home: Daily check-in (a mood log with optional stressors + journal), the recent-notes feed and
-- the signals the recommendations are chosen from. Moods are the same five as the Mood sheet.

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
         or char_length(coalesce(v_payload ->> 'note', '')) > 200
         or char_length(coalesce(v_payload ->> 'journal', '')) > 1000
         or (v_payload ? 'stressors' and (
              jsonb_typeof(v_payload -> 'stressors') <> 'array'
              or jsonb_array_length(v_payload -> 'stressors') > 6
              or exists (select 1 from jsonb_array_elements_text(v_payload -> 'stressors') s
                         where s not in ('waiting', 'family', 'work', 'relationship', 'cost', 'body')))) then
        raise exception 'invalid mood' using errcode = '22023';
      end if;
      -- `note` is the quick note from the Mood sheet; `journal` and `stressors` come from the Daily check-in.
      v_payload := jsonb_strip_nulls(jsonb_build_object(
        'note', nullif(trim(coalesce(v_payload ->> 'note', '')), ''),
        'journal', nullif(trim(coalesce(v_payload ->> 'journal', '')), ''),
        'stressors', case when jsonb_array_length(coalesce(v_payload -> 'stressors', '[]')) > 0
                          then v_payload -> 'stressors' end));
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

create function public.app_check_in_get(p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_latest date;
  v_streak integer := 0;
begin
  -- The streak counts consecutive days with a mood log, and survives until the end of "today".
  select max(logged_on) into v_latest from public.user_daily_logs
    where user_id = v_user and kind = 'mood' and logged_on <= p_today;
  if v_latest is not null and v_latest >= p_today - 1 then
    select count(*) into v_streak from (
      select logged_on, row_number() over (order by logged_on desc) as rn
      from public.user_daily_logs
      where user_id = v_user and kind = 'mood' and logged_on <= v_latest
      order by logged_on desc limit 400
    ) n where n.logged_on = v_latest - (n.rn - 1)::int;
  end if;

  return jsonb_build_object(
    'today', (select jsonb_build_object(
                'moodId', value,
                'stressorIds', coalesce(payload -> 'stressors', '[]'::jsonb),
                'journal', coalesce(payload ->> 'journal', ''))
              from public.user_daily_logs where user_id = v_user and kind = 'mood' and logged_on = p_today),
    'week', (select jsonb_agg(jsonb_build_object('date', to_char(p_today - 6 + g.i, 'YYYY-MM-DD'), 'moodId', l.value) order by g.i)
             from generate_series(0, 6) g(i)
             left join public.user_daily_logs l
               on l.user_id = v_user and l.kind = 'mood' and l.logged_on = p_today - 6 + g.i),
    'streakDays', v_streak
  );
end;
$$;

create function public.app_home_feed(p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  u public.app_users;
begin
  select * into u from public.app_users where id = v_user;

  return jsonb_build_object(
    -- Private kinds (intimacy, pregnancy tests, periods) never appear on the Home screen.
    'recentNotes', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'date', to_char(logged_on, 'YYYY-MM-DD'), 'kind', kind, 'text', line)
                       order by logged_on desc, updated_at desc)
      from (
        select id, logged_on, kind, updated_at,
          case kind
            when 'note' then payload ->> 'text'
            when 'mood' then 'Feeling ' || value
              || coalesce(': ' || left(coalesce(payload ->> 'journal', payload ->> 'note'), 60), '')
            when 'symptom' then (select string_agg(upper(left(s, 1)) || substr(replace(s, '_', ' '), 2), ', ')
                                 from jsonb_array_elements_text(payload -> 'symptoms') s)
            when 'temperature' then 'Basal temp logged: ' || trim(to_char(number_value, 'FM990.0')) || '°C'
            when 'cervical_fluid' then 'Cervical fluid: ' || replace(value, '_', ' ')
            when 'lh_test' then 'LH test: ' || value
          end as line
        from public.user_daily_logs
        where user_id = v_user and logged_on <= p_today and logged_on >= p_today - 30
          and kind in ('note', 'mood', 'symptom', 'temperature', 'cervical_fluid', 'lh_test')
        order by logged_on desc, updated_at desc limit 3
      ) r where line is not null
    ), '[]'::jsonb),
    'signals', jsonb_build_object(
      'tempDaysAgo', (select p_today - max(logged_on) from public.user_daily_logs
                      where user_id = v_user and kind = 'temperature' and logged_on <= p_today),
      'cyclesTracked', u.cycles_tracked,
      'tryingDuration', u.trying_duration,
      'hasProgram', exists (select 1 from public.user_treatment_programs where user_id = v_user and status = 'active'),
      'hasPartner', exists (select 1 from public.user_partner where user_id = v_user)
    )
  );
end;
$$;

revoke execute on function public.app_check_in_get(date) from public, anon;
revoke execute on function public.app_home_feed(date) from public, anon;
grant execute on function public.app_check_in_get(date) to authenticated;
grant execute on function public.app_home_feed(date) to authenticated;

-- Console: the daily logs view shows the check-in journal next to the mood.
create or replace function public.admin_user_logs(p_user uuid, p_reason text, p_days integer default 60)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text;
  u public.app_users;
  v_days integer := least(greatest(coalesce(p_days, 60), 1), 365);
begin
  perform public.assert_console_admin();
  v_reason := analytics_private.require_reason(p_reason);

  select * into u from public.app_users where id = p_user;
  if u.id is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  perform analytics_private.write_audit('user.unmask.daily_logs', analytics_private.user_ref(p_user),
    jsonb_build_object('reason', v_reason, 'days', v_days));

  return jsonb_build_object(
    'name', u.full_name,
    'days', v_days,
    'rows', coalesce((
      select jsonb_agg(day_row order by d desc)
      from (
        select logged_on as d, jsonb_build_object(
          'date', to_char(logged_on, 'YYYY-MM-DD'),
          'temperature', max(number_value) filter (where kind = 'temperature'),
          'time_of_day', max(value) filter (where kind = 'temperature'),
          'mood', max(value) filter (where kind = 'mood'),
          'mood_note', max(coalesce(payload ->> 'journal', payload ->> 'note')) filter (where kind = 'mood'),
          'symptoms', (array_agg(payload -> 'symptoms') filter (where kind = 'symptom'))[1],
          'fluid', max(value) filter (where kind = 'cervical_fluid'),
          'lh', max(value) filter (where kind = 'lh_test'),
          'intimacy', max(value) filter (where kind = 'intimacy'),
          'pregnancy_test', max(value) filter (where kind = 'pregnancy_test'),
          'pregnancy_test_type', max(payload ->> 'testType') filter (where kind = 'pregnancy_test'),
          'flow', max(value) filter (where kind = 'flow'),
          'note', max(payload ->> 'text') filter (where kind = 'note')
        ) as day_row
        from public.user_daily_logs
        where user_id = p_user and logged_on >= current_date - v_days
        group by logged_on
      ) x
    ), '[]'::jsonb),
    'logged_by', (select auth.jwt() ->> 'email'),
    'reason', v_reason
  );
end;
$$;
