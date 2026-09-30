-- Care & safety events (aggregated in the console).

select setseed(0.88);

insert into public.care_events (user_id, event_type, occurred_at)
select id, 'pregnancy_loss', least(now(), conceived_at + interval '40 days')
from public.app_users
where conceived_at is not null and abs(hashtext(id::text || 'loss')) % 100 < 6;

insert into public.care_events (user_id, event_type, occurred_at)
select id, 'counsellor_session', now() - random() * 180 * interval '1 day'
from public.app_users
where abs(hashtext(id::text || 'couns')) % 100 < 3;

insert into public.care_events (user_id, event_type, occurred_at)
select id, 'wellbeing_trigger', now() - random() * 180 * interval '1 day'
from public.app_users
where journey_stage = 'after_loss' and abs(hashtext(id::text || 'wb')) % 100 < 8;
