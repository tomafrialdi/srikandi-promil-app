-- Doctors: summary, list, one doctor, options, create, update, status, STR verification queue, sessions, activity.

create function public.admin_doctors_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  return jsonb_build_object(
    'listed', (select count(*) from public.doctors where status = 'active' and listed),
    'clinics', (select count(distinct coalesce(l.clinic_id::text, l.label)) from public.doctor_locations l join public.doctors d on d.id = l.doctor_id
                where d.status = 'active' and l.kind <> 'virtual'),
    'str_verified', (select count(*) from public.doctors where str_status = 'verified'),
    'str_pending', (select count(*) from public.doctors where str_status = 'pending' and status <> 'draft'),
    'tele_active', (select count(distinct doctor_id) from public.doctor_services where active and kind in ('tele_video', 'tele_chat')),
    'tele_new_month', (select count(distinct s.doctor_id) from public.doctor_services s join public.doctors d on d.id = s.doctor_id
                       where s.active and s.kind in ('tele_video', 'tele_chat') and d.created_at >= date_trunc('month', now())),
    'avg_rating', (select round(avg(rating), 1) from public.doctors where status = 'active'),
    'reviews', (select coalesce(sum(reviews_count), 0) from public.doctors),
    'counts', (select coalesce(jsonb_object_agg(g, n), '{}'::jsonb) from (select specialty_group as g, count(*) as n from public.doctors group by 1) x),
    'total', (select count(*) from public.doctors),
    'can_edit', analytics_private.console_role() in ('super_admin', 'admin'),
    'can_verify', analytics_private.console_role() in ('super_admin', 'admin', 'medical_reviewer')
  );
end;
$$;

create function public.admin_doctors_list(
  p_group text default null, p_search text default null, p_status text default null, p_limit integer default 12, p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_rows jsonb;
  v_total integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  with f as (
    select d.* from public.doctors d
    where (nullif(p_group, '') is null or d.specialty_group = p_group)
      and (nullif(p_status, '') is null or d.status = p_status)
      and (v_search is null or d.name ilike '%' || v_search || '%' or replace(coalesce(d.str_number, ''), ' ', '') like '%' || replace(v_search, ' ', '') || '%')
  ), page as (
    select * from f order by (status = 'active') desc, rating desc, name limit least(greatest(coalesce(p_limit, 12), 1), 200) offset greatest(coalesce(p_offset, 0), 0)
  )
  select (select count(*) from f), coalesce((select jsonb_agg(jsonb_build_object(
    'id', g.id, 'name', g.name, 'specialty', g.specialty, 'group', g.specialty_group, 'photo_url', g.photo_url,
    'status', g.status, 'str_status', g.str_status, 'rating', g.rating, 'bpjs', g.accepts_bpjs,
    'location', coalesce((select l.label || case when g.city <> '' then ' · ' || g.city else '' end from public.doctor_locations l where l.doctor_id = g.id and l.kind = 'primary'),
                         case when exists (select 1 from public.doctor_locations l where l.doctor_id = g.id and l.kind = 'virtual') then 'Teleconsult only' end),
    'tele', exists (select 1 from public.doctor_services s where s.doctor_id = g.id and s.active and s.kind in ('tele_video', 'tele_chat')),
    'price', (select s.price_idr from public.doctor_services s where s.doctor_id = g.id and s.active order by (s.kind = 'clinic_first') desc, s.price_idr desc limit 1)
  ) order by (g.status = 'active') desc, g.rating desc, g.name) from page g), '[]'::jsonb)
  into v_total, v_rows;
  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

create function public.admin_doctors_options()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  return jsonb_build_object(
    'specialties', analytics_private.doctor_specialties(),
    'clinics', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'city', city, 'address', address) order by name), '[]'::jsonb) from public.clinics),
    'focus', jsonb_build_array('Infertility', 'PCOS', 'IUI / IVF', 'Recurrent loss', 'Male factor', 'Endometriosis'),
    'languages', jsonb_build_array('Bahasa Indonesia', 'English', 'Jawa', 'Sunda')
  );
