-- Clinics: summary, list, options, one clinic, save (draft / submit), approve, suspend, documents, linked doctors, CSV import.

create function analytics_private.clinic_clean(p jsonb, p_strict boolean)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p ->> 'name', ''));
  v_email text := nullif(trim(coalesce(p ->> 'email', '')), '');
  v_admin text := nullif(lower(trim(coalesce(p ->> 'admin_email', ''))), '');
  v_web text := nullif(trim(coalesce(p ->> 'website', '')), '');
  v_day text;
  v_slot jsonb;
  v_hours jsonb := '{}'::jsonb;
  v_list jsonb;
  v_svc jsonb;
  v_services jsonb := '[]'::jsonb;
  v_listed integer := 0;
  v_facilities text[];
  v_payments text[];
  v_insurers text[];
  v_photos text[];
  v_success jsonb := coalesce(p -> 'success', '{}'::jsonb);
begin
  if char_length(v_name) not between 2 and 80 then
    raise exception 'enter the clinic name (2–80 characters)' using errcode = '22023';
  end if;
  if not coalesce(p ->> 'type', '') = any (array['fertility', 'hospital', 'obgyn', 'laboratory', 'private_practice']) then
    raise exception 'pick a clinic type' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'the clinic email looks wrong' using errcode = '22023';
  end if;
  if v_admin is not null and v_admin !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'the clinic admin email looks wrong' using errcode = '22023';
  end if;
  if v_web is not null and v_web !~ '^https?://[^\s]+$' then
    raise exception 'the website must start with http:// or https://' using errcode = '22023';
  end if;
  if char_length(coalesce(p ->> 'description', '')) > 200 then
    raise exception 'the description is at most 200 characters' using errcode = '22023';
  end if;
  if nullif(p ->> 'postal_code', '') is not null and (p ->> 'postal_code') !~ '^[0-9]{5}$' then
    raise exception 'the postal code has 5 digits' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct f), '{}') into v_facilities from jsonb_array_elements_text(coalesce(p -> 'facilities', '[]'::jsonb)) f
  where f = any (array['IVF lab', 'Andrology lab', 'USG 4D', 'Pharmacy', 'Egg freezing', 'Prayer room', 'Parking']);
  select coalesce(array_agg(distinct left(trim(x), 40)) filter (where trim(x) <> ''), '{}') into v_payments from jsonb_array_elements_text(coalesce(p -> 'payments', '[]'::jsonb)) x;
  select coalesce(array_agg(distinct left(trim(x), 40)) filter (where trim(x) <> ''), '{}') into v_insurers from jsonb_array_elements_text(coalesce(p -> 'insurers', '[]'::jsonb)) x;
  select coalesce(array_agg(trim(x)) filter (where trim(x) ~ '^https?://'), '{}') into v_photos from jsonb_array_elements_text(coalesce(p -> 'photos', '[]'::jsonb)) x;
  if cardinality(v_payments) > 12 or cardinality(v_insurers) > 12 or cardinality(v_photos) > 6 then
    raise exception 'too many payment methods, insurers or photos' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p -> 'hours', '{}'::jsonb)) <> 'object' then
    raise exception 'the opening hours are invalid' using errcode = '22023';
  end if;
  foreach v_day in array analytics_private.clinic_days() loop
    v_list := coalesce(p -> 'hours' -> v_day, '[]'::jsonb);
    if jsonb_typeof(v_list) <> 'array' then
      raise exception 'the opening hours are invalid' using errcode = '22023';
    end if;
    for v_slot in select * from jsonb_array_elements(v_list) loop
      if not (v_slot ->> 0) ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or not (v_slot ->> 1) ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (v_slot ->> 1) <= (v_slot ->> 0) then
        raise exception 'check the opening hours for %: end must be after start', v_day using errcode = '22023';
      end if;
    end loop;
    if jsonb_array_length(v_list) > 0 then
      v_hours := v_hours || jsonb_build_object(v_day, v_list);
    end if;
  end loop;

  if jsonb_array_length(coalesce(p -> 'services', '[]'::jsonb)) > 20 then
    raise exception 'at most 20 services' using errcode = '22023';
  end if;
  for v_svc in select * from jsonb_array_elements(coalesce(p -> 'services', '[]'::jsonb)) loop
    if char_length(trim(coalesce(v_svc ->> 'label', ''))) < 2 then
      raise exception 'every service needs a name' using errcode = '22023';
    end if;
    if coalesce((v_svc ->> 'price_max')::bigint, 0) < coalesce((v_svc ->> 'price_min')::bigint, 0) then
      raise exception 'the maximum price of "%" is below its minimum', v_svc ->> 'label' using errcode = '22023';
    end if;
    if coalesce((v_svc ->> 'listed')::boolean, false) then
      v_listed := v_listed + 1;
    end if;
    v_services := v_services || jsonb_build_array(jsonb_build_object(
      'label', left(trim(v_svc ->> 'label'), 80), 'icon', left(coalesce(v_svc ->> 'icon', 'stethoscope'), 20),
      'price_min', coalesce((v_svc ->> 'price_min')::int, 0), 'price_max', coalesce((v_svc ->> 'price_max')::int, 0),
      'bpjs', coalesce((v_svc ->> 'bpjs')::boolean, false), 'listed', coalesce((v_svc ->> 'listed')::boolean, false)));
  end loop;

  if (v_success ->> 'iui_pct') is not null and not (v_success ->> 'iui_pct')::numeric between 0 and 100
     or (v_success ->> 'ivf_pct') is not null and not (v_success ->> 'ivf_pct')::numeric between 0 and 100 then
    raise exception 'success rates are percentages between 0 and 100' using errcode = '22023';
  end if;

  if p_strict then
    if coalesce(p ->> 'city', '') = '' or coalesce(p ->> 'address', '') = '' or coalesce(p ->> 'province', '') = '' then
      raise exception 'add the street address, province and city' using errcode = '22023';
    end if;
    if char_length(coalesce(p ->> 'description', '')) < 20 then
      raise exception 'write a short description (at least 20 characters)' using errcode = '22023';
    end if;
    if nullif(p ->> 'phone', '') is null and nullif(p ->> 'whatsapp', '') is null then
      raise exception 'add a phone number or WhatsApp' using errcode = '22023';
    end if;
    if v_hours = '{}'::jsonb then
      raise exception 'add the opening hours' using errcode = '22023';
    end if;
    if v_listed = 0 then
      raise exception 'list at least one service' using errcode = '22023';
    end if;
    if v_admin is null then
      raise exception 'enter the clinic admin email' using errcode = '22023';
    end if;
  end if;

  return jsonb_build_object(
    'name', v_name, 'legal_entity', nullif(trim(coalesce(p ->> 'legal_entity', '')), ''), 'type', p ->> 'type',
    'description', nullif(trim(coalesce(p ->> 'description', '')), ''), 'photos', to_jsonb(v_photos),
    'phone', nullif(trim(coalesce(p ->> 'phone', '')), ''), 'whatsapp', nullif(trim(coalesce(p ->> 'whatsapp', '')), ''), 'email', v_email, 'website', v_web,
    'facilities', to_jsonb(v_facilities), 'address', nullif(trim(coalesce(p ->> 'address', '')), ''), 'province', nullif(trim(coalesce(p ->> 'province', '')), ''),
    'city', nullif(trim(coalesce(p ->> 'city', '')), ''), 'postal_code', nullif(p ->> 'postal_code', ''),
    'lat', nullif(p ->> 'lat', '')::numeric, 'lng', nullif(p ->> 'lng', '')::numeric, 'hours', v_hours,
    'walk_ins', coalesce((p ->> 'walk_ins')::boolean, false), 'teleconsult', coalesce((p ->> 'teleconsult')::boolean, false),
    'access_notes', nullif(trim(coalesce(p ->> 'access_notes', '')), ''), 'payments', to_jsonb(v_payments), 'insurers', to_jsonb(v_insurers),
    'success', jsonb_build_object('iui_pct', v_success -> 'iui_pct', 'ivf_pct', v_success -> 'ivf_pct', 'period', v_success -> 'period'),
    'tier', case when coalesce(p ->> 'tier', 'listed') in ('listed', 'verified', 'sponsor') then coalesce(p ->> 'tier', 'listed') else 'listed' end,
    'accepts_bookings', coalesce((p ->> 'accepts_bookings')::boolean, false), 'referral_enabled', coalesce((p ->> 'referral_enabled')::boolean, false),
    'admin_email', v_admin, 'admin_role', case when coalesce(p ->> 'admin_role', 'clinic_manager') in ('owner', 'clinic_manager', 'front_desk') then coalesce(p ->> 'admin_role', 'clinic_manager') else 'clinic_manager' end,
    'terms_signed', coalesce((p ->> 'terms_signed')::boolean, false), 'services', v_services
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'a number in the form is not valid (coordinates, prices or percentages)' using errcode = '22023';
end;
$$;

create function analytics_private.clinic_bpjs_level(p_services jsonb, p_payments jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when not exists (select 1 from jsonb_array_elements_text(p_payments) x where x ilike 'BPJS%') then 'no'
    when (select count(*) from jsonb_array_elements(p_services) s where (s ->> 'listed')::boolean and (s ->> 'bpjs')::boolean) = 0 then 'no'
    when (select count(*) from jsonb_array_elements(p_services) s where (s ->> 'listed')::boolean and not (s ->> 'bpjs')::boolean) = 0 then 'yes'
    else 'partial' end
$$;

create function analytics_private.clinic_json(c public.clinics, p_full boolean default false)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'type', c.type, 'city', c.city, 'bpjs_level', c.bpjs_level, 'rating', c.rating, 'tier', c.tier, 'status', c.status,
    'photo', c.photos[1],
    'doctors', (select count(*) from public.doctor_locations l where l.clinic_id = c.id and l.kind <> 'virtual'),
    'referrals', (select count(*) from public.user_clinics uc where uc.clinic_id = c.id and uc.status in ('visited', 'saved')),
    'submitted_at', c.submitted_at, 'submitted_by', c.submitted_by
  ) || case when p_full then jsonb_build_object(
    'legal_entity', c.legal_entity, 'description', c.description, 'photos', to_jsonb(c.photos), 'phone', c.phone, 'whatsapp', c.whatsapp, 'email', c.email,
    'website', c.website, 'facilities', to_jsonb(c.facilities), 'address', c.address, 'province', c.province, 'postal_code', c.postal_code, 'lat', c.lat, 'lng', c.lng,
    'hours', c.hours, 'walk_ins', c.walk_ins, 'teleconsult', c.teleconsult, 'access_notes', c.access_notes, 'payments', to_jsonb(c.payments), 'insurers', to_jsonb(c.insurers),
    'success', c.success, 'accepts_bookings', c.accepts_bookings, 'referral_enabled', c.referral_enabled, 'referral_slug', c.referral_slug,
    'admin_email', c.admin_email, 'admin_role', c.admin_role, 'terms_signed', c.terms_signed_at is not null, 'status_reason', c.status_reason,
    'verified_at', c.verified_at, 'docs_request', c.docs_request, 'updated_at', c.updated_at,
    'services', coalesce((select jsonb_agg(jsonb_build_object('label', s.label, 'icon', s.icon, 'price_min', s.price_min, 'price_max', s.price_max, 'bpjs', s.bpjs, 'listed', s.listed) order by s.sort_order)
                          from public.clinic_services s where s.clinic_id = c.id), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('kind', d.kind, 'file_name', d.file_name, 'status', d.status, 'note', d.note, 'verified_at', d.verified_at) order by d.kind)
                           from public.clinic_documents d where d.clinic_id = c.id), '[]'::jsonb),
    'linked', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'specialty', d.specialty, 'years', d.years_experience, 'str_status', d.str_status,
                                                          'role', l.clinic_role, 'status', d.status) order by (l.clinic_role = 'medical_director') desc, d.name)
                        from public.doctor_locations l join public.doctors d on d.id = l.doctor_id where l.clinic_id = c.id and l.kind <> 'virtual'), '[]'::jsonb)
  ) else '{}'::jsonb end
