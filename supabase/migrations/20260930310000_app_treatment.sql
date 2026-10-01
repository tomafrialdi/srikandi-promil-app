-- My treatment (mobile): the user's own IUI / IVF / medicated-cycle program with its
-- schedule, next appointment and lab results. Tables have RLS on and no policies, so the
-- app can only reach them through the app_treatment_* RPCs below, and each RPC only sees
-- the caller's own rows.

create table public.user_treatment_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  treatment_type text not null check (treatment_type in ('iui', 'ivf', 'medicated')),
  cycle_no integer not null default 1 check (cycle_no between 1 and 50),
  protocol text check (char_length(protocol) <= 60),
  doctor_name text check (char_length(doctor_name) <= 80),
  started_on date not null,
  stage_index integer not null default 0 check (stage_index between 0 and 5),
  status text not null default 'active' check (status in ('active', 'ended')),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index user_treatment_programs_one_active_idx
  on public.user_treatment_programs (user_id) where status = 'active';

create table public.user_treatment_items (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.user_treatment_programs (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 120),
  kind text not null check (kind in ('medication', 'event')),
  tag text check (char_length(tag) <= 30),
  created_at timestamptz not null default now()
);
create index user_treatment_items_program_idx on public.user_treatment_items (program_id, created_at);

create table public.user_treatment_intake (
  item_id uuid not null references public.user_treatment_items (id) on delete cascade,
  taken_on date not null,
  primary key (item_id, taken_on)
);

create table public.user_treatment_appointments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.user_treatment_programs (id) on delete cascade,
  starts_at timestamptz not null,
  title text not null check (char_length(title) between 1 and 80),
  place text not null default '' check (char_length(place) <= 120)
);
create index user_treatment_appointments_program_idx on public.user_treatment_appointments (program_id, starts_at);

create table public.user_treatment_labs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.user_treatment_programs (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  value text not null check (char_length(value) between 1 and 60),
  status_label text not null check (char_length(status_label) between 1 and 30),
  tone text not null check (tone in ('success', 'warning', 'error', 'info', 'neutral')),
  created_at timestamptz not null default now()
);
create index user_treatment_labs_program_idx on public.user_treatment_labs (program_id, created_at);

alter table public.user_treatment_programs enable row level security;
alter table public.user_treatment_items enable row level security;
alter table public.user_treatment_intake enable row level security;
alter table public.user_treatment_appointments enable row level security;
alter table public.user_treatment_labs enable row level security;

-- ── Helpers (schema not exposed through the API) ─────────────────────────────

create function analytics_private.current_app_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select id into v_id from public.app_users where auth_user_id = (select auth.uid());
  if v_id is null then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;
  return v_id;
end;
$$;

create function analytics_private.treatment_stages(p_type text)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'iui' then '[{"id":"stimulation","label":"Stimulation"},{"id":"trigger","label":"Trigger"},{"id":"iui","label":"IUI"},{"id":"wait","label":"2-week wait"}]'
    when 'ivf' then '[{"id":"stimulation","label":"Stimulation"},{"id":"trigger","label":"Trigger"},{"id":"retrieval","label":"Retrieval"},{"id":"transfer","label":"Transfer"},{"id":"wait","label":"2-week wait"}]'
    else '[{"id":"medication","label":"Medication"},{"id":"monitoring","label":"Monitoring"},{"id":"timing","label":"Timed intercourse"},{"id":"wait","label":"2-week wait"}]'
  end::jsonb;
$$;

-- The caller's active program, or an error the app shows as "start a program first".
create function analytics_private.active_program()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.user_treatment_programs
  where user_id = analytics_private.current_app_user() and status = 'active';
  if v_id is null then
    raise exception 'no active treatment program' using errcode = 'P0002';
  end if;
  return v_id;
end;
$$;

revoke execute on function analytics_private.current_app_user() from public, anon, authenticated;
revoke execute on function analytics_private.treatment_stages(text) from public, anon, authenticated;
revoke execute on function analytics_private.active_program() from public, anon, authenticated;