end;
$$;

create function analytics_private.doctor_json(d public.doctors)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', d.id, 'title', d.title, 'full_name', d.full_name, 'degree', d.degree, 'name', d.name, 'group', d.specialty_group, 'specialty', d.specialty,
    'years', d.years_experience, 'focus', to_jsonb(d.focus), 'bio', d.bio, 'photo_url', d.photo_url,
    'status', d.status, 'status_reason', d.status_reason, 'listed', d.listed, 'accepting', d.accepting,
    'roles', jsonb_build_object('medical_reviewer', d.role_medical_reviewer, 'engine_signoff', d.role_engine_signoff,
                                'community_expert', d.role_community_expert, 'public_advisor', d.role_public_advisor),
    'str', jsonb_build_object('number', d.str_number, 'valid_until', d.str_valid_until, 'status', d.str_status, 'verified_at', d.str_verified_at),
    'sip', jsonb_build_object('number', d.sip_number, 'valid_until', d.sip_valid_until),
    'cert', jsonb_build_object('label', d.cert_label, 'verified_at', d.cert_verified_at),
    'languages', to_jsonb(d.languages), 'bpjs', d.accepts_bpjs, 'rating', d.rating, 'reviews', d.reviews_count,
    'booking', d.booking, 'fee', jsonb_build_object('pct', d.fee_pct, 'paid_by', d.fee_paid_by, 'payout_schedule', d.payout_schedule),
    'bank', d.bank, 'discounts', d.discounts, 'stats', d.stats, 'portal_email', d.portal_email,
    'updated_at', d.updated_at, 'updated_by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = d.updated_by),
    'locations', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'clinic_id', l.clinic_id, 'kind', l.kind, 'label', l.label, 'address', l.address, 'sip_number', l.sip_number)
                                            order by l.sort_order, l.label) from public.doctor_locations l where l.doctor_id = d.id), '[]'::jsonb),
    'slots', coalesce((select jsonb_agg(jsonb_build_object('location_id', s.location_id, 'weekday', s.weekday, 'start', to_char(s.starts, 'HH24:MI'), 'end', to_char(s.ends, 'HH24:MI'))
                                        order by s.weekday, s.starts) from public.doctor_slots s where s.doctor_id = d.id), '[]'::jsonb),
    'time_off', coalesce((select jsonb_agg(jsonb_build_object('from', t.from_date, 'to', t.to_date, 'reason', t.reason, 'note', t.note, 'is_auto', t.is_auto)
                                           order by t.from_date) from public.doctor_time_off t where t.doctor_id = d.id), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(jsonb_build_object('kind', s.kind, 'price_idr', s.price_idr, 'bpjs', s.bpjs, 'active', s.active)) from public.doctor_services s where s.doctor_id = d.id), '[]'::jsonb),
    'permissions', coalesce((select jsonb_agg(jsonb_build_object('area', p.area, 'view', p.can_view, 'review', p.can_review, 'approve', p.can_approve, 'publish', p.can_publish)) from public.doctor_permissions p where p.doctor_id = d.id), '[]'::jsonb)
  )
$$;

create function analytics_private.doctor_sessions_json(p_admin uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'user_agent', s.user_agent, 'ip', host(s.ip),
    'last_seen_at', coalesce(s.refreshed_at, s.updated_at, s.created_at), 'current', s.id::text = (select auth.jwt() ->> 'session_id'))
    order by coalesce(s.refreshed_at, s.updated_at, s.created_at) desc), '[]'::jsonb)
  from auth.sessions s where s.user_id = p_admin and (s.not_after is null or s.not_after > now())
$$;

