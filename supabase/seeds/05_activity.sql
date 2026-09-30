-- Sessions, push deliveries, feature usage and article reads.

select setseed(0.31);

-- Sessions: weekly activity probability decays with weeks since sign-up (W12 ≈ 41%).
insert into public.app_sessions (user_id, started_at, duration_seconds, source)
with cfg as (
  select array[5,6,6,6,6,7,7,7,8,8,9,10,12,12,13,15,16,18,18,19,20,20,21,21,21,22,22,23] as hours
),
u as (
  select
    id, created_at, partner_linked, tracking_depth, plan,
    greatest(created_at, now() - interval '210 days') as start0,
    case when last_active_at >= now() - interval '29 days' then now() else last_active_at end as end_at,
    greatest(0, floor(extract(epoch from (now() - interval '210 days' - created_at)) / 604800))::int as w_offset
  from public.app_users
),
wk as materialized (
  select u.*, k, random() as r_active, random() as r_n
  from u cross join generate_series(0, 30) k
  where u.start0 + k * interval '7 days' < u.end_at
),
active as materialized (
  select wk.*,
    least(0.95,
      (0.50 + 0.50 * exp(-(wk.w_offset + wk.k) / 1.8))
      * (case when partner_linked then 1.3 else 1 end)
      * (case when tracking_depth = 'calendar_only' then 0.75 when tracking_depth = 'lh_cf_bbt' then 1.15 else 1 end)
      * (case when plan in ('plus_monthly', 'plus_yearly') then 1.25 else 1 end)
    ) as p
  from wk
),
slots as materialized (
  select a.*, s, random() as r_off, random() as r_hour, random() as r_min, random() as r_dur, random() as r_src
  from active a cross join generate_series(1, 5) s
  where a.r_active < a.p and s <= 1 + floor(a.r_n * 5)
),
stamped as (
  select s.*, cfg.hours,
    s.start0 + s.k * interval '7 days' + s.r_off * interval '7 days' as ts
  from slots s cross join cfg
)
select
  id,
  greatest(
    created_at + interval '5 minutes',
    (date_trunc('day', ts at time zone 'Asia/Jakarta')
      + hours[1 + floor(r_hour * array_length(hours, 1))::int] * interval '1 hour'
      + r_min * interval '59 minutes') at time zone 'Asia/Jakarta'
  ),
  (40 + 400 * power(r_dur, 2))::int,
  case when r_src < 0.80 then 'organic' when r_src < 0.86 then 'push_period'
       when r_src < 0.94 then 'push_fertile' when r_src < 0.97 then 'push_recap' else 'push_other' end
from stamped
where ts < end_at and ts < now();

-- Every user who signed up inside the window has a first session right at sign-up.
insert into public.app_sessions (user_id, started_at, duration_seconds, source)
select id, created_at + interval '3 minutes', 300, 'organic'
from public.app_users
where created_at >= now() - interval '210 days';

update public.app_users u
set last_active_at = s.m
from (select user_id, max(started_at) as m from public.app_sessions group by user_id) s
where s.user_id = u.id;

-- Push notifications.
insert into public.push_deliveries (user_id, kind, title, sent_at, opened_at)
with kinds as (
  select
    array['fertile_window','period_started','cycle_recap','tip','winback','winback','winback'] as kind,
    array['Your fertile window starts tomorrow','Log your period start','Your cycle recap is ready','Tip of the day','Your cycle recap is ready','We miss you — your fertile window is near','Come back for a free week of Plus'] as title,
    array[0.26,0.22,0.12,0.09,0.098,0.098,0.098] as open_p
),
u as (
  select id, greatest(created_at, now() - interval '210 days') as start0,
         case when last_active_at >= now() - interval '29 days' then now() else last_active_at end as end_at
  from public.app_users
),
g as materialized (
  select u.*, gs, random() as r_kind, random() as r_time, random() as r_open, random() as r_delay
  from u cross join generate_series(1, 9) gs
  where gs <= 1 + (abs(hashtext(u.id::text)) % 8) and u.end_at > u.start0 + interval '1 day'
)
select g.id,
  k.kind[1 + floor(g.r_kind * 7)::int],
  k.title[1 + floor(g.r_kind * 7)::int],
  g.start0 + g.r_time * (g.end_at - g.start0),
  case when g.r_open < k.open_p[1 + floor(g.r_kind * 7)::int]
    then g.start0 + g.r_time * (g.end_at - g.start0) + g.r_delay * 30 * interval '1 minute' end
