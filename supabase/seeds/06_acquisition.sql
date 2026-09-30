-- Installs per channel/campaign and weekly spend.

select setseed(0.55);

insert into public.app_installs (user_id, channel, campaign, installed_at)
with u as (
  select id, created_at, random() as r_ch, random() as r_cp from public.app_users
),
base as (
  select id as user_id, created_at - random() * 30 * interval '1 minute' as installed_at, r_ch, r_cp from u
  union all
  select null, now() - power(random(), 1.7) * 730 * interval '1 day', random(), random()
  from generate_series(1, 1400)
)
select user_id,
  ch,
  case ch
    when 'tiktok' then (array['“Kapan hamil?” series', 'LH scanner demo'])[1 + (r_cp > 0.6)::int]
    when 'instagram' then (array['Ramadan RAMADAN30', 'Fertility tips reels'])[1 + (r_cp > 0.7)::int]
    when 'clinic_qr' then (array['Bunda Women''s QR', 'Klinik Sehat QR'])[1 + (r_cp > 0.7)::int]
    when 'google_ads' then (array['“masa subur”', '“cara cepat hamil”'])[1 + (r_cp > 0.6)::int]
  end,
  installed_at
from (
  select *, case
    when r_ch < 0.40 then 'organic' when r_ch < 0.63 then 'tiktok' when r_ch < 0.77 then 'instagram'
    when r_ch < 0.88 then 'clinic_qr' when r_ch < 0.95 then 'google_ads' else 'partner_invite' end::public.acquisition_channel as ch
  from base
) b;

-- Clinic and partner channels convert better.
update public.app_users u set
  plan = 'plus_yearly',
  trial_started_at = coalesce(u.trial_started_at, u.created_at + interval '2 days'),
  paid_at = u.created_at + interval '9 days'
from public.app_installs i
where i.user_id = u.id
  and i.channel in ('clinic_qr', 'partner_invite')
  and u.plan = 'free' and u.paid_at is null
  and abs(hashtext(u.id::text)) % 100 < 11;

insert into public.channel_spend (channel, spend_date, amount_idr)
select i.channel, date_trunc('week', i.installed_at)::date,
  round(count(*) * c.cpi * (0.9 + random() * 0.2))
from public.app_installs i
join (values
  ('tiktok'::public.acquisition_channel, 8500), ('instagram', 11500),
  ('google_ads', 14000), ('clinic_qr', 3000)
) as c(channel, cpi) on c.channel = i.channel
group by i.channel, date_trunc('week', i.installed_at), c.cpi;