create function public.admin_doctors_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d public.doctors;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  select * into d from public.doctors where id = p_id;
  if not found then
    raise exception 'doctor not found' using errcode = 'P0002';
  end if;
  return analytics_private.doctor_json(d) || jsonb_build_object(
    'security', jsonb_build_object(
      'tfa', case when d.admin_id is null then null else analytics_private.member_tfa(d.admin_id) end,
      'last_login', case when d.admin_id is null then null else analytics_private.admin_last_seen(d.admin_id) end,
      'sessions', case when d.admin_id is null then '[]'::jsonb else analytics_private.doctor_sessions_json(d.admin_id) end
    ),
    'activity_counts', (select coalesce(jsonb_object_agg(category, n), '{}'::jsonb) from (select category, count(*) as n from public.doctor_activity where doctor_id = p_id group by 1) x)
  );
end;
$$;

create function public.admin_doctors_activity(p_id uuid, p_category text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'category', a.category, 'icon', a.icon, 'tone', a.tone, 'title', a.title, 'detail', a.detail, 'at', a.created_at) order by a.created_at desc, a.id desc)
    from (select * from public.doctor_activity where doctor_id = p_id and (nullif(p_category, '') is null or category = p_category) order by created_at desc, id desc limit 200) a
  ), '[]'::jsonb);
end;
$$;

-- ── create ──────────────────────────────────────────────────────────────────