$$;

create function public.admin_clinics_summary()
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
    'counts', jsonb_build_object(
      'all', (select count(*) from public.clinics),
      'pending', (select count(*) from public.clinics where status = 'pending'),
      'sponsors', (select count(*) from public.clinics where tier = 'sponsor' and status = 'verified'),
      'suspended', (select count(*) from public.clinics where status = 'suspended')),
    'cities', (select coalesce(jsonb_agg(c order by c), '[]'::jsonb) from (select distinct city as c from public.clinics where city <> '') x),
    'can_edit', analytics_private.console_role() in ('super_admin', 'admin')
  );
end;
$$;

create function public.admin_clinics_list(
  p_tab text default 'all', p_search text default null, p_city text default null, p_type text default null, p_bpjs text default null,
  p_limit integer default 10, p_offset integer default 0
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
    select c.* from public.clinics c
    where (p_tab = 'all' or (p_tab = 'pending' and c.status = 'pending') or (p_tab = 'sponsors' and c.tier = 'sponsor' and c.status = 'verified')
           or (p_tab = 'suspended' and c.status = 'suspended'))
      and (nullif(p_city, '') is null or c.city = p_city)
      and (nullif(p_type, '') is null or c.type = p_type)
      and (nullif(p_bpjs, '') is null or c.bpjs_level = p_bpjs)
      and (v_search is null or c.name ilike '%' || v_search || '%'
           or exists (select 1 from public.doctor_locations l join public.doctors d on d.id = l.doctor_id where l.clinic_id = c.id and d.name ilike '%' || v_search || '%'))
  ), page as (
    select * from f order by (status = 'suspended'), (status = 'verified') desc, tier = 'sponsor' desc, name
    limit least(greatest(coalesce(p_limit, 10), 1), 200) offset greatest(coalesce(p_offset, 0), 0)
  )
  select (select count(*) from f),
         coalesce((select jsonb_agg(analytics_private.clinic_json(g) order by (g.status = 'suspended'), (g.status = 'verified') desc, g.tier = 'sponsor' desc, g.name) from page g), '[]'::jsonb)
  into v_total, v_rows;
  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

