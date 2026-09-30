-- Account fields shown in the Users module.

select setseed(0.9);

with r as materialized (
  select id, random() as r_phone, random() as r_p1, random() as r_p2, random() as r_method, random() as r_try,
         random() as r_partner, random() as r_dev, random() as r_pay, random() as r_c1, random() as r_c2
  from public.app_users
)
update public.app_users u set
  phone = '+62 8' || (11 + floor(r.r_phone * 8))::int || ' ' || lpad(floor(r.r_p1 * 10000)::int::text, 4, '0') || ' ' || lpad(floor(r.r_p2 * 10000)::int::text, 4, '0'),
  signup_method = case when r.r_method < 0.55 then 'Google' when r.r_method < 0.80 then 'Email'
                       when r.r_method < 0.95 then 'Apple' else 'Clinic QR' end,
  trying_since = (u.created_at - r.r_try * 200 * interval '1 day')::date,
  partner_name = case when u.partner_linked
    then (array['Rizky', 'Andi', 'Bagas', 'Fajar', 'Dimas', 'Yoga'])[1 + floor(r.r_partner * 6)::int] end,
  device_model = case when u.platform = 'ios'
    then (array['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12'])[1 + floor(r.r_dev * 4)::int]
    else (array['Pixel 8', 'Samsung S23', 'Xiaomi 13', 'Oppo Reno 10'])[1 + floor(r.r_dev * 4)::int] end,
  payment_method = case when u.plan in ('plus_monthly', 'plus_yearly')
    then (array['GoPay •• ', 'OVO •• ', 'BCA VA •• ', 'Visa •• '])[1 + floor(r.r_pay * 4)::int] || lpad(floor(r.r_p2 * 10000)::int::text, 4, '0') end,
  auto_renew = r.r_pay < 0.9,
  plan_renews_at = case
    when u.plan = 'plus_yearly' then u.paid_at + make_interval(years => ceil(extract(epoch from (now() - u.paid_at)) / 31557600.0)::int)
    when u.plan = 'plus_monthly' then u.paid_at + make_interval(months => ceil(extract(epoch from (now() - u.paid_at)) / 2629800.0)::int)
  end,
  consent_research = r.r_c1 < 0.30,
  consent_marketing = r.r_c2 < 0.70,
  status = case when abs(hashtext(u.id::text || 'susp')) % 1000 < 12 then 'suspended' else 'active' end::public.user_status,
  suspended_at = case when abs(hashtext(u.id::text || 'susp')) % 1000 < 12 then now() - r.r_c1 * 60 * interval '1 day' end,
  suspended_reason = case when abs(hashtext(u.id::text || 'susp')) % 1000 < 12
    then (array['Abusive community posts', 'Chargeback dispute', 'Fraudulent referral'])[1 + abs(hashtext(u.id::text)) % 3] end,
  deletion_requested_at = case when abs(hashtext(u.id::text || 'del')) % 1000 < 6 then now() - r.r_c2 * 12 * interval '1 day' end
from r
where r.id = u.id;