-- ── Read ─────────────────────────────────────────────────────────────────────
-- p_today is the user's local date (the phone knows the time zone; the server does not).

create function public.app_treatment_get(p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  p public.user_treatment_programs;
begin
  select * into p from public.user_treatment_programs where user_id = v_user and status = 'active';
  if not found then
    return jsonb_build_object('program', null, 'schedule', '[]'::jsonb, 'appointment', null, 'labs', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'program', jsonb_build_object(
      'id', p.id,
      'type', p.treatment_type,
      'title', case p.treatment_type when 'iui' then 'IUI' when 'ivf' then 'IVF' else 'Medicated cycle' end
               || ' · Cycle ' || p.cycle_no,
      'subtitle', coalesce(nullif(concat_ws(' · ',
        case when p.protocol is not null then p.protocol || ' protocol' end, p.doctor_name), ''), 'No protocol details yet'),
      'dayLabel', 'Day ' || greatest(1, p_today - p.started_on + 1),
      'stages', analytics_private.treatment_stages(p.treatment_type),
      'currentStageIndex', least(p.stage_index, jsonb_array_length(analytics_private.treatment_stages(p.treatment_type)) - 1)
    ),
    'schedule', coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', i.id, 'title', i.title, 'description', i.description, 'kind', i.kind, 'tag', i.tag,
        'done', case when i.kind = 'medication'
                  then exists (select 1 from public.user_treatment_intake t where t.item_id = i.id and t.taken_on = p_today) end
      )) order by i.created_at)
      from public.user_treatment_items i where i.program_id = p.id
    ), '[]'::jsonb),
    'appointment', (
      select jsonb_build_object(
        'id', a.id, 'title', a.title, 'place', a.place,
        'startsAt', to_char(a.starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      from public.user_treatment_appointments a
      where a.program_id = p.id and a.starts_at >= now() - interval '2 hours'
      order by a.starts_at limit 1
    ),
    'labs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'label', l.label, 'value', l.value,
        'status', jsonb_build_object('label', l.status_label, 'tone', l.tone)) order by l.created_at)
      from public.user_treatment_labs l where l.program_id = p.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ── Program ──────────────────────────────────────────────────────────────────

