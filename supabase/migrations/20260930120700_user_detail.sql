-- Users › detail page and the four detail modals.

create function public.admin_user_detail(p_user uuid)
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
      'partner', u.partner_name
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
        'label', case kind when 'oura' then 'Oura Ring' when 'apple_health' then 'Apple Health' else 'Partner' || coalesce(' (' || u.partner_name || ')', '') end,
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

-- Modals that open health data need a reason (ticket reference); every open is logged.
create function analytics_private.require_reason(p_reason text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'a reason or ticket reference is required' using errcode = '22023';
  end if;
  return trim(p_reason);
end;
$$;

create function public.admin_user_engine_log(p_user uuid, p_reason text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text;
  u public.app_users;
  e public.engine_runs;
begin
  perform public.assert_console_admin();
  v_reason := analytics_private.require_reason(p_reason);

  select * into u from public.app_users where id = p_user;
  select * into e from public.engine_runs where user_id = p_user;
  if u.id is null or e.id is null then
    raise exception 'no engine run for this user' using errcode = 'P0002';
  end if;

  perform analytics_private.write_audit('user.unmask.engine_log', analytics_private.user_ref(p_user), jsonb_build_object('reason', v_reason));

  return jsonb_build_object(
    'name', u.full_name, 'cycle_no', e.cycle_no, 'mode', u.tracking_mode, 'rule_set', e.rule_set,
    'run_at', e.run_at, 'status', e.status, 'confidence', e.confidence,
    'predicted_ovulation', 'CD ' || e.predicted_ovulation_day || ' · ' || to_char(e.predicted_ovulation_date, 'DD Mon'),
    'overrides_count', jsonb_array_length(e.overrides),
    'day_by_day', e.day_by_day, 'decision_trace', e.decision_trace, 'overrides', e.overrides,
    'logged_by', (select auth.jwt() ->> 'email'), 'reason', v_reason
  );
end;
$$;

create function public.admin_user_medication(p_medication uuid, p_reason text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text;
  m public.user_medications;
  v_name text;
begin
  perform public.assert_console_admin();
  v_reason := analytics_private.require_reason(p_reason);

  select * into m from public.user_medications where id = p_medication;
  if m.id is null then
    raise exception 'medication not found' using errcode = 'P0002';
  end if;
  select full_name into v_name from public.app_users where id = m.user_id;

  perform analytics_private.write_audit('user.unmask.medication', analytics_private.user_ref(m.user_id),
    jsonb_build_object('reason', v_reason, 'medication', m.name));

  return jsonb_build_object(
    'user_name', v_name, 'id', m.id, 'name', m.name, 'schedule', m.schedule, 'source', m.source,
    'status', m.status, 'purchase_status', m.purchase_status, 'adherence', m.adherence_pct, 'detail', m.detail,
    'logged_by', (select auth.jwt() ->> 'email'), 'reason', v_reason
  );
end;
$$;

create function public.admin_user_doctor_care(p_link uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.user_care_team;
  d public.doctors;
  v_name text;
begin
  perform public.assert_console_admin();

  select * into t from public.user_care_team where id = p_link;
  if t.id is null then
    raise exception 'care link not found' using errcode = 'P0002';
  end if;
  select * into d from public.doctors where id = t.doctor_id;
  select full_name into v_name from public.app_users where id = t.user_id;

  perform analytics_private.write_audit('user.view.doctor_care', analytics_private.user_ref(t.user_id), jsonb_build_object('doctor', d.name));

  return jsonb_build_object(
    'user_name', v_name, 'doctor', d.name, 'relation', t.relation, 'primary', t.is_primary,
    'detail', t.detail,
    'others', (select coalesce(jsonb_agg(jsonb_build_object(
        'title', o.title, 'relation', o.relation, 'summary', jsonb_build_array(o.summary_1, o.summary_2, o.summary_3))
        order by o.relation), '[]'::jsonb)
      from public.user_care_team o where o.user_id = t.user_id and o.id <> t.id and o.doctor_id <> t.doctor_id)
  );
end;
$$;

create function public.admin_user_clinic_journey(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  perform public.assert_console_admin();
  select full_name into v_name from public.app_users where id = p_user;
  if v_name is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  perform analytics_private.write_audit('user.view.clinic_journey', analytics_private.user_ref(p_user));

  return jsonb_build_object(
    'user_name', v_name,
    'counts', (select jsonb_build_object(
      'all', count(*), 'visited', count(*) filter (where status = 'visited'),
      'recommended', count(*) filter (where status = 'recommended'),
      'saved', count(*) filter (where status = 'saved'), 'dismissed', count(*) filter (where status = 'dismissed'))
      from public.user_clinics where user_id = p_user),
    'current', (select jsonb_build_object(
        'name', k.name, 'city', k.city, 'program', uc.program, 'detail', uc.detail, 'rating', k.rating)
      from public.user_clinics uc join public.clinics k on k.id = uc.clinic_id
      where uc.user_id = p_user and uc.status = 'visited' limit 1),
    'others', (select coalesce(jsonb_agg(jsonb_build_object(
        'name', k.name, 'city', k.city, 'status', uc.status, 'note', uc.note, 'rating', k.rating, 'bpjs', k.bpjs, 'ivf_lab', k.ivf_lab)
        order by array_position(array['recommended', 'saved', 'dismissed'], uc.status)), '[]'::jsonb)
      from public.user_clinics uc join public.clinics k on k.id = uc.clinic_id
      where uc.user_id = p_user and uc.status <> 'visited')
  );
end;
$$;