-- Adds the pseudo document "STR & SIP" (derived from the linked doctors) to a clinic's documents.
create function public.admin_clinics_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.clinics;
  j jsonb;
  v_docs integer;
  v_ok integer;
  v_kars text;
  v_licence text;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  select * into c from public.clinics where id = p_id;
  if not found then
    raise exception 'clinic not found' using errcode = 'P0002';
  end if;
  j := analytics_private.clinic_json(c, true);
  select count(*), count(*) filter (where d.str_status = 'verified') into v_docs, v_ok
  from public.doctor_locations l join public.doctors d on d.id = l.doctor_id where l.clinic_id = p_id and l.kind <> 'virtual';
  select status into v_kars from public.clinic_documents where clinic_id = p_id and kind = 'kars';
  select status into v_licence from public.clinic_documents where clinic_id = p_id and kind = 'operating_licence';
  return j || jsonb_build_object(
    'str_sip', jsonb_build_object('doctors', v_docs, 'verified', v_ok, 'status', case when v_docs = 0 then 'missing' when v_ok = v_docs then 'verified' else 'review' end),
    'checklist', jsonb_build_array(
      jsonb_build_object('key', 'profile', 'label', 'Profile, photos & contact', 'ok', c.description is not null and (c.phone is not null or c.whatsapp is not null) and cardinality(c.photos) > 0),
      jsonb_build_object('key', 'location', 'label', 'Address, map pin & opening hours', 'ok', c.address is not null and c.lat is not null and c.hours <> '{}'::jsonb),
      jsonb_build_object('key', 'services', 'label', (select count(*) from public.clinic_services where clinic_id = p_id and listed) || ' services with price ranges', 'ok', exists (select 1 from public.clinic_services where clinic_id = p_id and listed)),
      jsonb_build_object('key', 'doctors', 'label', v_docs || ' doctors linked' || case when v_docs - v_ok > 0 then ' (' || (v_docs - v_ok) || ' STR pending)' else '' end, 'ok', v_docs > 0 and v_ok = v_docs),
      jsonb_build_object('key', 'kars', 'label', 'KARS accreditation certificate', 'ok', coalesce(v_kars, 'missing') in ('review', 'verified')),
      jsonb_build_object('key', 'terms', 'label', 'Terms & data-processing agreement signed', 'ok', c.terms_signed_at is not null),
      jsonb_build_object('key', 'licence', 'label', 'Operating licence verified', 'ok', coalesce(v_licence, 'missing') = 'verified')
    )
  );