create function public.admin_doctors_create(p_payload jsonb, p_draft boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p jsonb := p_payload;
  v_full text := trim(coalesce(p ->> 'full_name', ''));
  v_group text := coalesce(p ->> 'specialty_group', '');
  v_sub text;
  v_str text := nullif(regexp_replace(coalesce(p ->> 'str_number', ''), '\s+', ' ', 'g'), '');
  v_clinic public.clinics;
  v_id uuid;
  v_loc uuid;
  v_focus text[];
  v_langs text[];
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_edit();
  if char_length(v_full) < 2 then
    raise exception 'enter the full name' using errcode = '22023';
  end if;
  select x ->> 'subtitle' into v_sub from jsonb_array_elements(analytics_private.doctor_specialties()) x where x ->> 'group' = v_group;
  if v_sub is null then
    raise exception 'pick a specialty' using errcode = '22023';
  end if;
  select coalesce(array_agg(f), '{}') into v_focus from jsonb_array_elements_text(coalesce(p -> 'focus', '[]'::jsonb)) f;
  select coalesce(array_agg(l), array['Bahasa Indonesia']) into v_langs from jsonb_array_elements_text(coalesce(p -> 'languages', '["Bahasa Indonesia"]'::jsonb)) l;
  if not p_draft then
    if v_str is null then
      raise exception 'the STR number is required' using errcode = '22023';
    end if;
    if nullif(p ->> 'clinic_id', '') is null and coalesce((p ->> 'clinic_fee')::int, 0) > 0 then
      raise exception 'pick the primary practice location' using errcode = '22023';
    end if;
  end if;
  if v_str is not null and exists (select 1 from public.doctors where replace(str_number, ' ', '') = replace(v_str, ' ', '')) then
    raise exception 'a doctor with this STR number already exists' using errcode = '23505';
  end if;
  if nullif(p ->> 'clinic_id', '') is not null then
    select * into v_clinic from public.clinics where id = (p ->> 'clinic_id')::uuid;
    if not found then
      raise exception 'that clinic does not exist' using errcode = '22023';
    end if;
  end if;

  begin
    insert into public.doctors (
      name, title, full_name, degree, specialty_group, specialty, years_experience, focus, photo_url, clinic_name, city, rating,
      str_number, sip_number, sip_valid_until, languages, accepts_bpjs, status, listed,
      role_medical_reviewer, role_engine_signoff, role_community_expert, updated_by
    ) values (
      analytics_private.doctor_display_name(coalesce(p ->> 'title', 'dr.'), v_full, p ->> 'degree'), coalesce(p ->> 'title', 'dr.'), v_full,
      nullif(trim(coalesce(p ->> 'degree', '')), ''), v_group, v_sub, nullif(p ->> 'years_experience', '')::int, v_focus, nullif(p ->> 'photo_url', ''),
      coalesce(v_clinic.name, ''), coalesce(v_clinic.city, ''), 0,
      v_str, nullif(trim(coalesce(p ->> 'sip_number', '')), ''), nullif(p ->> 'sip_valid_until', '')::date, v_langs,
      coalesce((p ->> 'accepts_bpjs')::boolean, false), case when p_draft then 'draft' else 'pending' end, coalesce((p ->> 'listed')::boolean, true),
      coalesce((p ->> 'medical_reviewer')::boolean, false), coalesce((p ->> 'engine_signoff')::boolean, false), coalesce((p ->> 'community_expert')::boolean, false),
      (select auth.uid())
    ) returning id into v_id;
  exception
    when check_violation or invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
      raise exception 'a field is not valid (check the STR number, years and dates)' using errcode = '22023';
  end;

  if v_clinic.id is not null then
    insert into public.doctor_locations (doctor_id, clinic_id, kind, label, address, sip_number, sort_order)
    values (v_id, v_clinic.id, 'primary', v_clinic.name, v_clinic.address, nullif(trim(coalesce(p ->> 'sip_number', '')), ''), 0);
    update public.doctors set accepts_bpjs = accepts_bpjs where id = v_id;
  end if;
  if coalesce((p ->> 'tele_fee')::int, 0) > 0 then
    insert into public.doctor_locations (doctor_id, kind, label, address, sort_order) values (v_id, 'virtual', 'Teleconsult (in-app)', 'Video & chat · Indonesia-wide', 9);
  end if;
  insert into public.doctor_services (doctor_id, kind, price_idr, active, bpjs)
  select v_id, s.kind, s.price, s.price > 0 and s.on_, false
  from (values ('clinic_first', coalesce((p ->> 'clinic_fee')::int, 0), v_clinic.id is not null), ('tele_video', coalesce((p ->> 'tele_fee')::int, 0), true),
               ('clinic_followup', 0, false), ('tele_chat', 0, false), ('report_review', 0, false), ('second_opinion', 0, false)) as s(kind, price, on_);
  insert into public.doctor_permissions (doctor_id, area, can_view)
  select v_id, a, true from unnest(array['articles', 'medications', 'engine', 'community', 'notifications', 'clinic_verification']) a;

  perform analytics_private.doctor_write_activity(v_id, 'profile', 'user-plus', 'info', 'Doctor added by ' || (select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid())) || ' (admin)',
    case when p_draft then 'Saved as draft' else 'Waiting for STR verification' end);
  perform analytics_private.write_audit('doctor.create', v_id::text, jsonb_build_object('summary', 'Added doctor ' || analytics_private.doctor_display_name(coalesce(p ->> 'title', 'dr.'), v_full, p ->> 'degree')));
  return v_id;
end;
$$;

-- ── update (one transaction for all tabs of the edit modal) ─────────────────

