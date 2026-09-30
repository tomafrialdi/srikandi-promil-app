-- Billing history, promo redemptions and change history.

select setseed(0.13);

create temporary table billing_users as
select u.id, u.platform, u.paid_at, u.churned_at,
  (select e.plan from public.subscription_events e where e.user_id = u.id and e.event_type = 'new' order by e.occurred_at limit 1) as bill_plan,
  abs(hashtext(u.id::text)) % 100 as h
from public.app_users u
where u.paid_at is not null;

insert into public.transactions (
  invoice_no, user_id, plan, channel, promo_code, list_amount_idr, discount_idr, amount_idr, fee_idr, net_idr,
  status, retry_count, order_id, payment_ref, created_at, paid_at, settlement_on
)
with slots as (
  select b.*, k,
    b.paid_at + case when b.bill_plan = 'plus_yearly' then make_interval(years => k) else make_interval(months => k) end as ts
  from billing_users b
  cross join generate_series(0, 24) k
  where b.bill_plan is not null
),
valid as (
  select * from slots
  where ts < least(coalesce(churned_at, now()), now()) and ts > now() - interval '13 months'
     or (k = 0 and ts > now() - interval '13 months' and ts < now())
),
shaped as (
  select v.*,
    case
      when platform = 'ios' then (case when h < 55 then 'apple_iap' when h < 75 then 'gopay' when h < 90 then 'qris' else 'card' end)
      else (case when h < 30 then 'google_play' when h < 62 then 'gopay' when h < 82 then 'qris' when h < 92 then 'ovo_dana' else 'card' end)
    end::public.payment_channel as channel,
    case when k = 0 and abs(hashtext(id::text || 'promo')) % 100 < 22
      then (case when bill_plan = 'plus_yearly'
                 then (case when abs(hashtext(id::text || 'p2')) % 100 < 65 then 'RAMADAN30' else 'NEWYEAR26' end)
                 else (case when abs(hashtext(id::text || 'p2')) % 100 < 60 then 'PARTNER20' else 'TIKTOK50' end) end)
    end as promo,
    abs(hashtext(id::text || k)) % 1000 as r
  from valid v
),
priced as (
  select s.*, c.price_idr as list_price,
    coalesce((select case when pc.discount_type = 'percentage' then round(c.price_idr * pc.discount_pct / 100.0)::int else 0 end
              from public.promo_codes pc where pc.code = s.promo), 0) as discount
  from shaped s join public.plan_catalog c on c.plan = s.bill_plan
),
final as (
  select p.*,
    case when r < 18 then 'failed' when r < 28 then 'refunded' when r < 31 then 'refund_requested'
         when ts > now() - interval '3 days' and r < 500 then 'pending' else 'paid' end::public.transaction_status as st,
    (list_price - discount) as amount,
    case when channel in ('gopay', 'qris', 'ovo_dana') then 0.03 when channel = 'card' then 0.029 else 0.15 end as fee_rate,
    row_number() over (partition by to_char(ts, 'YYMM') order by ts, id) as rn
  from priced p
)
select
  'INV-' || to_char(ts, 'YYMM') || '-' || (18000 + rn),
  id, bill_plan, channel, promo, list_price, discount, amount,
  case when st in ('paid', 'refunded', 'refund_requested') then round(amount * fee_rate)::int else 0 end,
  case when st in ('paid', 'refunded', 'refund_requested') then amount - round(amount * fee_rate)::int else 0 end,
  st,
  case when st = 'failed' then 1 + abs(hashtext(id::text || k)) % 3 else 0 end,
  'SP-' || substr(md5(id::text), 1, 6) || '-' || to_char(ts, 'MMDD'),
  null,
  ts,
  case when st in ('paid', 'refunded', 'refund_requested') then ts + interval '35 seconds' end,
  (ts + interval '1 day')::date
from final;

-- A handful of clinic-sponsored invoices.
insert into public.transactions (invoice_no, user_id, plan, channel, promo_code, list_amount_idr, discount_idr, amount_idr, fee_idr, net_idr,
  status, order_id, created_at, paid_at, settlement_on)
select 'INV-' || to_char(now() - g * interval '2 days', 'YYMM') || '-' || (19000 + g), u.id, 'clinic_sponsored', 'clinic_invoice', 'BUNDA-CLINIC',
  399000, 399000, 0, 0, 0, 'sponsored', 'SP-' || substr(md5(u.id::text), 1, 6) || '-CL',
  now() - g * interval '2 days', now() - g * interval '2 days', (now() - g * interval '2 days')::date
from (select id, row_number() over (order by id) as g from public.app_users where plan = 'free' limit 12) u;

-- Redemptions: every discounted transaction, some trial extensions and rejected attempts.
insert into public.promo_redemptions (code, user_id, plan, discount_idr, outcome, note, flagged, redeemed_at)
select promo_code, user_id, plan, discount_idr, 'applied', null,
  abs(hashtext(id::text || 'flag')) % 100 < 4, created_at
from public.transactions where promo_code is not null;

insert into public.promo_redemptions (code, user_id, plan, discount_idr, outcome, note, redeemed_at)
select 'PROMILBARU', id, 'trial', 0, 'applied', 'trial +7d', trial_started_at
from public.app_users where trial_started_at is not null and trial_started_at < now() and abs(hashtext(id::text || 'pb')) % 100 < 40;

insert into public.promo_redemptions (code, user_id, plan, discount_idr, outcome, note, redeemed_at)
select 'TIKTOK50', id, 'plus_monthly', 0, 'rejected', 'rejected · limit', now() - (abs(hashtext(id::text)) % 30) * interval '1 day'
from public.app_users where abs(hashtext(id::text || 'rej')) % 100 < 2;

update public.promo_codes pc set used_count = coalesce((
  select count(*) from public.promo_redemptions r where r.code = pc.code and r.outcome = 'applied'), 0);
update public.promo_codes set max_uses = greatest(max_uses, ceil(used_count * 1.6)::int) where code in ('RAMADAN30', 'PARTNER20', 'NEWYEAR26');
update public.promo_codes set max_uses = used_count where code = 'TIKTOK50';

insert into public.promo_history (code, at, actor, text)
select code, coalesce(starts_at, created_at) - interval '3 days', 'Tommy A.', 'Created code' from public.promo_codes;
insert into public.promo_history (code, at, actor, text)
select code, coalesce(starts_at, created_at), 'system', 'Status → Active' from public.promo_codes where starts_at < now();
insert into public.promo_history (code, at, actor, text) values
  ('TIKTOK50', now() - interval '6 days', 'Tommy A.', 'Paused for fraud review'),
  ('RAMADAN30', now() - interval '20 days', 'Tommy A.', 'Paused for fraud review (2h), resumed');