end;
$$;

-- Create / update from the wizard. Every "Next" autosaves as a draft; p_submit sends it for verification.
create function public.admin_clinics_save(p_id uuid, p_payload jsonb, p_submit boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  c jsonb;
  cur public.clinics;
  v_id uuid;
  v_level text;
  v_slug text;
  v_name text;
  v_by text := coalesce((select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid())), 'an admin') || ' (admin)';
  v_svc jsonb;
  v_i integer := 0;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  c := analytics_private.clinic_clean(p_payload, p_submit);
  v_name := c ->> 'name';
  v_level := analytics_private.clinic_bpjs_level(c -> 'services', c -> 'payments');

  if exists (select 1 from public.clinics where lower(name) = lower(v_name) and lower(city) = lower(coalesce(c ->> 'city', '')) and id is distinct from p_id) then
    raise exception '% in % is already in the directory', v_name, coalesce(c ->> 'city', 'this city') using errcode = '23505';
  end if;
  if (c ->> 'referral_enabled')::boolean then
    v_slug := analytics_private.clinic_slug(v_name);
    if exists (select 1 from public.clinics where referral_slug = v_slug and id is distinct from p_id) then
      v_slug := left(v_slug, 50) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    end if;
  end if;

  if p_id is null then
    insert into public.clinics (
      name, city, address, rating, bpjs, ivf_lab, legal_entity, type, description, photos, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng,
      hours, walk_ins, teleconsult, access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, admin_role,
      terms_signed_at, bpjs_level, status, submitted_at, submitted_by, created_by, updated_by
    ) values (
      v_name, coalesce(c ->> 'city', ''), c ->> 'address', 0, v_level <> 'no', (c -> 'facilities') ? 'IVF lab', c ->> 'legal_entity', c ->> 'type', c ->> 'description',
      array(select jsonb_array_elements_text(c -> 'photos')), c ->> 'phone', c ->> 'whatsapp', c ->> 'email', c ->> 'website', array(select jsonb_array_elements_text(c -> 'facilities')),
      c ->> 'province', c ->> 'postal_code', (c ->> 'lat')::numeric, (c ->> 'lng')::numeric, c -> 'hours', (c ->> 'walk_ins')::boolean, (c ->> 'teleconsult')::boolean,
      c ->> 'access_notes', array(select jsonb_array_elements_text(c -> 'payments')), array(select jsonb_array_elements_text(c -> 'insurers')), c -> 'success',
      c ->> 'tier', (c ->> 'accepts_bookings')::boolean, (c ->> 'referral_enabled')::boolean, v_slug, c ->> 'admin_email', c ->> 'admin_role',
      case when (c ->> 'terms_signed')::boolean then now() end, v_level, case when p_submit then 'pending' else 'draft' end,
      case when p_submit then now() end, case when p_submit then v_by end, v_me, v_me
    ) returning id into v_id;
    insert into public.clinic_documents (clinic_id, kind) select v_id, k from unnest(array['operating_licence', 'nib', 'kars', 'bpjs_pks', 'art_licence', 'kfer_cert']) k;
    perform analytics_private.write_audit('clinic.create', v_id::text, jsonb_build_object('summary', 'Added clinic ' || v_name));
  else
    select * into cur from public.clinics where id = p_id for update;
    if not found then
      raise exception 'clinic not found' using errcode = 'P0002';
    end if;
    v_id := p_id;
    update public.clinics set
      name = v_name, city = coalesce(c ->> 'city', ''), address = c ->> 'address', bpjs = v_level <> 'no', ivf_lab = (c -> 'facilities') ? 'IVF lab',
      legal_entity = c ->> 'legal_entity', type = c ->> 'type', description = c ->> 'description', photos = array(select jsonb_array_elements_text(c -> 'photos')),
      phone = c ->> 'phone', whatsapp = c ->> 'whatsapp', email = c ->> 'email', website = c ->> 'website', facilities = array(select jsonb_array_elements_text(c -> 'facilities')),
      province = c ->> 'province', postal_code = c ->> 'postal_code', lat = (c ->> 'lat')::numeric, lng = (c ->> 'lng')::numeric, hours = c -> 'hours',
      walk_ins = (c ->> 'walk_ins')::boolean, teleconsult = (c ->> 'teleconsult')::boolean, access_notes = c ->> 'access_notes',
      payments = array(select jsonb_array_elements_text(c -> 'payments')), insurers = array(select jsonb_array_elements_text(c -> 'insurers')), success = c -> 'success',
      tier = case when cur.status = 'verified' or cur.status = 'suspended' then c ->> 'tier' else case when (c ->> 'tier') = 'sponsor' then 'sponsor' else c ->> 'tier' end end,
      accepts_bookings = (c ->> 'accepts_bookings')::boolean, referral_enabled = (c ->> 'referral_enabled')::boolean, referral_slug = coalesce(v_slug, referral_slug),
      admin_email = c ->> 'admin_email', admin_role = c ->> 'admin_role',
      terms_signed_at = case when (c ->> 'terms_signed')::boolean then coalesce(terms_signed_at, now()) else null end,
      bpjs_level = v_level,
      status = case when p_submit and cur.status = 'draft' then 'pending' else cur.status end,
      submitted_at = case when p_submit and cur.status = 'draft' then now() else submitted_at end,
      submitted_by = case when p_submit and cur.status = 'draft' then v_by else submitted_by end,
      updated_by = v_me
    where id = p_id;
    -- Keep the name the doctors' locations show in sync.
    update public.doctor_locations set label = v_name, address = c ->> 'address' where clinic_id = p_id;
    if cur.name <> v_name or cur.city <> coalesce(c ->> 'city', '') then
      update public.doctors d set clinic_name = v_name, city = coalesce(c ->> 'city', '')
      where exists (select 1 from public.doctor_locations l where l.doctor_id = d.id and l.clinic_id = p_id and l.kind = 'primary');
    end if;
    perform analytics_private.write_audit(case when p_submit then 'clinic.submit' else 'clinic.update' end, p_id::text,
      jsonb_build_object('summary', (case when p_submit then 'Submitted clinic ' else 'Updated clinic ' end) || v_name));
  end if;

  delete from public.clinic_services where clinic_id = v_id;
  for v_svc in select * from jsonb_array_elements(c -> 'services') loop
    insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
    values (v_id, v_svc ->> 'label', v_svc ->> 'icon', (v_svc ->> 'price_min')::int, (v_svc ->> 'price_max')::int, (v_svc ->> 'bpjs')::boolean, (v_svc ->> 'listed')::boolean, v_i);
    v_i := v_i + 1;
  end loop;
  return v_id;