create function public.admin_doctors_update(p_id uuid, p_patch jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.doctors;
  x jsonb;
  v_map jsonb := '{}'::jsonb;
  v_real uuid;
  v_kept uuid[] := '{}';
  v_sections text[] := '{}';
  v_title text;
  v_full text;
  v_degree text;
  v_group text;
  v_sub text;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_edit();
  select * into d from public.doctors where id = p_id for update;
  if not found then
    raise exception 'doctor not found' using errcode = 'P0002';
  end if;

  if p_patch ? 'profile' then
    x := p_patch -> 'profile';
    v_title := coalesce(x ->> 'title', d.title);
    v_full := trim(coalesce(x ->> 'full_name', d.full_name));
    v_degree := nullif(trim(coalesce(x ->> 'degree', d.degree, '')), '');
    v_group := coalesce(x ->> 'specialty_group', d.specialty_group);
    if char_length(v_full) < 2 then
      raise exception 'enter the full name' using errcode = '22023';
    end if;
    select y ->> 'subtitle' into v_sub from jsonb_array_elements(analytics_private.doctor_specialties()) y where y ->> 'group' = v_group;
    if v_sub is null then
      raise exception 'pick a specialty' using errcode = '22023';
    end if;
    begin
      update public.doctors set
        title = v_title, full_name = v_full, degree = v_degree, specialty_group = v_group,
        specialty = case when v_group = d.specialty_group then d.specialty else v_sub end,
        name = analytics_private.doctor_display_name(v_title, v_full, v_degree),
        years_experience = nullif(x ->> 'years_experience', '')::int,
        focus = coalesce((select array_agg(f) from jsonb_array_elements_text(coalesce(x -> 'focus', to_jsonb(d.focus))) f), '{}'),
        bio = nullif(trim(coalesce(x ->> 'bio', '')), ''), photo_url = nullif(x ->> 'photo_url', '')
      where id = p_id;
    exception when check_violation or invalid_text_representation then
      raise exception 'a profile field is not valid (bio max 280 characters, at most 4 focus areas)' using errcode = '22023';
    end;
    v_sections := array_append(v_sections, 'profile');
  end if;

  if p_patch ? 'flags' then
    x := p_patch -> 'flags';
    update public.doctors set
      listed = coalesce((x ->> 'listed')::boolean, listed), accepting = coalesce((x ->> 'accepting')::boolean, accepting),
      role_medical_reviewer = coalesce((x ->> 'medical_reviewer')::boolean, role_medical_reviewer),
      role_engine_signoff = coalesce((x ->> 'engine_signoff')::boolean, role_engine_signoff),
      role_community_expert = coalesce((x ->> 'community_expert')::boolean, role_community_expert),
      role_public_advisor = coalesce((x ->> 'public_advisor')::boolean, role_public_advisor),
      accepts_bpjs = coalesce((x ->> 'bpjs')::boolean, accepts_bpjs),
      languages = coalesce((select array_agg(l) from jsonb_array_elements_text(coalesce(x -> 'languages', to_jsonb(d.languages))) l), d.languages)
    where id = p_id;
    v_sections := array_append(v_sections, 'visibility & roles');
  end if;

  if p_patch ? 'locations' then
    if (select count(*) from jsonb_array_elements(p_patch -> 'locations') l where l ->> 'kind' = 'primary') > 1
       or (select count(*) from jsonb_array_elements(p_patch -> 'locations') l where l ->> 'kind' = 'virtual') > 1 then
      raise exception 'a doctor has one primary and one teleconsult location' using errcode = '22023';
    end if;
    -- Free the unique "primary / virtual" slots first, then upsert.
    update public.doctor_locations set kind = 'secondary', sort_order = sort_order where doctor_id = p_id and kind = 'primary';
    delete from public.doctor_locations where doctor_id = p_id and kind = 'virtual';
    for x in select * from jsonb_array_elements(p_patch -> 'locations') loop
      if char_length(trim(coalesce(x ->> 'label', ''))) < 2 then
        raise exception 'every location needs a name' using errcode = '22023';
      end if;
      if (x ->> 'id') ~ '^[0-9a-f-]{36}$' and exists (select 1 from public.doctor_locations where id = (x ->> 'id')::uuid and doctor_id = p_id) then
        v_real := (x ->> 'id')::uuid;
        update public.doctor_locations set clinic_id = nullif(x ->> 'clinic_id', '')::uuid, kind = x ->> 'kind', label = trim(x ->> 'label'),
          address = nullif(trim(coalesce(x ->> 'address', '')), ''), sip_number = nullif(trim(coalesce(x ->> 'sip_number', '')), '') where id = v_real;
      else
        insert into public.doctor_locations (doctor_id, clinic_id, kind, label, address, sip_number)
        values (p_id, nullif(x ->> 'clinic_id', '')::uuid, x ->> 'kind', trim(x ->> 'label'), nullif(trim(coalesce(x ->> 'address', '')), ''), nullif(trim(coalesce(x ->> 'sip_number', '')), ''))
        returning id into v_real;
      end if;
      v_kept := v_kept || v_real;
      v_map := v_map || jsonb_build_object(x ->> 'id', v_real);
    end loop;
    delete from public.doctor_locations where doctor_id = p_id and not id = any (v_kept);
    update public.doctor_locations set sort_order = case kind when 'primary' then 0 when 'secondary' then 1 else 9 end where doctor_id = p_id;
    update public.doctors set
      clinic_name = coalesce((select label from public.doctor_locations where doctor_id = p_id and kind = 'primary'), ''),
      city = coalesce((select c.city from public.doctor_locations l join public.clinics c on c.id = l.clinic_id where l.doctor_id = p_id and l.kind = 'primary'), '')
    where id = p_id;
    v_sections := array_append(v_sections, 'locations');
  end if;

  if p_patch ? 'slots' then
    delete from public.doctor_slots where doctor_id = p_id;
    for x in select * from jsonb_array_elements(p_patch -> 'slots') loop
      v_real := coalesce((v_map ->> (x ->> 'location_id'))::uuid, case when (x ->> 'location_id') ~ '^[0-9a-f-]{36}$' then (x ->> 'location_id')::uuid end);
      if not exists (select 1 from public.doctor_locations where id = v_real and doctor_id = p_id) then
        raise exception 'a time slot points at an unknown location' using errcode = '22023';
      end if;
      begin
        insert into public.doctor_slots (doctor_id, location_id, weekday, starts, ends)
        values (p_id, v_real, (x ->> 'weekday')::int, (x ->> 'start')::time, (x ->> 'end')::time);
      exception when check_violation or invalid_text_representation or invalid_datetime_format then
        raise exception 'check the schedule: end time must be after start time' using errcode = '22023';
      end;
    end loop;
    v_sections := array_append(v_sections, 'schedule');
  end if;

  if p_patch ? 'time_off' then
    delete from public.doctor_time_off where doctor_id = p_id;
    for x in select * from jsonb_array_elements(p_patch -> 'time_off') loop
      begin
        insert into public.doctor_time_off (doctor_id, from_date, to_date, reason, note, is_auto)
        values (p_id, (x ->> 'from')::date, (x ->> 'to')::date, trim(x ->> 'reason'), nullif(trim(coalesce(x ->> 'note', '')), ''), coalesce((x ->> 'is_auto')::boolean, false));
      exception when check_violation or invalid_text_representation or invalid_datetime_format then
        raise exception 'check the time-off dates and reason' using errcode = '22023';
      end;
    end loop;
    v_sections := array_append(v_sections, 'time off');
  end if;

  if p_patch ? 'booking' then
    x := p_patch -> 'booking';
    if not (x ->> 'window_days')::int in (7, 14, 30, 60, 90) or not (x ->> 'min_notice_hours')::int in (1, 2, 4, 12, 24)
       or not (x ->> 'slot_minutes')::int in (15, 20, 30, 45, 60) or not (x ->> 'buffer_minutes')::int in (0, 5, 10, 15)
       or (x ->> 'max_patients')::int not between 1 and 40 then
      raise exception 'a booking rule has an unsupported value' using errcode = '22023';
    end if;
    update public.doctors set booking = jsonb_build_object(
      'window_days', (x ->> 'window_days')::int, 'min_notice_hours', (x ->> 'min_notice_hours')::int, 'auto_confirm', (x ->> 'auto_confirm')::boolean,
      'same_day_tele', (x ->> 'same_day_tele')::boolean, 'slot_minutes', (x ->> 'slot_minutes')::int, 'buffer_minutes', (x ->> 'buffer_minutes')::int,
      'max_patients', (x ->> 'max_patients')::int) where id = p_id;
    v_sections := array_append(v_sections, 'booking rules');
  end if;

  if p_patch ? 'services' then
    for x in select * from jsonb_array_elements(p_patch -> 'services') loop
      insert into public.doctor_services (doctor_id, kind, price_idr, bpjs, active)
      values (p_id, x ->> 'kind', coalesce((x ->> 'price_idr')::int, 0), coalesce((x ->> 'bpjs')::boolean, false), coalesce((x ->> 'active')::boolean, false))
      on conflict (doctor_id, kind) do update set price_idr = excluded.price_idr, bpjs = excluded.bpjs, active = excluded.active;
    end loop;
    v_sections := array_append(v_sections, 'pricing');
  end if;

  if p_patch ? 'payout' then
    x := p_patch -> 'payout';
    update public.doctors set fee_paid_by = coalesce(x ->> 'paid_by', fee_paid_by), payout_schedule = coalesce(x ->> 'payout_schedule', payout_schedule),
      discounts = jsonb_build_object('plus_discount', coalesce((x -> 'discounts' ->> 'plus_discount')::boolean, (discounts ->> 'plus_discount')::boolean),
        'accept_promos', coalesce((x -> 'discounts' ->> 'accept_promos')::boolean, (discounts ->> 'accept_promos')::boolean),
        'first_tele_free', coalesce((x -> 'discounts' ->> 'first_tele_free')::boolean, (discounts ->> 'first_tele_free')::boolean))
    where id = p_id;
    v_sections := array_append(v_sections, 'payout & discounts');
  end if;

  if p_patch ? 'permissions' then
    for x in select * from jsonb_array_elements(p_patch -> 'permissions') loop
      insert into public.doctor_permissions (doctor_id, area, can_view, can_review, can_approve, can_publish)
      values (p_id, x ->> 'area', (x ->> 'view')::boolean, (x ->> 'review')::boolean, (x ->> 'approve')::boolean, (x ->> 'publish')::boolean)
      on conflict (doctor_id, area) do update set can_view = excluded.can_view, can_review = excluded.can_review, can_approve = excluded.can_approve, can_publish = excluded.can_publish;
    end loop;
    v_sections := array_append(v_sections, 'permissions');
  end if;

  if cardinality(v_sections) = 0 then
    raise exception 'nothing to save' using errcode = '22023';
  end if;
  update public.doctors set updated_by = (select auth.uid()) where id = p_id;
  perform analytics_private.doctor_write_activity(p_id, 'profile', 'pencil', 'info',
    'Profile updated by ' || coalesce((select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid())), 'an admin') || ' (admin)', initcap(array_to_string(v_sections, ', ')));
  perform analytics_private.write_audit('doctor.update', p_id::text, jsonb_build_object('summary', 'Updated doctor ' || d.name || ' · ' || array_to_string(v_sections, ', ')));
