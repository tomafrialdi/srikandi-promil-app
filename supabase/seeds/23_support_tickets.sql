-- Dev support inbox: the tickets from the design, plus a realistic mix of open, waiting and resolved ones.

update public.admin_profiles set job_title = 'Midwife' where full_name = 'Dewi Anggraini';

insert into public.support_macros (title, shortcut, body, uses) values
  ('Refund acknowledged', '/refund', 'Hi {name}, I''m sorry about the double charge. I''ve asked billing to refund the duplicate payment — it usually shows in 3–5 working days. You don''t need to do anything else. 🌸', 41),
  ('Scanner issue — thanks', '/scanner', 'Thanks {name}, I can see the photo. I''ve corrected today''s log and our team is looking at the scanner. Could you tell me your app version and phone model?', 28),
  ('Delete my data', '/delete', 'Hi {name}, you can delete your account and data from Account › Privacy › Delete account. It is removed within 30 days, as required by UU PDP. I can start the request for you if you prefer.', 17),
  ('Partner link help', '/partner', 'Hi {name}, to share your fertile window with your partner, open Account › Partner and send the invite again. Your partner must accept it from their own app.', 12),
  ('Need more info', '/info', 'Hi {name}, thanks for reaching out. Could you share a screenshot and the time it happened? That helps us find the cause quickly.', 35);

-- The ticket from the design, with its thread.
insert into public.support_tickets (number, requester_name, channel, category, subject, priority, status, assigned_to, tags, context, first_response_at, created_at, last_message_at)
values (4821, 'Nadia Kusuma', 'app', 'bug', 'LH scanner says Negative but strip clearly positive', 'high', 'pending',
  (select id from public.admin_profiles where full_name = 'Tommy Afrialdi'), array['bug', 'lh-scanner', 'ios'],
  '{"platform":"ios","app_version":"2.4.1","plan":"plus_monthly"}', now() - interval '0 minutes' - interval '8 minutes', now() - interval '20 minutes', now() - interval '12 minutes');
insert into public.support_messages (ticket_id, kind, author_label, body, attachments, created_at)
select id, 'customer', 'Nadia Kusuma', 'Hi, I scanned my LH strip this morning and it says Negative, but the test line is darker than control. This is my peak day! 😣', '[{"name":"lh_strip_0521.jpg"}]'::jsonb, now() - interval '20 minutes' from public.support_tickets where number = 4821;
insert into public.support_messages (ticket_id, kind, author_id, author_label, body, created_at)
select t.id, 'agent', p.id, 'Dewi (Support · Midwife)', 'Thanks Nadia, I can see the photo — you''re right, that looks like a positive. I''ve corrected today''s log to “Peak” so your fertile window is accurate. Our team is checking the scanner. 🌸', now() - interval '8 minutes'
from public.support_tickets t, public.admin_profiles p where t.number = 4821 and p.full_name = 'Dewi Anggraini';
insert into public.support_messages (ticket_id, kind, author_label, body, created_at)
select id, 'event', 'System', 'Dewi overrode LH result → Peak (logged in audit)', now() - interval '8 minutes' + interval '1 second' from public.support_tickets where number = 4821;

-- Everything else, from real seeded app users.
do $$
declare
  subjects text[] := array[
    'Charged twice for Plus yearly|billing|whatsapp|high',
    'How do I delete my account and data?|privacy|web|medium',
    'Partner can''t see fertile window|partner|app|low',
    'Oura sync stopped after update|integrations|app|medium',
    'Promo code not accepted at checkout|billing|app|medium',
    'Cycle prediction off by 3 days|medical|app|medium',
    'App crashes when I open the calendar|bug|app|high',
    'Cannot change my email address|account|web|low',
    'Reminder notifications arrive late|bug|app|medium',
    'Refund request for unused teleconsult|billing|whatsapp|medium',
    'Doctor report PDF is empty|bug|app|high',
    'Question about my data privacy|privacy|web|low',
    'Lost my streak after a server error|bug|app|low',
    'Wrong fertile window after switching to PCOS mode|medical|app|high',
    'Can''t log in with Google|account|app|high'];
  bodies text[] := array['Hi team, this has been happening since yesterday. Can you help?', 'Hello, I need help with this please. Thank you!', 'Hi, sorry to bother you — I tried twice and it still does not work.', 'Good morning, could someone look into this for me?'];
  agents uuid[] := array(select id from public.admin_profiles where role = 'support_agent' and is_active order by full_name limit 4);
  me uuid := '11111111-1111-1111-1111-111111111111';
  u record;
  i integer := 0;
  s text[];
  pick text;
  age interval;
  st text;
  assignee uuid;
  tid uuid;
  resolved boolean;
  responded boolean;
begin
  for u in select id, full_name, email, platform, app_version, plan from public.app_users where status = 'active' order by md5(id::text) limit 34 loop
    i := i + 1;
    pick := subjects[1 + (i % array_length(subjects, 1))];
    s := string_to_array(pick, '|');
    resolved := i % 3 = 0;
    responded := resolved or i % 4 <> 0;
    age := case when resolved then (20 + (i * 7) % 600) * interval '1 hour' when i % 11 = 0 then (26 + i % 40) * interval '1 hour' else (10 + (i * 13) % 900) * interval '1 minute' end;
    st := case when resolved then 'resolved' when responded then 'pending' else 'open' end;
    assignee := case when resolved or responded then coalesce(agents[1 + i % greatest(array_length(agents, 1), 1)], me) when i % 5 = 0 then me else null end;
    if i in (2, 4, 6, 8, 10, 12) and not resolved then assignee := me; end if;
    insert into public.support_tickets (requester_name, requester_email, user_id, channel, category, subject, priority, status, assigned_to, tags, context, first_response_at, resolved_at, csat, created_at, last_message_at)
    values (u.full_name, u.email, u.id, s[3], s[2], s[1], s[4], st, assignee, array[s[2]], jsonb_build_object('platform', u.platform, 'app_version', u.app_version, 'plan', u.plan),
            case when responded then now() - age + interval '35 minutes' end, case when resolved then now() - age + interval '3 hours' end,
            case when resolved and i % 2 = 1 then 4 + (i % 2) when resolved then 5 end, now() - age, now() - age + case when resolved then interval '3 hours' when responded then interval '35 minutes' else interval '0' end)
    returning id into tid;
    insert into public.support_messages (ticket_id, kind, author_label, body, created_at) values (tid, 'customer', u.full_name, bodies[1 + i % 4], now() - age);
    if responded then
      insert into public.support_messages (ticket_id, kind, author_id, author_label, body, created_at)
      values (tid, 'agent', assignee, coalesce(analytics_private.support_author_label(assignee), 'Support'), 'Thanks for reaching out, ' || split_part(u.full_name, ' ', 1) || '! I''m looking into this now and will update you shortly. 🌸', now() - age + interval '35 minutes');
    end if;
    if resolved then
      insert into public.support_messages (ticket_id, kind, author_label, body, created_at) values (tid, 'event', 'System', 'Marked as resolved', now() - age + interval '3 hours');
    end if;
  end loop;
end $$;

select setval(pg_get_serial_sequence('public.support_tickets', 'number'), (select max(number) from public.support_tickets));
