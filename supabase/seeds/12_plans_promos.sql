-- Plan catalogue details and promo codes.

update public.plan_catalog set
  plan_id = 'plus_monthly_v2', billing_label = 'Every month', trial_days = 7, grace_days = 3,
  badge_label = 'Active', savings_label = null,
  price_google_idr = 49000, price_apple_idr = 49000, google_tier = 'IDR 49k', apple_tier = 'tier 5 · IDR 49k',
  features = '[{"label":"Doctor-ready PDF reports","included":true},{"label":"Treatment mode (IUI / IVF)","included":true},{"label":"1 counsellor session / month","included":false},{"label":"Advanced partner sharing","included":true},{"label":"Unlimited LH scans (free: 10/cycle)","included":true},{"label":"Priority support (midwife chat)","included":true}]'
where plan = 'plus_monthly';

update public.plan_catalog set
  plan_id = 'plus_yearly_v2', billing_label = 'Every 12 months', trial_days = 7, grace_days = 3,
  badge_label = 'Most popular', savings_label = 'Save 32%',
  price_google_idr = 399000, price_apple_idr = 399000, google_tier = 'IDR 399k', apple_tier = 'tier 38 · IDR 399k',
  features = '[{"label":"Doctor-ready PDF reports","included":true},{"label":"Treatment mode (IUI / IVF)","included":true},{"label":"1 counsellor session / month","included":true},{"label":"Advanced partner sharing","included":true},{"label":"Unlimited LH scans (free: 10/cycle)","included":true},{"label":"Priority support (midwife chat)","included":true}]'
where plan = 'plus_yearly';

update public.plan_catalog set
  plan_id = 'clinic_sponsored_v1', billing_label = 'Every 12 months', trial_days = 0, grace_days = 7,
  badge_label = 'B2B', savings_label = null,
  price_google_idr = null, price_apple_idr = null,
  features = '[{"label":"Doctor-ready PDF reports","included":true},{"label":"Treatment mode (IUI / IVF)","included":true},{"label":"1 counsellor session / month","included":true},{"label":"Advanced partner sharing","included":true},{"label":"Unlimited LH scans (free: 10/cycle)","included":true},{"label":"Priority support (midwife chat)","included":false}]'
where plan = 'clinic_sponsored';

-- Existing codes (from the Users seed): fill the new fields.
update public.promo_codes set
  plans = '{plus_yearly}', channels = '{midtrans,google_play}', eligibility = 'New & free users', per_user_limit = 1,
  starts_at = now() - interval '60 days', ends_at = now() + interval '9 days', status = 'active',
  internal_note = 'Ramadan 2026 — Instagram, TikTok & in-app banner', duration_kind = 'first_billing', max_uses = 1000
where code = 'RAMADAN30';

update public.promo_codes set
  plans = '{plus_yearly}', channels = '{midtrans}', eligibility = 'Clinic-sponsored', per_user_limit = 1,
  starts_at = now() - interval '90 days', ends_at = '2026-12-31 23:59+07', status = 'active',
  internal_note = 'Bunda Women''s Clinic patients', duration_kind = 'months', discount_type = 'sponsored', max_uses = 300
where code = 'BUNDA-CLINIC';

update public.promo_codes set
  plans = '{plus_monthly}', channels = '{midtrans,google_play}', eligibility = 'Partner-linked users', per_user_limit = 1,
  starts_at = now() - interval '40 days', ends_at = now() + interval '60 days', status = 'active',
  internal_note = 'Partner invite programme', duration_kind = 'first_billing', max_uses = 2000
where code = 'PARTNER20';

insert into public.promo_codes (
  code, description, audience, discount_pct, applies_to, duration_months, max_uses, used_count, valid_until,
  discount_type, trial_extend_days, duration_kind, plans, channels, eligibility, per_user_limit, starts_at, ends_at,
  internal_note, status
) values
  ('PROMILBARU', 'Trial 7 → 14 days', 'New users · in-app', 0, 'plus_monthly', 1, null, 0, '2099-12-31',
   'extend_trial', 7, 'first_billing', '{plus_monthly,plus_yearly}', '{midtrans,google_play,apple}', 'New users', 1,
   now() - interval '200 days', null, 'Onboarding trial extension', 'active'),
  ('HARIIBU25', '25% off · Plus yearly', 'Public', 25, 'plus_yearly', 12, 500, 0, (current_date + 52),
   'percentage', null, 'first_billing', '{plus_yearly}', '{midtrans,google_play,apple}', 'Public', 1,
   now() + interval '50 days', now() + interval '52 days', 'Mother''s Day campaign — Instagram & TikTok', 'active'),
  ('TIKTOK50', '50% first month', 'TikTok campaign', 50, 'plus_monthly', 1, 1500, 0, (current_date + 15),
   'percentage', null, 'first_billing', '{plus_monthly}', '{midtrans}', 'Free users', 1,
   now() - interval '45 days', now() + interval '15 days', 'TikTok creator campaign', 'paused'),
  ('NEWYEAR26', '20% off yearly', 'Public', 20, 'plus_yearly', 12, 1000, 0, (current_date - 240),
   'percentage', null, 'first_billing', '{plus_yearly}', '{midtrans,google_play,apple}', 'Public', 1,
   now() - interval '270 days', now() - interval '240 days', 'New Year campaign', 'active');

update public.promo_codes set valid_until = ends_at::date where ends_at is not null;
update public.promo_codes set created_by = '11111111-1111-1111-1111-111111111111';
