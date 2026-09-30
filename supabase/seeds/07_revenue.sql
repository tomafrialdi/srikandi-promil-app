-- Subscription MRR events and non-subscription revenue.

select setseed(0.66);

-- Monthly price of the plan a (current or former) subscriber was on.
create temporary table sub_price as
select id, case
    when plan = 'plus_monthly' then 49000
    when plan = 'plus_yearly' then 33250
    else (array[49000, 33250])[1 + abs(hashtext(id::text)) % 2]
  end as price
from public.app_users
where paid_at is not null;

insert into public.subscription_events (user_id, event_type, mrr_delta_idr, occurred_at)
select u.id, 'new', p.price, u.paid_at
from public.app_users u join sub_price p using (id);

insert into public.subscription_events (user_id, event_type, mrr_delta_idr, cancel_reason, occurred_at)
select u.id, 'churn', -p.price,
  case
    when abs(hashtext(u.id::text || 'r')) % 100 < 41 then 'got_pregnant'
    when abs(hashtext(u.id::text || 'r')) % 100 < 63 then 'price'
    when abs(hashtext(u.id::text || 'r')) % 100 < 80 then 'not_using_enough'
    when abs(hashtext(u.id::text || 'r')) % 100 < 92 then 'payment_failed'
    else 'other' end::public.cancel_reason,
  u.churned_at
from public.app_users u join sub_price p using (id)
where u.churned_at is not null;

-- A few churned subscribers come back.
insert into public.subscription_events (user_id, event_type, mrr_delta_idr, occurred_at)
select u.id, 'reactivation', p.price, u.churned_at + interval '20 days'
from public.app_users u join sub_price p using (id)
where u.churned_at < now() - interval '30 days' and abs(hashtext(u.id::text || 'back')) % 100 < 4;

update public.app_users u set
  churned_at = null,
  plan = case when p.price = 49000 then 'plus_monthly' else 'plus_yearly' end::public.plan_type
from sub_price p
where p.id = u.id
  and u.churned_at < now() - interval '30 days'
  and abs(hashtext(u.id::text || 'back')) % 100 < 4;

-- Expansions / contractions on current subscribers.
insert into public.subscription_events (user_id, event_type, mrr_delta_idr, occurred_at)
select id, 'upgrade', 15000, paid_at + (now() - paid_at) * 0.5
from public.app_users
where plan in ('plus_monthly', 'plus_yearly') and paid_at < now() - interval '60 days'
  and abs(hashtext(id::text || 'up')) % 100 < 14;

insert into public.subscription_events (user_id, event_type, mrr_delta_idr, occurred_at)
select id, 'downgrade', -10000, paid_at + (now() - paid_at) * 0.7
from public.app_users
where plan in ('plus_monthly', 'plus_yearly') and paid_at < now() - interval '60 days'
  and abs(hashtext(id::text || 'down')) % 100 < 2;

-- B2B clinics, teleconsult fees and refunds (monthly).
insert into public.other_revenue (source, amount_idr, occurred_on)
select s.src, round(s.base * (1 + 0.06 * m) * (0.95 + random() * 0.1)),
  (date_trunc('month', now()) - make_interval(months => 12 - m))::date + 1
from generate_series(0, 12) m
cross join (values
  ('b2b_clinic'::public.revenue_source, 2600000), ('teleconsult', 1100000), ('refund', -110000)
) as s(src, base);