-- Starting a program ends the active one. IUI/IVF also sets the tracking mode and journey stage.
create function public.app_treatment_start(
  p_type text,
  p_protocol text,
  p_doctor text,
  p_started_on date,
  p_cycle_no integer default 1
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_protocol text := nullif(trim(coalesce(p_protocol, '')), '');
  v_doctor text := nullif(trim(coalesce(p_doctor, '')), '');
begin
  if p_type is null or p_type not in ('iui', 'ivf', 'medicated')
     or p_started_on is null
     or p_started_on > current_date + 1 or p_started_on < current_date - 365
     or p_cycle_no is null or p_cycle_no not between 1 and 50
     or char_length(coalesce(v_protocol, '')) > 60
     or char_length(coalesce(v_doctor, '')) > 80
  then
    raise exception 'invalid treatment program' using errcode = '22023';
  end if;

  update public.user_treatment_programs
    set status = 'ended', ended_at = now()
  where user_id = v_user and status = 'active';

  insert into public.user_treatment_programs (user_id, treatment_type, cycle_no, protocol, doctor_name, started_on)
  values (v_user, p_type, p_cycle_no, v_protocol, v_doctor, p_started_on);

  update public.app_users set
    tracking_mode = case p_type when 'ivf' then 'ivf'::public.tracking_mode else 'iui'::public.tracking_mode end,
    journey_stage = case
      when journey_stage in ('getting_started', 'trying', 'in_treatment', 'after_loss')
        then 'in_treatment'::public.journey_stage
      else journey_stage
    end
  where id = v_user;
end;
$$;

create function public.app_treatment_end()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_treatment_programs
    set status = 'ended', ended_at = now()
  where id = analytics_private.active_program();
end;
$$;

create function public.app_treatment_set_stage(p_stage integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := analytics_private.active_program();
  v_type text;
begin
  select treatment_type into v_type from public.user_treatment_programs where id = v_id;
  if p_stage is null or p_stage < 0 or p_stage >= jsonb_array_length(analytics_private.treatment_stages(v_type)) then
    raise exception 'invalid stage' using errcode = '22023';
  end if;
  update public.user_treatment_programs set stage_index = p_stage where id = v_id;
end;
$$;

-- ── Schedule ─────────────────────────────────────────────────────────────────

create function public.app_treatment_add_item(p_title text, p_description text, p_kind text, p_tag text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program uuid := analytics_private.active_program();
  v_title text := trim(coalesce(p_title, ''));
begin
  if char_length(v_title) not between 1 and 80
     or char_length(coalesce(p_description, '')) > 120
     or p_kind is null or p_kind not in ('medication', 'event')
     or char_length(coalesce(p_tag, '')) > 30
     or (select count(*) from public.user_treatment_items where program_id = v_program) >= 50
  then
    raise exception 'invalid schedule item' using errcode = '22023';
  end if;
  insert into public.user_treatment_items (program_id, title, description, kind, tag)
  values (v_program, v_title, trim(coalesce(p_description, '')), p_kind, nullif(trim(coalesce(p_tag, '')), ''));
end;
$$;

create function public.app_treatment_delete_item(p_item uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_treatment_items
  where id = p_item and program_id = analytics_private.active_program();
end;
$$;

create function public.app_treatment_set_done(p_item uuid, p_done boolean, p_today date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_done is null or p_today is null then
    raise exception 'invalid input' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_treatment_items
    where id = p_item and kind = 'medication' and program_id = analytics_private.active_program()
  ) then
    raise exception 'medication not found' using errcode = 'P0002';
  end if;
  if p_done then
    insert into public.user_treatment_intake (item_id, taken_on) values (p_item, p_today) on conflict do nothing;
  else
    delete from public.user_treatment_intake where item_id = p_item and taken_on = p_today;
  end if;
end;
$$;

-- ── Appointment & labs ───────────────────────────────────────────────────────

create function public.app_treatment_set_appointment(p_starts_at timestamptz, p_title text, p_place text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program uuid := analytics_private.active_program();
  v_title text := trim(coalesce(p_title, ''));
begin
  if p_starts_at is null or char_length(v_title) not between 1 and 80 or char_length(coalesce(p_place, '')) > 120 then
    raise exception 'invalid appointment' using errcode = '22023';
  end if;
  -- The screen shows one "next appointment": replace the upcoming one.
  delete from public.user_treatment_appointments where program_id = v_program and starts_at >= now() - interval '2 hours';
  insert into public.user_treatment_appointments (program_id, starts_at, title, place)
  values (v_program, p_starts_at, v_title, trim(coalesce(p_place, '')));
end;
$$;

create function public.app_treatment_clear_appointment()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_treatment_appointments
  where program_id = analytics_private.active_program() and starts_at >= now() - interval '2 hours';
end;
$$;

create function public.app_treatment_add_lab(p_label text, p_value text, p_status_label text, p_tone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program uuid := analytics_private.active_program();
  v_label text := trim(coalesce(p_label, ''));
  v_value text := trim(coalesce(p_value, ''));
  v_status text := trim(coalesce(p_status_label, ''));
begin
  if char_length(v_label) not between 1 and 60 or char_length(v_value) not between 1 and 60
     or char_length(v_status) not between 1 and 30
     or p_tone is null or p_tone not in ('success', 'warning', 'error', 'info', 'neutral')
     or (select count(*) from public.user_treatment_labs where program_id = v_program) >= 50
  then
    raise exception 'invalid lab result' using errcode = '22023';
  end if;
  insert into public.user_treatment_labs (program_id, label, value, status_label, tone)
  values (v_program, v_label, v_value, v_status, p_tone);
end;
$$;

create function public.app_treatment_delete_lab(p_lab uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_treatment_labs
  where id = p_lab and program_id = analytics_private.active_program();
end;
$$;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'app\_treatment\_%'
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;
