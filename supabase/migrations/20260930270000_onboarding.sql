-- Mobile onboarding answers, saved once the account's email is verified.
-- app_users stays read-only for clients; the app writes through app_complete_onboarding().

alter table public.app_users
  add column birth_date date,
  add column height_cm integer check (height_cm between 100 and 250),
  add column weight_kg numeric(5, 1) check (weight_kg between 30 and 200),
  add column cycle_length_days integer check (cycle_length_days between 15 and 60),
  add column cycle_regularity text check (cycle_regularity in ('regular', 'irregular', 'not_sure')),
  add column trying_duration text
    check (trying_duration in ('lt_6_months', '6_12_months', '1_2_years', '2_plus_years')),
  add column conditions text[] not null default '{}';

create function public.app_complete_onboarding(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_user uuid;
  v_name text := nullif(trim(p_payload ->> 'fullName'), '');
  v_birth date;
  v_height integer;
  v_weight numeric;
  v_cycle_len integer;
  v_last_period date;
  v_regularity text := p_payload ->> 'cycleRegularity';
  v_trying text := p_payload ->> 'tryingDuration';
  v_conditions text[];
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  select id into v_user from public.app_users where auth_user_id = v_uid;
  if v_user is null then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;

  begin
    v_birth := (p_payload ->> 'birthDate')::date;
    v_height := (p_payload ->> 'heightCm')::numeric::integer;
    v_weight := (p_payload ->> 'weightKg')::numeric;
    v_cycle_len := (p_payload ->> 'cycleLengthDays')::numeric::integer;
    v_last_period := (p_payload ->> 'lastPeriodDate')::date;
    v_conditions := coalesce(
      array(select jsonb_array_elements_text(
        case when jsonb_typeof(p_payload -> 'conditions') = 'array'
             then p_payload -> 'conditions' else '[]'::jsonb end)),
      '{}'
    );
  exception when others then
    raise exception 'invalid onboarding answers' using errcode = '22023';
  end;

  if v_name is null or char_length(v_name) > 80
     or v_birth is null or v_birth > current_date - interval '18 years' or v_birth < date '1900-01-01'
     or v_height not between 100 and 250
     or v_weight not between 30 and 200
     or v_cycle_len not between 15 and 60
     or v_last_period is null or v_last_period > current_date
     or v_last_period < current_date - 730
     or v_regularity not in ('regular', 'irregular', 'not_sure')
     or v_trying not in ('lt_6_months', '6_12_months', '1_2_years', '2_plus_years')
     or not (v_conditions <@ array['pcos', 'endometriosis', 'thyroid', 'not_sure'])
  then
    raise exception 'invalid onboarding answers' using errcode = '22023';
  end if;

  update public.app_users set
    full_name = v_name,
    birth_date = v_birth,
    birth_year = extract(year from v_birth)::integer,
    height_cm = v_height,
    weight_kg = v_weight,
    cycle_length_days = v_cycle_len,
    cycle_regularity = v_regularity,
    trying_duration = v_trying,
    conditions = v_conditions,
    journey_stage = 'trying',
    cycles_tracked = greatest(cycles_tracked, 1),
    onboarded_at = coalesce(onboarded_at, now()),
    first_cycle_at = coalesce(first_cycle_at, now())
  where id = v_user;

  -- The cycle that is currently running; closed by the app when the next period starts.
  insert into public.user_cycles (user_id, cycle_no, start_date)
  values (v_user, 1, v_last_period)
  on conflict (user_id, cycle_no) do update set start_date = excluded.start_date;
end;
$$;

revoke execute on function public.app_complete_onboarding(jsonb) from public, anon;
grant execute on function public.app_complete_onboarding(jsonb) to authenticated;