end;
$$;

-- ── status, verification, sessions ──────────────────────────────────────────

create function public.admin_doctors_set_status(p_id uuid, p_status text, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.doctors;
  v_reason text := analytics_private.require_reason(p_reason);
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_edit();
  if p_status not in ('active', 'suspended') then
    raise exception 'unknown status' using errcode = '22023';
  end if;
  select * into d from public.doctors where id = p_id for update;
  if not found then
    raise exception 'doctor not found' using errcode = 'P0002';
  end if;
  if p_status = 'active' and d.str_status <> 'verified' then
    raise exception 'verify the STR before activating this profile' using errcode = '22023';
  end if;
  update public.doctors set status = p_status, status_reason = v_reason, updated_by = (select auth.uid()) where id = p_id;
  perform analytics_private.doctor_write_activity(p_id, 'profile', case when p_status = 'suspended' then 'prohibit' else 'check' end,
    case when p_status = 'suspended' then 'error' else 'success' end, case when p_status = 'suspended' then 'Profile suspended' else 'Profile reactivated' end, v_reason);
  perform analytics_private.write_audit(case when p_status = 'suspended' then 'doctor.suspend' else 'doctor.reactivate' end, p_id::text,
    jsonb_build_object('summary', (case when p_status = 'suspended' then 'Suspended ' else 'Reactivated ' end) || d.name, 'reason', v_reason));
end;
$$;

create function public.admin_doctors_verify_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'specialty', specialty, 'str_number', str_number, 'sip_number', sip_number,
      'sip_valid_until', sip_valid_until, 'clinic', clinic_name, 'created_at', created_at) order by created_at)
    from public.doctors where str_status = 'pending' and status <> 'draft'
  ), '[]'::jsonb);
