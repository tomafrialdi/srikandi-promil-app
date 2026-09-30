-- Doctors, clinics, medications, integrations and promo codes.

select setseed(0.11);

insert into public.doctors (name, specialty, clinic_name, city, rating) values
  ('dr. Sarah Lestari, SpOG-KFER', 'Reproductive endocrinology', 'Bunda Women''s Clinic', 'Jakarta Selatan', 4.9),
  ('dr. Bima Santoso, SpAnd', 'Andrology', 'Klinik Permata Hati', 'Surabaya', 4.7),
  ('Nadira Putri, M.Psi', 'Fertility psychologist · teleconsult', 'Srikandi Care', 'Online', 4.8),
  ('dr. Ayu Wibowo, SpOG', 'Obstetrics & gynaecology', 'RS Ibu & Anak Harapan', 'Bandung', 4.6);

insert into public.clinics (name, city, address, rating, bpjs, ivf_lab) values
  ('Bunda Women''s Clinic', 'Jakarta Selatan', 'Jl. Kemang Raya 18, Jakarta Selatan', 4.8, true, false),
  ('RS Ibu & Anak Harapan', 'Bandung', 'Jl. Dago Asri 7, Bandung', 4.5, true, false),
  ('Klinik Permata Hati', 'Surabaya', 'Jl. Darmo Permai 21, Surabaya', 4.7, false, true),
  ('Morula Sehat Medan', 'Medan', 'Jl. Gatot Subroto 90, Medan', 4.6, false, true);

create temporary table care_users as
select id, tracking_mode, partner_linked, plan, city,
  abs(hashtext(id::text || 'care')) % 100 as h
from public.app_users
where last_active_at >= now() - interval '90 days'
  and (tracking_mode in ('iui', 'ivf') or abs(hashtext(id::text || 'care')) % 100 < 14);

-- Primary doctor (visited).
insert into public.user_care_team (user_id, doctor_id, title, relation, is_primary, summary_1, summary_2, summary_3, detail)
select c.id, d.id, d.name, 'visited', true,
  d.specialty || ' · ' || d.clinic_name,
  format('%s visits · %s teleconsults · last %s', 1 + c.h % 4, 1 + c.h % 3, to_char(now() - (3 + c.h % 20) * interval '1 day', 'DD Mon')),
  'Next: ' || to_char(now() + (2 + c.h % 9) * interval '1 day', 'DD Mon') || ' 09:30 · follicle USG',
  jsonb_build_object(
    'clinic_line', d.clinic_name || ' · ' || d.city || ' · ★ ' || d.rating,
    'primary_since', 'Feb 2026',
    'consent', 'active',
    'stats', jsonb_build_object('visits', 1 + c.h % 4, 'teleconsults', 1 + c.h % 3, 'spent_idr', 1500000 + (c.h % 40) * 100000),
    'timeline', jsonb_build_array(
      jsonb_build_object('title', 'Upcoming · follicle ultrasound', 'meta', to_char(now() + (2 + c.h % 9) * interval '1 day', 'Dy DD Mon') || ' · 09:30 · in clinic', 'status', 'Upcoming'),
      jsonb_build_object('title', 'Teleconsult · review cycle report', 'meta', to_char(now() - (3 + c.h % 20) * interval '1 day', 'DD Mon') || ' · 28 min · Doctor report shared by user', 'status', 'Completed'),
      jsonb_build_object('title', 'Visit · treatment planning', 'meta', to_char(now() - (25 + c.h % 20) * interval '1 day', 'DD Mon') || ' · in clinic · Rx note issued', 'status', 'Completed'),
      jsonb_build_object('title', 'First visit · fertility work-up (HSG, AMH)', 'meta', to_char(now() - (90 + c.h % 40) * interval '1 day', 'DD Mon') || ' · referred via app “Find a specialist”', 'status', 'Completed')),
    'shared', jsonb_build_object('reports', '3 (latest ' || to_char(now() - (3 + c.h % 20) * interval '1 day', 'DD Mon') || ')',
      'live_data', 'On · expires ' || to_char(now() + interval '80 days', 'DD Mon'), 'notes', 'Not shared'),
    'review', jsonb_build_object('stars', 5, 'date', to_char(now() - (3 + c.h % 20) * interval '1 day', 'DD Mon'),
      'quote', 'The doctor was so patient explaining every step.')
  )
from care_users c cross join lateral (select * from public.doctors where name like 'dr. Sarah%') d;

-- Upcoming procedure for treatment modes.
insert into public.user_care_team (user_id, doctor_id, title, relation, is_primary, summary_1, summary_2, summary_3, detail)
select c.id, d.id,
  d.name || ' — ' || case c.tracking_mode when 'ivf' then 'IVF egg retrieval' else 'IUI procedure' end,
  'upcoming', false,
  'Bunda Women''s Clinic',
  'Booked ' || to_char(now() - interval '2 days', 'DD Mon') || ' 08:00 · paid Rp 4.5jt',
  'Depends on trigger shot',
  '{}'::jsonb