end;
$$;

create function public.admin_clinics_approve(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.clinics;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  select * into c from public.clinics where id = p_id for update;
  if not found or c.status not in ('pending', 'draft') then
    raise exception 'this clinic is not waiting for verification' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.clinic_documents where clinic_id = p_id and kind = 'operating_licence' and status = 'verified') then
    raise exception 'verify the operating licence (Dinkes) before approving' using errcode = '22023';
  end if;
  update public.clinics set status = 'verified', verified_at = now(), tier = case when tier = 'listed' then 'verified' else tier end, status_reason = null, updated_by = (select auth.uid()) where id = p_id;
  perform analytics_private.write_audit('clinic.approve', p_id::text, jsonb_build_object('summary', 'Approved clinic ' || c.name));
end;
$$;

create function public.admin_clinics_set_status(p_id uuid, p_status text, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.clinics;
  v_reason text := analytics_private.require_reason(p_reason);
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  if p_status not in ('suspended', 'verified') then
    raise exception 'unknown status' using errcode = '22023';
  end if;
  select * into c from public.clinics where id = p_id for update;
  if not found then
    raise exception 'clinic not found' using errcode = 'P0002';
  end if;
  if p_status = 'verified' and c.verified_at is null then
    raise exception 'this clinic was never verified; approve it instead' using errcode = '22023';
  end if;
  update public.clinics set status = p_status, status_reason = v_reason, updated_by = (select auth.uid()) where id = p_id;
  perform analytics_private.write_audit(case when p_status = 'suspended' then 'clinic.suspend' else 'clinic.reactivate' end, p_id::text,
    jsonb_build_object('summary', (case when p_status = 'suspended' then 'Suspended ' else 'Reactivated ' end) || c.name, 'reason', v_reason));
end;
$$;

create function public.admin_clinics_request_docs(p_id uuid, p_kinds text[], p_message text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.clinics;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  select * into c from public.clinics where id = p_id;
  if not found then
    raise exception 'clinic not found' using errcode = 'P0002';
  end if;
  if p_kinds is null or cardinality(p_kinds) = 0 or not p_kinds <@ array['operating_licence', 'nib', 'kars', 'bpjs_pks', 'art_licence', 'kfer_cert', 'str_sip'] then
    raise exception 'choose which documents to request' using errcode = '22023';
  end if;
  update public.clinics set docs_request = jsonb_build_object('kinds', to_jsonb(p_kinds), 'message', left(trim(coalesce(p_message, '')), 300), 'at', now(),
      'by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid()))) where id = p_id;
  perform analytics_private.write_audit('clinic.request_docs', p_id::text, jsonb_build_object('summary', 'Requested documents from ' || c.name, 'kinds', to_jsonb(p_kinds)));
end;
$$;

create function public.admin_clinics_set_document(p_id uuid, p_kind text, p_status text, p_file_name text default null, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.clinics;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  if p_status not in ('missing', 'review', 'verified', 'rejected') then
    raise exception 'unknown document status' using errcode = '22023';
  end if;
  select * into c from public.clinics where id = p_id;
  if not found then
    raise exception 'clinic not found' using errcode = 'P0002';
  end if;
  update public.clinic_documents set status = p_status, file_name = nullif(left(trim(coalesce(p_file_name, '')), 120), ''), note = nullif(left(trim(coalesce(p_note, '')), 200), ''),
    verified_at = case when p_status = 'verified' then now() end, updated_at = now() where clinic_id = p_id and kind = p_kind;
  if not found then
    raise exception 'unknown document' using errcode = 'P0002';
  end if;
  perform analytics_private.write_audit('clinic.document', p_id::text, jsonb_build_object('summary', c.name || ': ' || p_kind || ' → ' || p_status));
end;
$$;

create function public.admin_clinics_search_doctors(p_id uuid, p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_query, '')), '');
begin
  perform public.assert_console_admin();
  perform analytics_private.require_doctors_view();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'specialty', d.specialty, 'years', d.years_experience, 'str_status', d.str_status) order by d.name)
    from (select * from public.doctors d where d.status <> 'suspended'
            and (v_q is null or d.name ilike '%' || v_q || '%' or replace(coalesce(d.str_number, ''), ' ', '') like '%' || replace(v_q, ' ', '') || '%')
            and not exists (select 1 from public.doctor_locations l where l.doctor_id = d.id and l.clinic_id = p_id)
          order by d.name limit 8) d
  ), '[]'::jsonb);