end;
$$;

-- Manual check against the KKI register (there is no API): the reviewer confirms the STR belongs to this doctor.
create function public.admin_doctors_verify(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.doctors;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'medical_reviewer']::public.admin_role[]);
  select * into d from public.doctors where id = p_id for update;
  if not found or d.str_status <> 'pending' then
    raise exception 'this doctor is not waiting for STR verification' using errcode = 'P0002';
  end if;
  if p_approve and coalesce(d.str_number, '') = '' then
    raise exception 'the doctor has no STR number' using errcode = '22023';
  end if;
  if not p_approve and char_length(trim(coalesce(p_note, ''))) < 3 then
    raise exception 'say why the STR was rejected' using errcode = '22023';
  end if;
  update public.doctors set str_status = case when p_approve then 'verified' else 'rejected' end, str_verified_at = case when p_approve then now() end,
    status = case when p_approve and status = 'pending' then 'active' else status end, status_reason = case when p_approve then status_reason else trim(p_note) end,
    updated_by = (select auth.uid())
  where id = p_id;
  perform analytics_private.doctor_write_activity(p_id, 'profile', case when p_approve then 'seal-check' else 'seal-warning' end, case when p_approve then 'success' else 'error' end,
    case when p_approve then 'STR verified with KKI' else 'STR rejected' end, coalesce(nullif(trim(coalesce(p_note, '')), ''), 'Checked by ' || (select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid()))));
  perform analytics_private.write_audit(case when p_approve then 'doctor.str_verify' else 'doctor.str_reject' end, p_id::text,
    jsonb_build_object('summary', (case when p_approve then 'Verified STR of ' else 'Rejected STR of ' end) || d.name));