from care_users c cross join lateral (select * from public.doctors where name like 'dr. Sarah%') d
where c.tracking_mode in ('iui', 'ivf');

insert into public.user_care_team (user_id, doctor_id, title, relation, summary_1, summary_2, summary_3, detail)
select c.id, d.id, d.name, 'recommended', d.specialty || ' · ' || d.clinic_name,
  'For partner · semen analysis', 'Suggested by dr. Sarah · not booked', '{}'::jsonb
from care_users c cross join lateral (select * from public.doctors where name like 'dr. Bima%') d
where c.partner_linked;

insert into public.user_care_team (user_id, doctor_id, title, relation, summary_1, summary_2, summary_3, detail)
select c.id, d.id, d.name, 'recommended', d.specialty,
  'Auto-suggested after 3 “Low” check-ins', 'Declined once', '{}'::jsonb
from care_users c cross join lateral (select * from public.doctors where name like 'Nadira%') d
where c.h % 3 = 0;

-- Clinic journey.
insert into public.user_clinics (user_id, clinic_id, status, program, note, detail)
select c.id, k.id, 'visited',
  case c.tracking_mode when 'iui' then 'IUI program · active' when 'ivf' then 'IVF program · active' else 'Consultation' end,
  format('Since Feb 2026 · %s visits · Rp %sjt paid', 1 + c.h % 5, round((1 + (c.h % 40) / 10.0)::numeric, 1)),
  jsonb_build_object(
    'address', k.address, 'distance_km', round((2 + (c.h % 30) / 2.0)::numeric, 1), 'coverage', 'BPJS partial',
    'rating', k.rating, 'stages', jsonb_build_array('Work-up', 'Stimulation', 'Trigger', 'IUI', '2WW'),
    'stage_index', c.h % 5, 'visits', 1 + c.h % 5, 'paid_idr', 1000000 + (c.h % 50) * 100000,
    'next', to_char(now() + (2 + c.h % 9) * interval '1 day', 'DD Mon') || ' · USG', 'source', 'Find a specialist',
    'bookings', jsonb_build_array(
      jsonb_build_object('date', to_char(now() + (5 + c.h % 9) * interval '1 day', 'DD Mon') || ' 08:00', 'title', 'Procedure', 'amount_idr', 4500000, 'status', 'Paid · upcoming'),
      jsonb_build_object('date', to_char(now() + (2 + c.h % 9) * interval '1 day', 'DD Mon') || ' 09:30', 'title', 'Follicle ultrasound', 'amount_idr', 450000, 'status', 'Booked'),
      jsonb_build_object('date', to_char(now() - (20 + c.h % 10) * interval '1 day', 'DD Mon'), 'title', 'Consult + prescription', 'amount_idr', 350000, 'status', 'Completed'),
      jsonb_build_object('date', to_char(now() - (90 + c.h % 30) * interval '1 day', 'DD Mon'), 'title', 'Fertility work-up (HSG, AMH)', 'amount_idr', 1250000, 'status', 'Completed')))
from care_users c cross join lateral (select * from public.clinics where name like 'Bunda%') k;

insert into public.user_clinics (user_id, clinic_id, status, note)
select c.id, k.id, 'recommended', 'Engine: BPJS option near home city · shown ' || to_char(now() - interval '9 days', 'DD Mon') || ' · not opened'
from care_users c cross join lateral (select * from public.clinics where name like 'RS Ibu%') k where c.h % 3 = 0;

insert into public.user_clinics (user_id, clinic_id, status, note)
select c.id, k.id, 'saved', 'User bookmarked ' || to_char(now() - interval '21 days', 'DD Mon') || ' · for IVF second opinion'
from care_users c cross join lateral (select * from public.clinics where name like 'Klinik Permata%') k where c.tracking_mode = 'ivf' or c.h % 4 = 0;

insert into public.user_clinics (user_id, clinic_id, status, note)
select c.id, k.id, 'dismissed', 'User: “too far”'
from care_users c cross join lateral (select * from public.clinics where name like 'Morula%') k where c.h % 5 = 0;