end;
$$;

create function public.admin_clinics_link_doctor(p_id uuid, p_doctor uuid, p_role text default 'doctor')
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.clinics;
  d public.doctors;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  if p_role not in ('doctor', 'medical_director', 'visiting') then
    raise exception 'unknown role' using errcode = '22023';
  end if;
  select * into c from public.clinics where id = p_id;
  select * into d from public.doctors where id = p_doctor;
  if c.id is null or d.id is null then
    raise exception 'clinic or doctor not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.doctor_locations where doctor_id = p_doctor and clinic_id = p_id) then
    update public.doctor_locations set clinic_role = p_role where doctor_id = p_doctor and clinic_id = p_id;
  else
    insert into public.doctor_locations (doctor_id, clinic_id, kind, label, address, clinic_role, sort_order)
    values (p_doctor, p_id, case when exists (select 1 from public.doctor_locations where doctor_id = p_doctor and kind = 'primary') then 'secondary' else 'primary' end, c.name, c.address, p_role, 1);
    update public.doctors set clinic_name = c.name, city = c.city
     where id = p_doctor and not exists (select 1 from public.doctor_locations where doctor_id = p_doctor and kind = 'primary' and clinic_id <> p_id);
  end if;
  perform analytics_private.write_audit('clinic.link_doctor', p_id::text, jsonb_build_object('summary', 'Linked ' || d.name || ' to ' || c.name));
