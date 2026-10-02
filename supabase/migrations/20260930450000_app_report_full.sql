-- Doctor report (mobile): everything the report can contain, from the user's own cycles and logs.
-- The app shows the preview from it and builds the PDF from the sections the user switched on.
-- Replaces app_report_preview (which had no chart, no flags and none of the sections).

drop function if exists public.app_report_preview(text);

create function public.app_report(p_range text, p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  u public.app_users;
  m jsonb;
  v_limit integer := case p_range when 'last-3' then 3 when 'last-6' then 6 when 'all' then null else -1 end;
  v_picked jsonb;
  v_count integer;
  v_first date;
  v_from date;
  v_closed integer;
  v_avg numeric;
  v_luteal_avg numeric;
  v_confirmed integer;
  v_min_len integer;
  v_max_len integer;
  v_unconfirmed integer;
  v_trying text;
  -- BBT
  bc record;
  v_temps numeric[];
  v_n integer;
  v_base numeric;
  v_shift integer;
  v_ov_day integer;
  v_bbt jsonb;
  v_bbt_title text;
  v_i integer;
  v_flags text[] := '{}';
begin
  if v_limit = -1 then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  select * into u from public.app_users where id = v_user;
  m := analytics_private.cycle_model(v_user, p_today);

  select coalesce(jsonb_agg(to_jsonb(c) order by c.cycle_no desc), '[]'::jsonb), count(*), min(c.start_date),
         count(*) filter (where c.length_days between 15 and 90),
         avg(c.length_days) filter (where c.length_days between 15 and 90),
         avg(c.luteal_days),
         count(*) filter (where c.ovulation_day is not null),
         min(c.length_days) filter (where c.length_days between 15 and 90),
         max(c.length_days) filter (where c.length_days between 15 and 90),
         count(*) filter (where c.length_days is not null and c.ovulation_day is null)
    into v_picked, v_count, v_first, v_closed, v_avg, v_luteal_avg, v_confirmed, v_min_len, v_max_len, v_unconfirmed
  from (
    select cycle_no, start_date, length_days, ovulation_day, luteal_days
    from public.user_cycles where user_id = v_user order by cycle_no desc limit v_limit
  ) c;

  v_from := coalesce(v_first, p_today - 90);

  v_trying := case u.trying_duration
    when 'lt_6_months' then 'Under 6 months'
    when '6_12_months' then '6–12 months'
    when '1_2_years' then '1–2 years'
    when '2_plus_years' then '2+ years'
  end;

  -- ── Basal temperature of one cycle: the running one, or the latest finished one with enough readings.
  select c.* into bc
  from public.user_cycles c
  where c.user_id = v_user
    and (select count(*) from public.user_daily_logs l
         where l.user_id = v_user and l.kind = 'temperature'
           and l.logged_on >= c.start_date and l.logged_on < c.start_date + coalesce(c.length_days, 90)) >= 3
  order by c.cycle_no desc limit 1;

  if bc.id is not null then
    select array_agg(t.number_value order by g.day), max(g.day)
      into v_temps, v_n
    from generate_series(1, least(60, (select max(logged_on) - bc.start_date + 1 from public.user_daily_logs
                                       where user_id = v_user and kind = 'temperature'
                                         and logged_on >= bc.start_date and logged_on < bc.start_date + coalesce(bc.length_days, 90)))) g(day)
    left join public.user_daily_logs t
      on t.user_id = v_user and t.kind = 'temperature' and t.logged_on = bc.start_date + g.day - 1;

    -- A sustained rise (three readings 0.15°C above the previous six) marks the shift after ovulation.
    v_shift := null;
    for v_i in 7 .. coalesce(array_length(v_temps, 1), 0) - 2 loop
      select avg(x) into v_base from unnest(v_temps[v_i - 6 : v_i - 1]) x where x is not null;
      if v_base is not null
         and v_temps[v_i] > v_base + 0.15 and v_temps[v_i + 1] > v_base + 0.15 and v_temps[v_i + 2] > v_base + 0.15 then
        v_shift := v_i;
        exit;
      end if;
    end loop;

    v_ov_day := coalesce(
      bc.ovulation_day,
      case when bc.length_days is null and m ->> 'ovulationSource' <> 'calendar'
           then (m ->> 'ovulationDate')::date - bc.start_date + 1 end,
      v_shift - 1,
      case when bc.length_days is null then (m ->> 'ovulationDate')::date - bc.start_date + 1 end,
      15);
    v_bbt_title := case when bc.length_days is null then 'BBT · current cycle' else 'BBT · last cycle' end;
    v_bbt := jsonb_build_object('title', v_bbt_title, 'biphasic', v_shift is not null,
                                'ovulationDay', v_ov_day, 'temps', to_jsonb(v_temps));
  end if;

  -- ── Points to discuss, only where the data actually shows something.
  if v_closed >= 3 and v_unconfirmed >= 1 and exists (
       select 1 from public.user_daily_logs where user_id = v_user and kind in ('lh_test', 'temperature') and logged_on >= v_from) then
    v_flags := v_flags || format('%s of %s finished cycles without confirmed ovulation', v_unconfirmed, v_closed);
  end if;
  if v_closed >= 2 and v_max_len - v_min_len >= 8 then
    v_flags := v_flags || format('cycle length varies by %s days (%s–%s)', v_max_len - v_min_len, v_min_len, v_max_len);
  end if;
  if v_closed >= 1 and (v_min_len < 21 or v_max_len > 35) then
    v_flags := v_flags || 'cycle length outside the usual 21–35 days';
  end if;
  if v_luteal_avg is not null and v_luteal_avg < 10 then
    v_flags := v_flags || format('short luteal phase (average %s days)', round(v_luteal_avg));
  end if;

  return jsonb_build_object(
    'name', u.full_name,
    'ageYears', case when u.birth_date is not null then extract(year from age(current_date, u.birth_date))::int end,
    'cycleCount', v_count,
    'firstCycleStart', v_first,
    'stats', jsonb_build_array(
      jsonb_build_object('label', 'Avg. cycle',
        'value', coalesce(coalesce(round(v_avg)::int, u.cycle_length_days)::text || ' days', '—')),
      jsonb_build_object('label', 'Luteal phase',
        'value', coalesce(coalesce(round(v_luteal_avg)::int, u.luteal_phase_days)::text || ' days', '—')),
      jsonb_build_object('label', 'Ovulation confirmed',
        'value', case when v_count = 0 then '—' else v_confirmed || ' of ' || v_count end),
      jsonb_build_object('label', 'Trying for', 'value', coalesce(v_trying, '—'))
    ),
    'bbt', v_bbt,
    'flag', case when cardinality(v_flags) > 0 then 'Discuss: ' || array_to_string(v_flags, '; ') || '.' end,
    'cycles', v_picked,
    'tests', jsonb_build_object(
      'lh', coalesce((select jsonb_agg(jsonb_build_object('date', to_char(logged_on, 'YYYY-MM-DD'), 'result', value) order by logged_on)
                      from public.user_daily_logs where user_id = v_user and kind = 'lh_test' and logged_on >= v_from), '[]'::jsonb),
      'pregnancy', coalesce((select jsonb_agg(jsonb_build_object('date', to_char(logged_on, 'YYYY-MM-DD'), 'result', value,
                                                               'type', payload ->> 'testType') order by logged_on)
                             from public.user_daily_logs where user_id = v_user and kind = 'pregnancy_test' and logged_on >= v_from), '[]'::jsonb)
    ),
    'fluid', coalesce((select jsonb_agg(jsonb_build_object('date', to_char(logged_on, 'YYYY-MM-DD'), 'type', value) order by logged_on)
                       from public.user_daily_logs where user_id = v_user and kind = 'cervical_fluid' and logged_on >= v_from), '[]'::jsonb),
    'symptoms', coalesce((
      select jsonb_agg(jsonb_build_object('label', upper(left(sym, 1)) || substr(replace(sym, '_', ' '), 2), 'days', n) order by n desc, sym)
      from (select sym, count(*) as n
            from public.user_daily_logs l, jsonb_array_elements_text(l.payload -> 'symptoms') sym
            where l.user_id = v_user and l.kind = 'symptom' and l.logged_on >= v_from
            group by sym) s
    ), '[]'::jsonb),
    'intimacy', coalesce((select jsonb_agg(to_char(logged_on, 'YYYY-MM-DD') order by logged_on)
                          from public.user_daily_logs where user_id = v_user and kind = 'intimacy' and value = 'yes' and logged_on >= v_from), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(logged_on, 'YYYY-MM-DD'), 'text', txt) order by logged_on)
      from (
        select logged_on, coalesce(payload ->> 'text', payload ->> 'journal', payload ->> 'note') as txt
        from public.user_daily_logs
        where user_id = v_user and kind in ('note', 'mood') and logged_on >= v_from
      ) n where txt is not null
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.app_report(text, date) from public, anon;
grant execute on function public.app_report(text, date) to authenticated;