end;
$$;

create function public.admin_doctors_request_reverify(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.doctors;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_edit();
  select * into d from public.doctors where id = p_id for update;
  if not found then
    raise exception 'doctor not found' using errcode = 'P0002';
  end if;
  update public.doctors set str_status = 'pending', str_verified_at = null, updated_by = (select auth.uid()) where id = p_id;
  perform analytics_private.doctor_write_activity(p_id, 'security', 'seal-warning', 'warning', 'Licence re-verification requested', 'Profile stays live while the STR is re-checked');
  perform analytics_private.write_audit('doctor.reverify', p_id::text, jsonb_build_object('summary', 'Requested re-verification of ' || d.name));
end;
$$;

create function public.admin_doctors_revoke_session(p_id uuid, p_session uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.doctors;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_edit();
  select * into d from public.doctors where id = p_id;
  if not found or d.admin_id is null then
    raise exception 'this doctor has no portal login' using errcode = 'P0002';
  end if;
  delete from auth.sessions where id = p_session and user_id = d.admin_id;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  perform analytics_private.doctor_write_activity(p_id, 'security', 'sign-out', 'warning', 'Session revoked by admin');
  perform analytics_private.write_audit('doctor.session_revoke', p_id::text, jsonb_build_object('summary', 'Revoked a portal session of ' || d.name));
end;
$$;
