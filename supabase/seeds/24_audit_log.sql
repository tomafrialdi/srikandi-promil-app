-- Dev audit log: the events, alert and data subject requests from the design, plus background noise so the filters have something to show.
-- Rows are backdated; the chain trigger still links each one to the previous row.

do $$
declare
  dewi uuid := '22222222-2222-2222-2222-000000000024';
  tommy uuid := '11111111-1111-1111-1111-111111111111';
  bayu uuid := '22222222-2222-2222-2222-000000000010';
  rina uuid := '22222222-2222-2222-2222-000000000018';
  sarah uuid := '22222222-2222-2222-2222-000000000006';
  nadia uuid;
  nadia_ref text;
  u record;
  i integer;
  v_at timestamptz;
begin
  select id into nadia from public.app_users order by created_at offset 10 limit 1;
  nadia_ref := analytics_private.user_ref(nadia);

  -- The health-data access from the design (TCK-4821), with the fields that were opened.
  insert into public.audit_log (actor_id, actor_email, action, resource, ip, device, metadata, created_at) values
    (dewi, 'dewi.anggraini@srikandipromil.id', 'user.unmask.engine_log', nadia_ref, '103.12.44.7', 'Chrome · macOS', jsonb_build_object(
      'summary', 'Unmasked health data (reason: TCK-4821)', 'reason', 'Ticket TCK-4821 · LH scanner bug', 'ticket', 'TCK-4821', 'user_id', nadia,
      'duration_s', 372, 'auth', 'Passkey + 2FA',
      'fields', jsonb_build_array(
        jsonb_build_object('label', 'LH test photos (3)', 'access', 'viewed'),
        jsonb_build_object('label', 'LH results · cycle 9', 'access', 'edited'),
        jsonb_build_object('label', 'BBT logs · cycle 9', 'access', 'viewed'),
        jsonb_build_object('label', 'Cervical fluid logs', 'access', 'viewed'),
        jsonb_build_object('label', 'Personal notes & mood', 'access', 'none'),
        jsonb_build_object('label', 'Intimacy logs', 'access', 'none'))), now() - interval '3 hours 20 minutes'),
    (dewi, 'dewi.anggraini@srikandipromil.id', 'health.lh_override', nadia_ref, '103.12.44.7', 'Chrome · macOS', jsonb_build_object(
      'summary', 'Overrode LH result High → Peak', 'ticket', 'TCK-4821', 'user_id', nadia, 'risk', 'med'), now() - interval '3 hours 16 minutes'),
    (tommy, 'admin@srikandipromil.id', 'admin.role_change', '22222222-2222-2222-2222-000000000010', '36.84.10.2', 'Safari · macOS', jsonb_build_object(
      'summary', 'Changed role: Bayu → Engine engineer', 'from', 'Analyst', 'to', 'Engine engineer', 'from_role', 'analyst', 'to_role', 'engine_engineer',
      'target_id', bayu, 'target_name', 'Bayu Pratama', 'ticket', 'CHG-0412 · engine v3.5 rollout', 'approver', 'Rina S. · +1 min',
      'before', jsonb_build_object('role', 'analyst', 'engine', 'view', 'health_data', 'none', 'content', 'view', 'expires', null),
      'after', jsonb_build_object('role', 'engine_engineer', 'engine', 'full', 'health_data', 'masked', 'content', 'none', 'expires', null),
      'impact', jsonb_build_array('Can now edit fertility-engine rules & canary rollout', 'Health data remains masked (no unmask permission)', 'Loses content view access')),
     now() - interval '3 hours 30 minutes');

  -- Background noise: a realistic mix over the last two days.
  for i in 1..70 loop
    v_at := now() - (random() * 46 * interval '1 hour');
    insert into public.audit_log (actor_id, actor_email, action, resource, ip, device, metadata, created_at)
    select a.actor, a.email, a.action, a.resource, a.ip, a.device, jsonb_build_object('summary', a.summary), v_at
    from (values
      (sarah, 'sarah.lestari@srikandipromil.id', 'content.approve', 'art_2291', '182.1.7.3', 'Safari · iOS', 'Approved article art_2291'),
      (rina, 'rina.maharani@srikandipromil.id', 'community.remove', 'post_77120', '114.5.2.9', 'Chrome · Android', 'Removed post + warned user'),
      (bayu, 'bayu.pratama@srikandipromil.id', 'engine.canary', 'engine/pcos', '10.0.1.8', 'Chrome · Linux', 'Expanded canary v3.5 → 5%'),
      (tommy, 'admin@srikandipromil.id', 'plan.update', 'plus_monthly', '36.84.10.2', 'Safari · macOS', 'Updated plan Plus monthly'),
      (dewi, 'dewi.anggraini@srikandipromil.id', 'support.reply', 'TCK-4830', '103.12.44.7', 'Chrome · macOS', 'Replied to TCK-4830'),
      (null::uuid, null, 'payment.captured', 'INV-2605-18422', '10.0.3.14', 'api', 'Payment captured · INV-2605-18422'),
      (tommy, 'admin@srikandipromil.id', 'auth.sign_in', 'console', '36.84.10.2', 'Safari · macOS', 'Signed in'),
      (dewi, 'dewi.anggraini@srikandipromil.id', 'user.view.doctor_care', null, '103.12.44.7', 'Chrome · macOS', 'Opened a care summary')
    ) as a(actor, email, action, resource, ip, device, summary)
    order by random() limit 1;
  end loop;

  -- Worker events carry a system marker instead of an actor.
  insert into public.audit_log (action, resource, ip, device, metadata, created_at)
  select 'payment.captured', 'INV-2605-' || (18400 + n), '10.0.3.14', 'api', jsonb_build_object('summary', 'Payment captured · INV-2605-' || (18400 + n), 'system', 'Midtrans webhook'), now() - (n * interval '95 minutes')
  from generate_series(1, 8) n;

  -- Failed logins from one IP (five in an hour → "flagged IP").
  for i in 1..5 loop
    insert into public.audit_log (actor_email, action, resource, ip, device, metadata, created_at)
    values (null, 'auth.failed_login', 'dewi@srikandipromil.id', '182.3.9.201', 'Chrome · Windows', jsonb_build_object('summary', 'Failed login' || case when i = 5 then ' × 5 · IP blocked 1h' else '' end), now() - (i * interval '4 minutes') - interval '5 hours');
  end loop;
  insert into public.audit_log (actor_email, action, resource, ip, device, metadata, created_at) values
    (null, 'auth.failed_login', 'laras.wulandari@srikandipromil.id', '36.80.4.18', 'Safari · iOS', '{"summary":"Failed login"}', now() - interval '9 hours'),
    (null, 'auth.failed_login', 'unknown@example.com', '45.12.9.77', 'Client · Linux', '{"summary":"Failed login"}', now() - interval '13 hours');

  -- Nine profiles unmasked by Dewi in the last 20 minutes: raises the "unusual unmask volume" alert via the detection trigger.
  for u in select s.id, analytics_private.user_ref(s.id) as ref, row_number() over (order by s.created_at) as n from (select id, created_at from public.app_users order by created_at offset 20 limit 9) s loop
    insert into public.audit_log (actor_id, actor_email, action, resource, ip, device, metadata, created_at)
    values (dewi, 'dewi.anggraini@srikandipromil.id', 'user.unmask.engine_log', u.ref, '103.12.44.7', 'Chrome · macOS',
      jsonb_build_object('summary', 'Unmasked health data' || case when u.n in (1, 2, 4) then ' (reason: TCK-' || (4829 + u.n) || ')' else '' end, 'user_id', u.id,
        'ticket', case when u.n in (1, 2, 4) then 'TCK-' || (4829 + u.n) else null end),
      now() - ((20 - u.n * 2) * interval '1 minute'));
  end loop;