end;
$$;

create function public.admin_clinics_unlink_doctor(p_id uuid, p_doctor uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.clinics;
  d public.doctors;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  select * into c from public.clinics where id = p_id;
  select * into d from public.doctors where id = p_doctor;
  delete from public.doctor_locations where doctor_id = p_doctor and clinic_id = p_id;
  if not found then
    raise exception 'that doctor is not linked to this clinic' using errcode = 'P0002';
  end if;
  update public.doctors set clinic_name = coalesce((select label from public.doctor_locations where doctor_id = p_doctor and kind = 'primary'), ''),
    city = coalesce((select k.city from public.doctor_locations l join public.clinics k on k.id = l.clinic_id where l.doctor_id = p_doctor and l.kind = 'primary'), '')
  where id = p_doctor;
  perform analytics_private.write_audit('clinic.unlink_doctor', p_id::text, jsonb_build_object('summary', 'Unlinked ' || d.name || ' from ' || c.name));
end;
$$;

-- CSV import: every row becomes a draft the team completes and verifies later.
create function public.admin_clinics_import(p_rows jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r jsonb;
  v_created integer := 0;
  v_skipped jsonb := '[]'::jsonb;
  v_i integer := 0;
  v_type text;
  v_name text;
  v_city text;
  v_id uuid;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_clinics_edit();
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 500 then
    raise exception 'import between 1 and 500 rows at a time' using errcode = '22023';
  end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_i := v_i + 1;
    v_name := trim(coalesce(r ->> 'name', ''));
    v_city := trim(coalesce(r ->> 'city', ''));
    v_type := coalesce(nullif(r ->> 'type', ''), 'fertility');
    if char_length(v_name) < 2 or v_city = '' then
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object('row', v_i, 'reason', 'name and city are required'));
    elsif not v_type = any (array['fertility', 'hospital', 'obgyn', 'laboratory', 'private_practice']) then
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object('row', v_i, 'reason', 'unknown type "' || v_type || '"'));
    elsif exists (select 1 from public.clinics where lower(name) = lower(v_name) and lower(city) = lower(v_city)) then
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object('row', v_i, 'reason', 'already in the directory'));
    else
      begin
        insert into public.clinics (name, city, address, rating, type, province, phone, email, website, status, created_by, updated_by)
        values (left(v_name, 80), left(v_city, 60), nullif(left(trim(coalesce(r ->> 'address', '')), 160), ''), 0, v_type, nullif(trim(coalesce(r ->> 'province', '')), ''),
                nullif(left(trim(coalesce(r ->> 'phone', '')), 30), ''), nullif(left(trim(coalesce(r ->> 'email', '')), 120), ''),
                case when (r ->> 'website') ~ '^https?://[^\s]+$' then left(r ->> 'website', 200) end, 'draft', (select auth.uid()), (select auth.uid()))
        returning id into v_id;
        insert into public.clinic_documents (clinic_id, kind) select v_id, k from unnest(array['operating_licence', 'nib', 'kars', 'bpjs_pks', 'art_licence', 'kfer_cert']) k;
        v_created := v_created + 1;
      exception when check_violation then
        v_skipped := v_skipped || jsonb_build_array(jsonb_build_object('row', v_i, 'reason', 'a field is not valid (email or phone too long?)'));
      end;
    end if;
  end loop;
  perform analytics_private.write_audit('clinic.import', 'clinics', jsonb_build_object('summary', 'Imported ' || v_created || ' clinics from CSV', 'skipped', jsonb_array_length(v_skipped)));
  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;
