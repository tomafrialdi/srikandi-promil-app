-- Account settings written by the mobile app: personal info, cycle preferences, units.
-- Clients can only read their own app_users row, so every write goes through an RPC
-- that validates the input and touches nothing but the caller's own row.

alter table public.app_users
  add column period_length_days integer not null default 5
    check (period_length_days between 1 and 14),
  add column luteal_phase_days integer not null default 14
    check (luteal_phase_days between 8 and 20),
  add column unit_weight text not null default 'kg' check (unit_weight in ('kg', 'lbs')),
  add column unit_height text not null default 'cm' check (unit_height in ('cm', 'in')),
  add column unit_temperature text not null default 'c' check (unit_temperature in ('c', 'f'));

-- Email is the account identity (changing it needs re-verification), so it is not editable here.
create function public.app_update_profile(
  p_name text,
  p_birth_date date,
  p_height_cm integer,
  p_weight_kg numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text := nullif(trim(p_name), '');
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if v_name is null or char_length(v_name) > 80
     or p_birth_date is null
     or p_birth_date > current_date - interval '18 years'
     or p_birth_date < date '1900-01-01'
     or p_height_cm is null or p_height_cm not between 100 and 250
     or p_weight_kg is null or p_weight_kg not between 30 and 200
  then
    raise exception 'invalid profile' using errcode = '22023';
  end if;

  update public.app_users set
    full_name = v_name,
    birth_date = p_birth_date,
    birth_year = extract(year from p_birth_date)::integer,
    height_cm = p_height_cm,
    weight_kg = p_weight_kg
  where auth_user_id = v_uid;

  if not found then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;
end;
$$;

create function public.app_update_cycle_preferences(
  p_cycle_length integer,
  p_period_length integer,
  p_luteal_phase integer,
  p_regularity text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_cycle_length is null or p_cycle_length not between 15 and 60
     or p_period_length is null or p_period_length not between 1 and 14
     or p_luteal_phase is null or p_luteal_phase not between 8 and 20
     or p_regularity is null or p_regularity not in ('regular', 'irregular', 'not_sure')
     or p_period_length >= p_cycle_length
  then
    raise exception 'invalid cycle preferences' using errcode = '22023';
  end if;

  update public.app_users set
    cycle_length_days = p_cycle_length,
    period_length_days = p_period_length,
    luteal_phase_days = p_luteal_phase,
    cycle_regularity = p_regularity
  where auth_user_id = v_uid;

  if not found then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;
end;
$$;

create function public.app_update_units(
  p_weight text,
  p_height text,
  p_temperature text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_weight is null or p_weight not in ('kg', 'lbs')
     or p_height is null or p_height not in ('cm', 'in')
     or p_temperature is null or p_temperature not in ('c', 'f')
  then
    raise exception 'invalid units' using errcode = '22023';
  end if;

  update public.app_users set
    unit_weight = p_weight,
    unit_height = p_height,
    unit_temperature = p_temperature
  where auth_user_id = v_uid;

  if not found then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.app_update_profile(text, date, integer, numeric) from public, anon;
revoke execute on function public.app_update_cycle_preferences(integer, integer, integer, text) from public, anon;
revoke execute on function public.app_update_units(text, text, text) from public, anon;
grant execute on function public.app_update_profile(text, date, integer, numeric) to authenticated;
grant execute on function public.app_update_cycle_preferences(integer, integer, integer, text) to authenticated;
grant execute on function public.app_update_units(text, text, text) to authenticated;