end;
$$;

insert into public.audit_alerts (rule_key, severity, title, detail, actor_id, subject, created_at)
select 'unusual_unmask', 'high', 'Unusual unmask volume', 'Dewi A. unmasked 9 profiles in 20 min (normal: ≤ 2/day)', '22222222-2222-2222-2222-000000000024', 'unmask_rate > 5 / 30 min', now() - interval '12 minutes'
where not exists (select 1 from public.audit_alerts where rule_key = 'unusual_unmask' and status <> 'closed');

insert into public.audit_alerts (rule_key, severity, title, detail, actor_id, subject, created_at) values
  ('new_country', 'medium', 'Login from new country', 'Bayu P. · Singapore · passkey OK · 2FA passed', '22222222-2222-2222-2222-000000000010', 'first login from SG', now() - interval '2 hours');

-- Data subject requests (UU PDP): deletion has a 30-day legal deadline.
insert into public.pdp_requests (type, user_id, subject_ref, status, status_note, received_at, due_at, completed_at, owner_id, identity_check, plan_note, systems, timeline, certificate_at)
select 'deletion', u.id, analytics_private.user_ref(u.id), 'in_progress', null, now() - interval '14 days', now() + interval '16 days', null, '22222222-2222-2222-2222-000000000001', 'Passed · OTP + email', 'Free · no active subscription',
  jsonb_build_array(
    jsonb_build_object('name', 'App database (profile, cycles, logs)', 'state', 'deleted', 'note', 'Deleted'),
    jsonb_build_object('name', 'Community posts', 'state', 'anonymised', 'note', 'Anonymised · 12 posts'),
    jsonb_build_object('name', 'Analytics warehouse', 'state', 'scheduled', 'note', 'Scheduled'),
    jsonb_build_object('name', 'Encrypted backups', 'state', 'scheduled', 'note', 'Auto-purge in 35 days'),
    jsonb_build_object('name', 'Payment records (3 invoices)', 'state', 'retained', 'note', 'Retained 10 y · tax law exemption'),
    jsonb_build_object('name', 'Partner clinic', 'state', 'notified', 'note', 'Notified · awaiting confirmation')),
  jsonb_build_array(
    jsonb_build_object('at', now() - interval '14 days', 'text', 'Request received · auto-acknowledged to user', 'state', 'done'),
    jsonb_build_object('at', now() - interval '14 days' + interval '7 minutes', 'text', 'Identity verified (OTP)', 'state', 'done'),
    jsonb_build_object('at', now() - interval '13 days', 'text', 'App data deleted · user emailed confirmation', 'state', 'done'),
    jsonb_build_object('at', null, 'text', 'Final certificate of deletion (after backups purge)', 'state', 'pending')),
  null
from (select id from public.app_users order by created_at offset 30 limit 1) u;

insert into public.pdp_requests (type, user_id, subject_ref, status, status_note, received_at, due_at, completed_at, owner_id, identity_check, plan_note, systems, timeline)
select t.type, u.id, analytics_private.user_ref(u.id), t.status, t.note, now() - t.recv, now() - t.recv + interval '30 days', case when t.status = 'completed' then now() - interval '2 days' end,
  '22222222-2222-2222-2222-000000000001', t.idc, 'Plus · active', '[]', jsonb_build_array(jsonb_build_object('at', now() - t.recv, 'text', 'Request received', 'state', 'done'))
from (values
  ('portability', 'completed', 'Delivered', interval '11 days', 'Passed · OTP + email', 31),
  ('correction', 'blocked', 'Awaiting ID verification', interval '5 days', 'Pending', 32),
  ('access', 'new', null, interval '2 days', 'Pending', 33)) as t(type, status, note, recv, idc, off)
join lateral (select id from public.app_users order by created_at offset t.off limit 1) u on true;
