-- Cycles and the latest fertility-engine run per user.

select setseed(0.10);

insert into public.user_cycles (user_id, cycle_no, start_date, length_days, ovulation_day, luteal_days, outcome)
with u as (
  select id, cycles_tracked as n, tracking_depth, conceived_at,
    (last_active_at >= now() - interval '29 days') as active,
    last_active_at::date as last_day,
    1 + abs(hashtext(id::text || 'cd')) % 27 as cd
  from public.app_users
  where onboarded_at is not null and first_signal_at is not null
),
c as (
  select u.*, k, 26 + abs(hashtext(u.id::text || k)) % 9 as len,
    case when u.active then u.n - 1 else u.n end as m
  from u cross join lateral generate_series(1, u.n) k
),
s as (
  select c.*,
    case when c.active then current_date - (c.cd - 1) else c.last_day end as anchor,
    sum(c.len) filter (where c.k <= c.m) over (partition by c.id order by c.k desc rows between unbounded preceding and current row) as tail_sum
  from c
)
select id, k,
  case when k <= m then anchor - tail_sum::int else anchor end,
  case when active and k = n then null else len end,
  case when tracking_depth = 'calendar_only' and abs(hashtext(id::text || k || 'o')) % 3 = 0 then null
       when active and k = n then null
       else len - 12 - abs(hashtext(id::text || k || 'l')) % 4 end,
  case when tracking_depth = 'calendar_only' and abs(hashtext(id::text || k || 'o')) % 3 = 0 then null
       when active and k = n then null
       else 12 + abs(hashtext(id::text || k || 'l')) % 4 end,
  case
    when active and k = n then 'Fertile window'
    when k = n and conceived_at is not null then 'Positive test'
    when abs(hashtext(id::text || k || 'r')) % 100 < 60 then 'Period'
    when abs(hashtext(id::text || k || 'r')) % 100 < 90 then 'Negative test'
    when abs(hashtext(id::text || k || 'r')) % 100 < 96 then 'Anovulatory?'
    else 'Period' end
from s;

update public.user_cycles set outcome = 'Anovulatory?' where ovulation_day is null and length_days is not null;

-- Latest run per user with an open cycle.
insert into public.engine_runs (
  user_id, cycle_no, rule_set, run_at, status, headline, confidence, signals_used,
  predicted_ovulation_day, predicted_ovulation_date, test_date, contribution, day_by_day, decision_trace, overrides, flags
)
with cur as (
  select c.user_id, c.cycle_no, c.start_date, u.tracking_depth,
    (current_date - c.start_date + 1) as cd,
    greatest(11, coalesce((select round(avg(length_days))::int from public.user_cycles x where x.user_id = c.user_id and x.length_days is not null), 29) - 14) as ov
  from public.user_cycles c
  join public.app_users u on u.id = c.user_id
  where c.length_days is null
),
calc as (
  select cur.*,
    case when cd <= 5 then 'Menstrual' when cd < ov - 4 then 'Low fertility'
         when cd < ov then 'High fertility' when cd = ov then 'Peak fertility'
         when cd <= ov + 2 then 'Post-ovulation' else 'Luteal · 2WW' end as status,
    least(96, 55 + case tracking_depth when 'lh_cf_bbt' then 30 when 'lh_cf' then 22 when 'lh_only' then 12 else 0 end
      + abs(hashtext(user_id::text)) % 10) as conf,
    case tracking_depth when 'lh_cf_bbt' then 3 when 'lh_cf' then 2 when 'lh_only' then 1 else 0 end as signals
  from cur
)
select
  user_id, cycle_no, 'v3.4', (date_trunc('day', now() at time zone 'Asia/Jakarta') + interval '6 hours 21 minutes') at time zone 'Asia/Jakarta',
  status,
  case status
    when 'High fertility' then format('Peak expected %s (CD %s)', case when ov - cd <= 1 then 'tomorrow' else 'in ~' || (ov - cd) || ' days' end, ov)
    when 'Peak fertility' then 'Peak fertility today'
    when 'Menstrual' then 'Period days · fertility low'
    when 'Low fertility' then format('Fertile window opens ~CD %s', ov - 4)
    else 'Luteal phase · test around ' || to_char(start_date + ov + 13, 'DD Mon') end,
  conf, signals, ov, start_date + ov - 1, start_date + ov + 13,
  case tracking_depth
    when 'lh_cf_bbt' then '[{"label":"LH high","pct":46},{"label":"Fluid watery","pct":28},{"label":"BBT","pct":16},{"label":"Calendar","pct":10}]'
    when 'lh_cf' then '[{"label":"LH high","pct":52},{"label":"Fluid watery","pct":30},{"label":"Calendar","pct":18}]'
    when 'lh_only' then '[{"label":"LH high","pct":62},{"label":"Calendar","pct":38}]'
    else '[{"label":"Calendar","pct":100}]' end::jsonb,
  (
    select coalesce(jsonb_agg(jsonb_build_object(
      'cd', d, 'date', to_char(start_date + d - 1, 'DD Mon'),
      'bbt', case when tracking_depth = 'lh_cf_bbt' then round((36.15 + (abs(hashtext(user_id::text || d)) % 20) / 100.0 - case when d >= ov then 0.15 else 0 end)::numeric, 2) end,
      'lh', case when tracking_depth = 'calendar_only' then null when d = ov then 'Peak' when d >= ov - 2 then 'High' else 'Negative' end,
      'fluid', case when tracking_depth in ('lh_cf_bbt', 'lh_cf') then (case when d <= 5 then 'Dry' when d < ov - 3 then 'Sticky' when d < ov - 1 then 'Creamy' else 'Watery' end) end,
      'score', round(least(0.95, 0.05 + d::numeric / ov * 0.7), 2),
      'output', case when d <= 5 then 'Menstrual' when d < ov - 4 then 'Low fertility' when d < ov then 'High fertility' when d = ov then 'Peak fertility' else 'Post-ovulation' end
    ) order by d), '[]'::jsonb)
    from generate_series(greatest(1, cd - 6), cd) d
  ),
  jsonb_build_array(
    jsonb_build_object('step', '1 · Inputs', 'body', format('%s signal source(s) received today; calendar day CD %s', signals, cd)),
    jsonb_build_object('step', '2 · Validate', 'body', 'Values kept (logged within usual window) · no fever flag · duplicate scans merged'),
    jsonb_build_object('step', '3 · Score', 'body', format('Weighted score from %s signal(s) and calendar → confidence %s%%', signals, conf)),
    jsonb_build_object('step', '4 · Resolve', 'body', format('Rule matched for CD %s vs predicted ovulation CD %s → %s', cd, ov, status)),
    jsonb_build_object('step', '5 · Outputs', 'body', format('Home ring → “%s” · push scheduled 07:00', status))
  ),
  case when abs(hashtext(user_id::text || 'ovr')) % 100 < 8
    then jsonb_build_array(jsonb_build_object(
      'at', to_char(now() - interval '1 day', 'DD Mon') || ' 07:02', 'by', 'Dewi A.', 'from', 'High', 'to', 'Peak',
      'ticket', 'TCK-' || (4000 + abs(hashtext(user_id::text)) % 999)))
    else '[]'::jsonb end,
  (select 'Engine flag: ' || count(*) || ' possibly anovulatory cycle(s). Included in Doctor report.'
   from public.user_cycles x where x.user_id = calc.user_id and x.outcome = 'Anovulatory?' having count(*) > 0)
from calc;
