-- Daily logs from the mobile app: temperature, mood, symptoms, cervical fluid, LH test,
-- intimacy, pregnancy test (+ period flow and free-text notes from "New note").
-- One row per (user, kind, day); saving again that day replaces it. RLS on, no policies:
-- the app goes through app_log_save / app_logs_today, the console through admin_user_logs
-- (which needs a reason and is audited, like every other health-data view).

create table public.user_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null check (kind in (
    'temperature', 'mood', 'symptom', 'cervical_fluid', 'lh_test', 'intimacy', 'pregnancy_test', 'flow', 'note')),
  logged_on date not null,
  value text check (char_length(value) <= 40),
  number_value numeric(5, 2),
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 4096),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, logged_on)
);
create index user_daily_logs_user_day_idx on public.user_daily_logs (user_id, logged_on desc);

create trigger user_daily_logs_set_updated_at
  before update on public.user_daily_logs
  for each row execute function public.set_updated_at();

alter table public.user_daily_logs enable row level security;

-- ── Save ─────────────────────────────────────────────────────────────────────

create function public.app_log_save(
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

-- ── Today ────────────────────────────────────────────────────────────────────
-- What the log sheets prefill from, plus the last 7 days of intimacy. p_today is the phone's date.

create function public.app_logs_today(p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
begin
  return jsonb_build_object(
    'loggedKinds', coalesce((
      select jsonb_agg(replace(kind, '_', '-') order by kind)
      from public.user_daily_logs
      where user_id = v_user and logged_on = p_today
        and kind in ('temperature', 'mood', 'symptom', 'cervical_fluid', 'lh_test', 'intimacy', 'pregnancy_test')
    ), '[]'::jsonb),
    'mood', (select jsonb_build_object('moodId', value, 'note', payload ->> 'note')
             from public.user_daily_logs where user_id = v_user and kind = 'mood' and logged_on = p_today),
    'symptomIds', coalesce((select payload -> 'symptoms' from public.user_daily_logs
                            where user_id = v_user and kind = 'symptom' and logged_on = p_today), '[]'::jsonb),
    'temperature', (select jsonb_build_object('celsius', number_value, 'timeOfDay', value)
                    from public.user_daily_logs where user_id = v_user and kind = 'temperature' and logged_on = p_today),
    'intimacyDays', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(p_today - 6 + g.i, 'YYYY-MM-DD'), 'had', coalesce(l.value = 'yes', false)) order by g.i)
      from generate_series(0, 6) as g(i)
      left join public.user_daily_logs l
        on l.user_id = v_user and l.kind = 'intimacy' and l.logged_on = p_today - 6 + g.i
    ), '[]'::jsonb)
  );
end;
$$;

-- ── Console (health data: reason required, audited) ──────────────────────────

create function public.admin_user_logs(p_user uuid, p_reason text, p_days integer default 60)
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
          'mood_note', max(payload ->> 'note') filter (where kind = 'mood'),
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

revoke execute on function public.app_log_save(text, date, text, numeric, jsonb) from public, anon;
revoke execute on function public.app_logs_today(date) from public, anon;
revoke execute on function public.admin_user_logs(uuid, text, integer) from public, anon;
grant execute on function public.app_log_save(text, date, text, numeric, jsonb) to authenticated;
grant execute on function public.app_logs_today(date) to authenticated;
grant execute on function public.admin_user_logs(uuid, text, integer) to authenticated;