-- Medications.
insert into public.user_medications (user_id, name, schedule, source, status, purchase_status, adherence_pct, detail)
with u as (
  select id, tracking_mode, abs(hashtext(id::text || 'med')) % 100 as h from public.app_users
  where last_active_at >= now() - interval '90 days' and abs(hashtext(id::text || 'med')) % 100 < 45
),
t(name, schedule, source, status, purchase, dose, purpose, rx, prescriber, modes, min_h, max_h) as (
  values
  ('Folic acid 400 mcg', 'Daily · since Jan 2026', 'Self-added', 'active', 'Purchased', '400 mcg · 1× daily', 'Supplement', false, null, null, 0, 45),
  ('Vitamin D3 1000 IU', 'Stopped ' || to_char(now() - interval '60 days', 'DD Mon'), 'Self-added', 'stopped', 'Purchased', '1000 IU · 1× daily', 'Supplement', false, null, null, 0, 18),
  ('Myo-inositol 2 g', '2× daily · Engine suggestion (irregular cycle)', 'Engine suggestion', 'suggested', 'Dismissed by user', '2 g · 2× daily', 'Cycle regulation', false, null, array['pcos'], 0, 45),
  ('Letrozole 2.5 mg', 'CD 3–7 · last cycle done · Prescribed by dr. Sarah L.', 'Prescribed', 'completed', 'Purchased', '2.5 mg · 1× daily', 'Ovulation induction', true, 'dr. Sarah Lestari, SpOG-KFER', array['pcos', 'iui', 'ivf'], 0, 45),
  ('Ovidrel trigger', to_char(now() + interval '3 days', 'Dy DD Mon') || ' · 21:00 · treatment program', 'Prescribed', 'scheduled', 'Purchased', '250 mcg · single dose', 'Ovulation trigger', true, 'dr. Sarah Lestari, SpOG-KFER', array['iui', 'ivf'], 0, 45),
  ('Progesterone 200 mg', 'From 2 DPO · 14 days · Suggested by dr. Sarah L.', 'Suggested', 'suggested', 'Not purchased', '200 mg · 1× nightly', 'Luteal support', true, 'dr. Sarah Lestari, SpOG-KFER', array['iui', 'ivf'], 0, 45)
)
select u.id, t.name, t.schedule, t.source, t.status, t.purchase,
  case when t.status in ('suggested', 'scheduled') then null else 70 + abs(hashtext(u.id::text || t.name)) % 31 end,
  jsonb_build_object(
    'dose', t.dose, 'purpose', t.purpose, 'rx', t.rx, 'prescribed_by', t.prescriber,
    'doctor_note', case when t.rx then 'rx_note_' || to_char(now() - interval '12 days', 'MMDD') || '.pdf' end,
    'next_cycle', case when t.status = 'completed' then 'Suggested again · same dose' end,
    'reminder', jsonb_build_object('time', '08:00 · after breakfast', 'template', 'Time for ' || split_part(t.name, ' ', 1) || ' {dose} 💊',
      'channel', 'Push (discreet)', 'snoozes', (abs(hashtext(u.id::text || t.name)) % 3) || ' this cycle', 'partner_sees', 'No'),
    'dose_log', (select jsonb_agg(jsonb_build_object('cd', 'CD ' || (2 + g), 'at', to_char(now() - (12 - g) * interval '1 day', 'DD Mon') || ' · 08:0' || (g % 9))) from generate_series(1, 5) g),
    'purchases', jsonb_build_array(jsonb_build_object('item', t.name || ' × 10', 'ref', 'ORD-' || to_char(now() - interval '20 days', 'MMDD') || '-' || (1000 + abs(hashtext(u.id::text)) % 8999),
      'seller', 'Partner pharmacy · Kimia Farma', 'price_idr', 92000 + (abs(hashtext(t.name)) % 10) * 10000, 'status', case when t.purchase = 'Purchased' then 'Delivered' else 'Not purchased' end)),
    'side_effects', jsonb_build_array('Mild headache · early in the cycle', 'No bleeding issues'),
    'catalogue', jsonb_build_object('id', 'med_' || lower(regexp_replace(split_part(t.name, ' ', 1), '[^A-Za-z]', '', 'g')), 'bpom', 'DKL' || (1000000000 + abs(hashtext(t.name)) % 999999999))
  )
from u join t on (t.modes is null or u.tracking_mode::text = any (t.modes)) and u.h between t.min_h and t.max_h
where t.name not in ('Vitamin D3 1000 IU', 'Letrozole 2.5 mg', 'Ovidrel trigger', 'Progesterone 200 mg')
   or abs(hashtext(u.id::text || t.name)) % 100 < case t.name when 'Vitamin D3 1000 IU' then 35 when 'Letrozole 2.5 mg' then 90 else 85 end;

-- Devices & integrations.
insert into public.user_integrations (user_id, kind, status, note)
select id, 'oura', 'Connected', null from public.app_users where abs(hashtext(id::text || 'oura')) % 100 < 12;
insert into public.user_integrations (user_id, kind, status, note)
select id, 'apple_health', 'Connected', null from public.app_users where platform = 'ios' and abs(hashtext(id::text || 'ah')) % 100 < 40;
insert into public.user_integrations (user_id, kind, status, note)
select id, 'partner', 'Linked', '3 shares' from public.app_users where partner_linked;

insert into public.promo_codes (code, description, audience, discount_pct, applies_to, duration_months, max_uses, used_count, valid_until, sponsor_plan) values
  ('BUNDA-CLINIC', '100% off Plus Yearly for 12 months', 'Bunda Women''s Clinic patients', 100, 'plus_yearly', 12, 300, 214, '2026-12-31', 'clinic_sponsored'),
  ('RAMADAN30', '30% off Plus Yearly', 'Everyone', 30, 'plus_yearly', 12, 5000, 1710, '2026-12-31', null),
  ('PARTNER20', '20% off Plus Yearly', 'Partner-invited users', 20, 'plus_yearly', 12, 1000, 302, '2026-12-31', null);
