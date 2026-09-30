-- Analytics: extra enums + user attributes used for segmentation.

create type public.platform_type as enum ('android', 'ios');
create type public.tracking_depth as enum ('lh_cf_bbt', 'lh_cf', 'lh_only', 'calendar_only');
create type public.acquisition_channel as enum (
  'organic', 'tiktok', 'instagram', 'clinic_qr', 'google_ads', 'partner_invite'
);
create type public.exit_reason as enum (
  'got_pregnant', 'taking_break', 'too_expensive', 'switched_app',
  'too_many_notifications', 'after_loss_paused', 'other'
);
create type public.cancel_reason as enum ('got_pregnant', 'price', 'not_using_enough', 'payment_failed', 'other');
create type public.subscription_event_type as enum ('new', 'upgrade', 'downgrade', 'reactivation', 'churn');
create type public.revenue_source as enum ('b2b_clinic', 'teleconsult', 'refund');
create type public.care_event_type as enum ('pregnancy_loss', 'counsellor_session', 'wellbeing_trigger');

alter table public.app_users
  add column platform public.platform_type not null default 'android',
  add column app_version text not null default '2.4.1',
  add column partner_linked boolean not null default false,
  add column tracking_depth public.tracking_depth not null default 'calendar_only',
  add column ovulation_confirmed boolean,
  add column current_streak_days integer not null default 0,
  add column paywall_seen_at timestamptz,
  add column churned_at timestamptz,
  add column left_at timestamptz,
  add column exit_reason public.exit_reason;

-- Helpers live in a schema that PostgREST does not expose.
create schema analytics_private;
revoke all on schema analytics_private from public, anon, authenticated;

create function analytics_private.jkt(p_day date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$ select p_day::timestamp at time zone 'Asia/Jakarta' $$;

create function analytics_private.pct(p_part numeric, p_total numeric, p_digits integer default 1)
returns numeric
language sql
immutable
set search_path = ''
as $$ select round(100.0 * p_part / nullif(p_total, 0), p_digits) $$;
