-- Devices & integrations (mobile): connection status, the two import preferences, and the
-- platform / app version / device model the app reports about itself.
-- user_integrations already exists (the console reads it); the app now writes it through RPCs.

alter table public.user_integrations
  add column connected_at timestamptz not null default now(),
  add column last_sync_at timestamptz,
  add constraint user_integrations_status_check check (status in ('Connected', 'Linked', 'Disconnected'));
create unique index user_integrations_user_kind_idx on public.user_integrations (user_id, kind);

alter table public.app_users
  add column device_auto_import_temperature boolean not null default true,
  add column device_ask_before_overwrite boolean not null default true;

-- Everything the Connected devices screen needs from the database. The catalog of devices
-- (names, icons, which platform) lives in the app; this only says what is connected.
create function public.app_devices_get()
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
    'connected', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', i.kind, 'note', i.note,
        'connectedAt', to_char(i.connected_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'lastSyncAt', to_char(i.last_sync_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ) order by i.connected_at)
      from public.user_integrations i
      where i.user_id = v_user and i.status = 'Connected' and i.kind <> 'partner'
    ), '[]'::jsonb),
    'preferences', jsonb_build_object(
      'autoImportTemperature', u.device_auto_import_temperature,
      'askBeforeOverwrite', u.device_ask_before_overwrite
    )
  );
end;
$$;