from g cross join kinds k;

-- Feature usage: signal features follow how deeply the user tracks.
insert into public.feature_usage (user_id, feature, used_at)
with f(feature, p, base) as (
  values ('LH test scan', 1.0, 14), ('Basal temperature', 1.0, 22), ('Cervical fluid', 1.0, 18),
         ('Two-week wait', 0.31, 10), ('Daily check-in', 0.29, 16), ('Partner mode', 1.0, 6),
         ('Community', 0.19, 12), ('Doctor report', 0.35, 2), ('Treatment program', 0.25, 20)
),
u as (
  select id, created_at, tracking_depth, partner_linked, plan, paid_at, journey_stage,
         greatest(created_at, now() - interval '90 days') as start0,
         case when last_active_at >= now() - interval '29 days' then now() else last_active_at end as end_at
  from public.app_users
  where last_active_at >= now() - interval '90 days'
),
pairs as (
  select u.*, f.feature, f.base
  from u join f on true
  where (abs(hashtext(u.id::text || f.feature)) % 1000) / 1000.0 < f.p
    and case f.feature
      when 'LH test scan' then u.tracking_depth <> 'calendar_only'
      when 'Cervical fluid' then u.tracking_depth in ('lh_cf', 'lh_cf_bbt')
      when 'Basal temperature' then u.tracking_depth = 'lh_cf_bbt'
      when 'Partner mode' then u.partner_linked
      when 'Doctor report' then u.plan in ('plus_monthly', 'plus_yearly')
      when 'Treatment program' then u.plan in ('plus_monthly', 'plus_yearly') and u.journey_stage in ('in_treatment', 'trying')
      else true end
)
select p.id, p.feature, p.start0 + random() * (p.end_at - p.start0)
from pairs p
cross join lateral generate_series(1, ceil(
  (1 + abs(hashtext(p.id::text || p.feature || 'n')) % p.base)
  * extract(epoch from (p.end_at - p.start0)) / (90 * 86400)
)::int) e
where p.end_at > p.start0;

-- Articles and reads.
with a as (
  insert into public.articles (title, category, published_at) values
    ('Understanding your fertile window', 'Basics', now() - interval '300 days'),
    ('How to survive the two-week wait', 'Mindset', now() - interval '250 days'),
    ('PCOS and ovulation: LH tests', 'PCOS', now() - interval '200 days'),
    ('Answering “kapan hamil?”', 'Wellbeing', now() - interval '150 days'),
    ('Male fertility: 5 habits', 'Partner', now() - interval '120 days'),
    ('Reading your BBT chart', 'Basics', now() - interval '90 days'),
    ('IUI vs IVF: what to ask your doctor', 'Treatment', now() - interval '60 days')
  returning id, title
),
w(title, weight, secs) as (
  values ('Understanding your fertile window', 48, 252), ('How to survive the two-week wait', 32, 303),
         ('PCOS and ovulation: LH tests', 22, 401), ('Answering “kapan hamil?”', 20, 207),
         ('Male fertility: 5 habits', 12, 182), ('Reading your BBT chart', 8, 260), ('IUI vs IVF: what to ask your doctor', 6, 330)
),
pool as (
  select array_agg(a.id) as ids, array_agg(w.secs) as secs
  from a join w using (title) cross join lateral generate_series(1, w.weight)
),
reads as (
  select u.id as user_id,
    1 + floor(random() * (select array_length(ids, 1) from pool))::int as idx,
    now() - random() * 90 * interval '1 day' as read_at,
    random() as r
  from public.app_users u
  cross join lateral generate_series(1, 1 + abs(hashtext(u.id::text || 'art')) % 4) g
  where u.last_active_at >= now() - interval '90 days' and (abs(hashtext(u.id::text || 'reader')) % 100) < 45
)
insert into public.article_reads (article_id, user_id, read_at, read_seconds)
select p.ids[r.idx], r.user_id, r.read_at, (p.secs[r.idx] * (0.8 + 0.4 * r.r))::int
from reads r cross join pool p;
