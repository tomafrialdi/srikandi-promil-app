-- Notifications: 42 campaigns (8 hand-written + 34 generated), a week of hourly opens and the failure breakdown.

select setseed(0.15);

create temporary table seed_today as select (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta') as d;

insert into public.notification_campaigns
  (name, channel, kind, status, audience_label, title, body, discreet_body, deep_link, category, trigger_event, send_time, send_at,
   sent_count, delivered_count, opened_count, optout_count, progress_pct, last_run_at, created_at)
select v.name, v.channel::public.notification_channel, v.kind::public.notification_kind, v.status::public.notification_status, v.aud,
       v.title, v.body, 'Daily reminder 🌸 Tap to check in', v.link, v.cat, v.trig, case when v.kind = 'trigger' then '07:00 user local time' end, v.send_at,
       v.sent, round(v.sent * v.dl / 100.0), round(round(v.sent * v.dl / 100.0) * v.op / 100.0), round(v.sent * 0.003), v.prog, v.last_run, now() - interval '40 days'
from seed_today t, lateral (values
  ('Fertile window opens — LH nudge', 'push', 'trigger', 'active', 'Fertile · TTC/PCOS', 'Your fertile window is open 🌸', 'Hi {first_name}, peak day is likely tomorrow. Log an LH test this afternoon to confirm.', 'srikandi://log/lh', 'Cycle · fertile window', 'Engine status → Fertile window opens', null::timestamptz, 276000, 98.1, 24.6, null::integer, t.d + interval '7 hours'),
  ('2WW day 7 — calm breathing', 'push', 'trigger', 'active', '2WW · 7 DPO', 'A calm moment for day 7', 'Take two minutes for a slow breathing exercise, {first_name}.', 'srikandi://care/breathing', 'Cycle · 2WW', 'Engine status → 2WW day 7', null, 88000, 97.9, 31.2, null, t.d + interval '7 hours'),
  ('Test day reminder (12 DPO)', 'push', 'trigger', 'active', '2WW · 12 DPO', 'Test day is near', 'Most tests are reliable from 12 DPO. Take yours tomorrow morning.', 'srikandi://log/test', 'Cycle · 2WW', 'Engine status → 2WW day 12', null, 41000, 98.4, 38.9, null, t.d + interval '7 hours'),
  ('Plus yearly — 30% off Ramadan', 'push', 'scheduled', 'scheduled', 'Free · active 30d', 'Ramadan offer: Plus yearly −30%', 'Upgrade before Ramadan and save 30% on Plus yearly.', 'srikandi://plus', 'Promo', null, t.d + interval '28 days 19 hours', 0, 0, 0, null, null),
  ('New article: fertile window', 'push', 'one_off', 'sending', 'Follicular + Fertile', 'New: your fertile window explained', 'Read the 6 days that matter most, {first_name}.', 'srikandi://articles/fertile-window', 'Content', null, null, 24500, 97.2, 12.1, 64, now()),
  ('Partner invite nudge', 'push', 'trigger', 'paused', 'No partner linked', 'Trying together?', 'Invite your partner to share the journey.', 'srikandi://partner/invite', 'Partner', 'User signs up · day 7 without partner', null, 112000, 97.5, 9.8, null, t.d - interval '17 days'),
  ('May cycle recap', 'email', 'one_off', 'sent', 'All active', 'Your May cycle recap', 'See how your month went.', 'srikandi://insights', 'Insights', null, null, 98200, 99.1, 41.3, null, t.d - interval '30 days'),
  ('App update 2.4 — LH scanner', 'push', 'one_off', 'failed', 'iOS < 2.4', 'Scan your LH strip in seconds', 'Update to 2.4 to try the new LH scanner.', 'srikandi://update', 'Product', null, null, 12000, 61.4, 0, null, t.d - interval '12 days')
) as v(name, channel, kind, status, aud, title, body, link, cat, trig, send_at, sent, dl, op, prog, last_run);

do $$
declare
  topics text[] := array['Cycle recap', 'Log reminder', 'Hydration tip', 'Sleep check-in', 'Partner update', 'Clinic visit reminder', 'Medication reminder', 'Article digest', 'Streak celebration', 'Welcome series', 'Progesterone check', 'Cycle day 1 nudge'];
  auds text[] := array['All active', 'Follicular · TTC', 'Fertile · PCOS', '2WW · all', 'Free · active 30d', 'Plus members', 'IUI/IVF · stimulation', 'No log in 7d'];
  cats text[] := array['Cycle', 'Content', 'Care', 'Promo', 'Product', 'Partner'];
  g integer;
  h integer;
  st public.notification_status;
  ch public.notification_channel;
  sent integer;
  dl numeric;
begin
  for g in 1..34 loop
    h := abs(hashtext('notif' || g));
    st := case when g <= 7 then 'active' when g <= 12 then 'scheduled' when g <= 16 then 'draft' when g = 17 then 'failed' else 'sent' end;
    ch := case when h % 10 < 7 then 'push' when h % 10 < 9 then 'in_app' else 'email' end;
    sent := case when st in ('draft', 'scheduled') then 0 else 5000 + h % 40000 end;
    dl := case when st = 'failed' then 60 + h % 8 else 96 + (h % 30) / 10.0 end;

    insert into public.notification_campaigns
      (name, channel, kind, status, audience_label, title, body, discreet_body, deep_link, category, trigger_event, send_time, send_at,
       sent_count, delivered_count, opened_count, optout_count, last_run_at, created_at)
    values (
      topics[1 + g % 12] || case when g > 12 then ' #' || (g / 12 + 1) else '' end,
      ch,
      case when st = 'active' then 'trigger' when st = 'scheduled' then 'scheduled' else 'one_off' end::public.notification_kind,
      st, auds[1 + g % 8],
      topics[1 + g % 12], 'Hi {first_name}, a quick note from Srikandi Promil.', case when ch = 'push' then 'Daily reminder 🌸 Tap to check in' else '' end,
      'srikandi://home', cats[1 + g % 6],
      case when st = 'active' then 'Engine status → ' || topics[1 + g % 12] end,
      case when st = 'active' then '07:00 user local time' end,
      case when st = 'scheduled' then now() + make_interval(days => g - 6) end,
      sent, round(sent * dl / 100.0), round(round(sent * dl / 100.0) * (8 + (h % 320) / 10.0) / 100.0), round(sent * 0.003),
      case when st in ('active', 'sent', 'failed') then now() - make_interval(days => 1 + g % 28) end,
      now() - interval '60 days'
    );
  end loop;
end;
$$;

-- Drafts stay untouched for a while.
update public.notification_campaigns set updated_at = now() - interval '9 days' where status = 'draft';

insert into public.notification_hourly_opens (day, hour, opens)
select (current_date - d), h, round(w * (0.85 + (abs(hashtext(d::text || h::text)) % 30) / 100.0) * 30)
from generate_series(0, 6) d,
     unnest(array[0, 0, 0, 0, 0, 0, 0, 100, 72, 40, 30, 28, 34, 38, 30, 26, 30, 44, 58, 66, 52, 0, 0, 0]) with ordinality as x(w, ord),
     lateral (select (ord - 1)::smallint as h) hh
where w > 0;

insert into public.notification_failures (campaign_id, reason, count, occurred_at)
select c.id, r.reason, r.n, c.last_run_at
from public.notification_campaigns c,
     (values ('expired_apns_token', 2222), ('app_uninstalled', 1343), ('fcm_throttled', 648), ('invalid_deep_link', 418)) as r(reason, n)
where c.name = 'App update 2.4 — LH scanner';