-- Marks a device connected. The app calls this only after the OS / vendor really granted access.
create function public.app_device_connect(p_kind text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if p_kind is null
     or p_kind not in ('apple_health', 'health_connect', 'oura', 'bt_thermometer', 'hormone_monitor', 'smartwatch')
     or char_length(coalesce(v_note, '')) > 120
  then
    raise exception 'invalid device' using errcode = '22023';
  end if;

  insert into public.user_integrations (user_id, kind, status, note, connected_at)
  values (v_user, p_kind, 'Connected', v_note, now())
  on conflict (user_id, kind) do update
    set status = 'Connected', note = excluded.note, connected_at = now(), last_sync_at = null;
end;
$$;

create function public.app_device_disconnect(p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_integrations
    set status = 'Disconnected', note = null
  where user_id = analytics_private.current_app_user() and kind = p_kind and kind <> 'partner';
end;
$$;

create function public.app_devices_set_pref(p_key text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_enabled is null or p_key not in ('autoImportTemperature', 'askBeforeOverwrite') then
    raise exception 'invalid preference' using errcode = '22023';
  end if;
  update public.app_users set
    device_auto_import_temperature = case when p_key = 'autoImportTemperature' then p_enabled else device_auto_import_temperature end,
    device_ask_before_overwrite = case when p_key = 'askBeforeOverwrite' then p_enabled else device_ask_before_overwrite end
  where id = analytics_private.current_app_user();
end;
$$;

-- The app reports what it runs on (shown in the console under Devices & integrations).
create function public.app_report_device(p_platform text, p_app_version text, p_device_model text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version text := nullif(trim(coalesce(p_app_version, '')), '');
  v_model text := nullif(trim(coalesce(p_device_model, '')), '');
begin
  if p_platform is null or p_platform not in ('ios', 'android')
     or char_length(coalesce(v_version, '')) > 20
     or char_length(coalesce(v_model, '')) > 60
  then
    raise exception 'invalid device info' using errcode = '22023';
  end if;
  update public.app_users set
    platform = p_platform::public.platform_type,
    app_version = coalesce(v_version, app_version),
    device_model = v_model
  where id = analytics_private.current_app_user();
end;
$$;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'app\_device\_%' or p.proname in ('app_devices_get', 'app_devices_set_pref', 'app_report_device'))
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;

-- Users › detail: label the new device kinds.
create or replace function public.admin_user_detail(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  u public.app_users;
  e public.engine_runs;
  v_ref text;
  v_cd integer;
  v_len integer;
  v_open_start date;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  select * into u from public.app_users where id = p_user;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
  select * into e from public.engine_runs where user_id = p_user;
  v_ref := analytics_private.user_ref(p_user);

  select start_date into v_open_start from public.user_cycles where user_id = p_user and length_days is null limit 1;
  v_cd := case when v_open_start is not null then current_date - v_open_start + 1 end;
  select coalesce(round(avg(length_days))::int, 29) into v_len from public.user_cycles where user_id = p_user and length_days is not null;

  perform analytics_private.write_audit('user.view', v_ref, '{"masked": true}');

  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', u.id, 'ref', v_ref, 'name', u.full_name, 'email', u.email,
      'phone', regexp_replace(coalesce(u.phone, ''), '(\d{3}) \d{4} (\d{4})$', '\1 •••• \2'),
      'city', u.city, 'province', u.province,
      'age', case when u.birth_year is not null then extract(year from now())::int - u.birth_year end,
      'plan', u.plan, 'mode', u.tracking_mode, 'status', u.status,
      'suspended_reason', u.suspended_reason,
      'deletion_requested', u.deletion_requested_at is not null,
      'joined', to_char(u.created_at at time zone 'Asia/Jakarta', 'DD Mon YYYY'),
      'signup_method', u.signup_method,
      'trying_months', case when u.trying_since is not null then greatest(0, (current_date - u.trying_since) / 30) end,
      'cycles_tracked', (select count(*) from public.user_cycles where user_id = p_user),
      'streak_days', u.current_streak_days,
      'partner', u.partner_name,
      'partner_added', (select pa.partner_name from public.user_partner pa where pa.user_id = u.id),
      'avatar_url', u.avatar_url
    ),
    'tracking', jsonb_build_object(
      'cycle_day', v_cd,
      'cycle_length', v_len,
      'fertile_from', case when e.id is not null then e.predicted_ovulation_day - 5 end,
      'ovulation_day', e.predicted_ovulation_day,
      'engine_headline', case when e.id is not null then e.status || ' · ' || e.headline end,
      'engine_detail', case when e.id is not null then format('Confidence %s%% · inputs: %s · rule set %s', e.confidence,
        case u.tracking_depth when 'lh_cf_bbt' then 'LH, cervical fluid, BBT' when 'lh_cf' then 'LH, cervical fluid'
          when 'lh_only' then 'LH' else 'calendar only' end, e.rule_set) end,
      'signals', (
        select jsonb_agg(jsonb_build_object('key', s.key, 'label', s.label, 'value', coalesce(f.n, 0), 'hint', s.hint) order by s.ord)
        from (values
          ('bbt', 'BBT logs', 'Basal temperature', 'last 30 days', 1),
          ('lh', 'LH tests', 'LH test scan', 'last 30 days', 2),
          ('cf', 'Cervical fluid', 'Cervical fluid', 'last 30 days', 3),
          ('checkin', 'Daily check-ins', 'Daily check-in', 'last 30 days', 4)
        ) as s(key, label, feature, hint, ord)
        left join (
          select feature, count(*) as n from public.feature_usage
          where user_id = p_user and used_at >= now() - interval '30 days' group by feature
        ) f on f.feature = s.feature
      )
    ),
    'engine', case when e.id is null then null else jsonb_build_object(
      'rule_set', e.rule_set, 'mode', u.tracking_mode, 'run_at', e.run_at,
      'status', e.status, 'headline', e.headline, 'confidence', e.confidence,
      'signals_used', e.signals_used, 'ovulation_day', e.predicted_ovulation_day,
      'ovulation_date', to_char(e.predicted_ovulation_date, 'DD Mon'),
      'window', format('CD %s–%s', e.predicted_ovulation_day - 5, e.predicted_ovulation_day),
      'test_date', to_char(e.test_date, 'DD Mon'),
      'contribution', e.contribution, 'flags', e.flags
    ) end,
    'cycles', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'no', c.cycle_no, 'current', c.length_days is null,
        'length', case when c.length_days is null then 'CD ' || v_cd else c.length_days || ' d' end,
        'ovulation', case
          when c.length_days is null then 'Predicted CD ' || e.predicted_ovulation_day
          when c.ovulation_day is null then 'Not confirmed'
          else 'Confirmed CD ' || c.ovulation_day || case when u.tracking_depth = 'lh_cf_bbt' then ' (BBT)' else '' end end,
        'luteal', case when c.luteal_days is null then '—' else c.luteal_days || ' d' end,
        'outcome', c.outcome
      ) order by c.cycle_no desc), '[]'::jsonb)
      from (select * from public.user_cycles where user_id = p_user order by cycle_no desc limit 5) c
    ),
    'medications', jsonb_build_object(
      'counts', (select jsonb_build_object(
        'all', count(*), 'active', count(*) filter (where status = 'active'),
        'purchased', count(*) filter (where purchase_status = 'Purchased'),
        'suggested', count(*) filter (where status = 'suggested'),
        'stopped', count(*) filter (where status = 'stopped'))
        from public.user_medications where user_id = p_user),
      'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'schedule', schedule, 'status', status,
        'purchase_status', purchase_status, 'adherence', adherence_pct
      ) order by array_position(array['active', 'scheduled', 'completed', 'suggested', 'stopped'], status), name), '[]'::jsonb)
        from public.user_medications where user_id = p_user)
    ),
    'doctors', jsonb_build_object(
      'counts', (select jsonb_build_object(
        'all', count(*), 'visited', count(*) filter (where relation = 'visited'),
        'upcoming', count(*) filter (where relation = 'upcoming'),
        'recommended', count(*) filter (where relation = 'recommended'))
        from public.user_care_team where user_id = p_user),
      'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'title', t.title, 'relation', t.relation, 'primary', t.is_primary,
        'summary', jsonb_build_array(t.summary_1, t.summary_2, t.summary_3)
      ) order by array_position(array['visited', 'upcoming', 'recommended'], t.relation), t.is_primary desc), '[]'::jsonb)
        from public.user_care_team t where t.user_id = p_user)
    ),
    'clinics', jsonb_build_object(
      'total', (select count(*) from public.user_clinics where user_id = p_user),
      'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', uc.id, 'name', k.name, 'city', k.city, 'status', uc.status, 'program', uc.program, 'note', uc.note,
        'distance_km', uc.detail -> 'distance_km', 'ivf_lab', k.ivf_lab, 'bpjs', k.bpjs
      ) order by array_position(array['visited', 'recommended', 'saved', 'dismissed'], uc.status)), '[]'::jsonb)
        from public.user_clinics uc join public.clinics k on k.id = uc.clinic_id where uc.user_id = p_user)
    ),
    'subscription', jsonb_build_object(
      'plan', u.plan,
      'label', (select label from public.plan_catalog where plan = u.plan),
      'price_idr', (select price_idr from public.plan_catalog where plan = u.plan),
      'period_months', (select period_months from public.plan_catalog where plan = u.plan),
      'auto_renew', u.auto_renew and u.plan in ('plus_monthly', 'plus_yearly'),
      'next_renewal', to_char(u.plan_renews_at, 'DD Mon YYYY'),
      'payment', u.payment_method,
      'lifetime_idr', case
        when u.plan = 'plus_yearly' then 399000 * ceil(extract(epoch from (now() - u.paid_at)) / 31557600.0)
        when u.plan = 'plus_monthly' then 49000 * ceil(extract(epoch from (now() - u.paid_at)) / 2629800.0)
        else 0 end,
      'pending_plan', u.pending_plan,
      'pending_plan_at', to_char(u.pending_plan_at, 'DD Mon YYYY')
    ),
    'devices', jsonb_build_object(
      'app', case u.platform when 'ios' then 'iOS' else 'Android' end || ' · v' || case when u.app_version = '2.3.x' then '2.3.4' else u.app_version end,
      'device', u.device_model,
      'integrations', (select coalesce(jsonb_agg(jsonb_build_object(
        'kind', kind, 'status', status,
        'label', case kind
          when 'oura' then 'Oura Ring'
          when 'apple_health' then 'Apple Health'
          when 'health_connect' then 'Health Connect'
          when 'bt_thermometer' then 'Bluetooth thermometer'
          when 'hormone_monitor' then 'Hormone monitor'
          when 'smartwatch' then 'Smartwatch'
          else 'Partner' || coalesce(' (' || u.partner_name || ')', '') end,
        'note', note) order by id), '[]'::jsonb)
        from public.user_integrations where user_id = p_user)
    ),
    'privacy', jsonb_build_object(
      'health', u.consent_health, 'research', u.consent_research,
      'marketing', u.consent_marketing, 'discreet', u.discreet_mode
    ),
    'activity', (
      select coalesce(jsonb_agg(jsonb_build_object('text', text, 'at', at) order by at desc), '[]'::jsonb)
      from (
        (select 'Signed in · ' || coalesce(u.device_model, 'device') || ', app v' || u.app_version as text, max(started_at) as at
         from public.app_sessions where user_id = p_user having max(started_at) is not null)
        union all
        (select 'LH test scanned', used_at from public.feature_usage where user_id = p_user and feature = 'LH test scan' order by used_at desc limit 1)
        union all
        (select 'Notification delivered: “' || title || '”', sent_at from public.push_deliveries where user_id = p_user order by sent_at desc limit 1)
        union all
        (select 'Subscribed to Srikandi Plus · Rp ' || replace(to_char(mrr_delta_idr, 'FM999G999G999'), ',', '.') || '/mo', occurred_at
         from public.subscription_events where user_id = p_user and event_type = 'new' order by occurred_at desc limit 1)
        union all
        (select 'Plan changed ' || from_plan || ' → ' || to_plan || ' by admin', created_at from public.plan_changes where user_id = p_user order by created_at desc limit 1)
        union all
        (select 'Admin ' || split_part(coalesce(actor_email, 'admin@'), '@', 1) || '@ viewed profile (masked)', created_at
         from public.audit_log where resource = v_ref and action = 'user.view' order by created_at desc limit 1)
      ) a
    )
  ) into v_result;

  return v_result;
end;
$$;
