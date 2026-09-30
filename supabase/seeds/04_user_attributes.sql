-- Segmentation attributes for analytics (platform, depth of tracking, exits...).

select setseed(0.7);

with r as materialized (
  select id, random() as r_platform, random() as r_ver, random() as r_partner, random() as r_depth,
         random() as r_ovu, random() as r_streak, random() as r_left, random() as r_reason, random() as r_paywall
  from public.app_users
)
update public.app_users u set
  platform = case when r.r_platform < 0.64 then 'android' else 'ios' end::public.platform_type,
  app_version = case when r.r_ver < 0.71 then '2.4.1' when r.r_ver < 0.93 then '2.3.x' else '2.2.0' end,
  partner_linked = r.r_partner < 0.22,
  tracking_depth = case
    when r.r_depth < 0.40 then 'lh_cf_bbt' when r.r_depth < 0.46 then 'lh_cf'
    when r.r_depth < 0.62 then 'lh_only' else 'calendar_only' end::public.tracking_depth,
  ovulation_confirmed = case
    when u.tracking_mode in ('iui', 'ivf') then null
    else r.r_ovu < case when r.r_depth >= 0.62 then 0.55 else 0.90 end end,
  current_streak_days = case
    when u.last_active_at >= now() - interval '29 days' then floor(power(r.r_streak, 2.2) * 150)::int else 0 end,
  paywall_seen_at = case when u.trial_started_at is not null and r.r_paywall < 0.66
    then u.trial_started_at + interval '4 days' end,
  left_at = case when u.last_active_at < now() - interval '30 days' and r.r_left < 0.42
    then least(now(), u.last_active_at + interval '1 day') end,
  exit_reason = case when u.last_active_at < now() - interval '30 days' and r.r_left < 0.42 then
    case
      when r.r_reason < 0.38 then 'got_pregnant' when r.r_reason < 0.59 then 'taking_break'
      when r.r_reason < 0.71 then 'too_expensive' when r.r_reason < 0.80 then 'switched_app'
      when r.r_reason < 0.88 then 'too_many_notifications' when r.r_reason < 0.95 then 'after_loss_paused'
      else 'other' end::public.exit_reason end
from r
where r.id = u.id;

-- Former paying users (subscription cancelled): roughly 7% monthly churn.
with r as materialized (
  select id, random() as r1, random() as r2, random() as r3, created_at
  from public.app_users
  where plan = 'free' and paid_at is null and created_at < now() - interval '90 days'
),
picked as (
  select id, created_at + interval '9 days' + r2 * 60 * interval '1 day' as paid_at, r3
  from r where r1 < 0.12
)
update public.app_users u set
  paid_at = p.paid_at,
  trial_started_at = coalesce(u.trial_started_at, u.created_at + interval '2 days'),
  churned_at = least(now() - interval '1 day', p.paid_at + (30 + p.r3 * 300) * interval '1 day')
from picked p
where p.id = u.id;

-- Time to pregnancy: deeper signal tracking conceives faster (median ≈ 3.6 vs 7.8 cycles).
update public.app_users set
  cycles_tracked = least(12, greatest(1, round(
    (1 + floor(power(random(), 1.15) * 11)) * case tracking_depth
      when 'lh_cf_bbt' then 0.65 when 'lh_cf' then 0.75 when 'lh_only' then 0.95 else 1.4 end
  )))::int
where conceived_at is not null;
