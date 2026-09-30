-- Sample mobile-app users (3,000 rows) so the dashboard has something to show.

select setseed(0.42);

insert into public.app_users (
  full_name, email, city, province, birth_year, plan, tracking_mode, journey_stage,
  cycles_tracked, onboarded_at, first_signal_at, first_cycle_at, trial_started_at,
  paid_at, conceived_at, referred_at, last_active_at, created_at
)
with pools as (
  select
    array['Nadia','Rina','Dewi','Maya','Putri','Sari','Ayu','Lestari','Wulan','Citra','Fitri','Indah','Anisa','Bunga','Kartika','Larasati'] as firsts,
    array['Kusuma','Hapsari','Lestari','Sari','Ayu','Wijaya','Pratama','Rahayu','Utami','Santoso','Permata','Handayani','Nugraha','Saputri'] as lasts,
    array['Jakarta Selatan','Jakarta Barat','Jakarta Timur','Jakarta Pusat','Bandung','Bekasi','Depok','Bogor','Surabaya','Malang','Semarang','Solo','Tangerang','Medan','Makassar','Denpasar','Yogyakarta','Palembang'] as cities,
    array['DKI Jakarta','DKI Jakarta','DKI Jakarta','DKI Jakarta','Jawa Barat','Jawa Barat','Jawa Barat','Jawa Barat','Jawa Timur','Jawa Timur','Jawa Tengah','Jawa Tengah','Banten','Sumatera Utara','Sulawesi Selatan','Bali','DI Yogyakarta','Sumatera Selatan'] as provs
),
base as materialized (
  select
    g,
    p.*,
    ceil(random() * array_length(p.firsts, 1))::int as fi,
    ceil(random() * array_length(p.lasts, 1))::int as li,
    ceil(random() * array_length(p.cities, 1))::int as ci,
    random() as r_plan,
    random() as r_stage,
    random() as r_age,
    random() as r_active,
    random() as r_funnel,
    random() as r_outcome,
    random() as r_time,
    now() - (power(random(), 1.7) * 730) * interval '1 day' as created_at
  from generate_series(1, 3000) g, pools p
),
shaped as materialized (
  select
    b.*,
    case when r_plan < 0.80 then 'free' when r_plan < 0.815 then 'trial' when r_plan < 0.915 then 'plus_yearly' else 'plus_monthly' end::public.plan_type as plan,
    case
      when r_stage < 0.10 then 'getting_started' when r_stage < 0.43 then 'trying' when r_stage < 0.59 then 'two_week_wait'
      when r_stage < 0.65 then 'in_treatment' when r_stage < 0.68 then 'pregnant' when r_stage < 0.71 then 'after_loss' else 'trying'
    end::public.journey_stage as stage,
    extract(year from now())::int - case
      when r_age < 0.06 then 20 + floor(random() * 5)::int
      when r_age < 0.34 then 25 + floor(random() * 5)::int
      when r_age < 0.77 then 30 + floor(random() * 5)::int
      when r_age < 0.95 then 35 + floor(random() * 5)::int
      else 40 + floor(random() * 6)::int
    end as birth_year
  from base b
)
select
  s.firsts[s.fi] || ' ' || s.lasts[s.li],
  lower(s.firsts[s.fi] || '.' || s.lasts[s.li] || s.g || '@' || (array['gmail.com','yahoo.com','mail.id','outlook.com'])[1 + s.g % 4]),
  s.cities[s.ci],
  s.provs[s.ci],
  s.birth_year,
  s.plan,
  case
    when s.stage = 'pregnant' then 'pregnant'
    when s.stage = 'after_loss' then 'after_loss'
    when s.stage = 'in_treatment' then case when s.r_time < 0.5 then 'ivf' else 'iui' end
    else case when s.r_time < 0.2 then 'pcos' else 'ttc' end
  end::public.tracking_mode,
  s.stage,
  1 + floor(power(s.r_outcome, 0.9) * 11)::int,
  case when s.r_funnel < 0.86 then s.created_at + interval '5 minutes' end,
  case when s.r_funnel < 0.71 then s.created_at + interval '1 day' end,
  case when s.r_funnel < 0.48 then s.created_at + interval '35 days' end,
  case when s.plan = 'trial' or s.plan in ('plus_monthly', 'plus_yearly') or (s.plan = 'free' and s.r_funnel < 0.30)
    then s.created_at + interval '2 days' end,
  case when s.plan in ('plus_monthly', 'plus_yearly') then s.created_at + interval '9 days' end,
  case when (s.stage = 'pregnant' or s.r_outcome < case when s.birth_year > extract(year from now())::int - 25 then 0.16 when s.birth_year > extract(year from now())::int - 30 then 0.15 when s.birth_year > extract(year from now())::int - 35 then 0.13 when s.birth_year > extract(year from now())::int - 40 then 0.08 else 0.04 end) and s.created_at < now() - interval '14 days'
    then least(now(), greatest(s.created_at + interval '14 days', now() - power(s.r_time, 1.3) * 365 * interval '1 day')) end,
  case when s.r_outcome > 0.985 then s.created_at + (now() - s.created_at) * 0.6 end,
  greatest(s.created_at, case when s.r_active < 0.29
    then now() - (31 + random() * 200) * interval '1 day'
    else now() - random() * 29 * interval '1 day' end),
  s.created_at
from shaped s;
