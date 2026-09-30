-- Community: 8 groups, ~2.5k posts over 2 days, a moderation queue (12 reported · 37 AI flagged · 2 appeals),
-- resolved history, keyword rules and guidelines.

select setseed(0.16);

insert into public.community_groups (name, description, visibility, hosted_by, protected, moderators, member_count) values
  ('TTC 6+ months', 'Long-haul trying to conceive. Support, not advice.', 'public', null, false, '{"Dewi A.","Rina M."}', 28410),
  ('PCOS', 'Living and trying with PCOS.', 'public', null, false, '{"dr. Andi W.","Sari P."}', 19882),
  ('Two-week wait', 'The longest fortnight, together.', 'public', null, false, '{"Dewi A."}', 16204),
  ('IVF & IUI', 'Treatment cycles, questions and small wins.', 'public', null, false, '{"dr. Sarah L."}', 7915),
  ('After loss', 'A gentle space after pregnancy loss.', 'public', null, true, '{"Counsellor team"}', 4120),
  ('Partners', 'For partners walking the journey too.', 'public', null, false, '{"Rina M."}', 3560),
  ('Klinik Bunda Jakarta', 'Patients of Klinik Bunda.', 'private', 'Klinik Bunda Jakarta', false, '{"dr. Sarah L."}', 860),
  ('Morula Fertility Club', 'Patients of Morula clinic.', 'private', 'Morula IVF', false, '{"dr. Bima S."}', 640);

create temporary table seed_g as select id, name, member_count, row_number() over (order by name) as n from public.community_groups;

-- Normal traffic: 1,284 posts today (Jakarta) and ~1,210 yesterday.
insert into public.community_posts (group_id, author_handle, author_mode, author_account_months, body, created_at)
select g.id, 'user_' || (1000 + abs(hashtext(i::text)) % 9000),
       (array['TTC', 'PCOS', 'IUI', 'IVF', 'TTC'])[1 + i % 5], 2 + i % 40,
       (array['Day 12 and I finally got a positive LH. Fingers crossed!', 'Anyone else feeling extra tired in the 2WW?', 'Update: our second IUI is done. Now we wait.', 'Thank you all for the kind words yesterday.', 'Tips for tracking BBT when you work night shifts?', 'Sharing what my doctor said about folic acid dosage.', 'Feeling hopeful today, small win!'])[1 + i % 7],
       (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta') + (abs(hashtext('t' || i::text)) % 86400 / 86400.0) * (case when i <= 1284 then least(now() - (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'), interval '1 day') else interval '0' end)
       - case when i <= 1284 then interval '0' else interval '1 day' * (1 - (abs(hashtext('y' || i::text)) % 1000) / 1000.0) end
from generate_series(1, 2494) i
join seed_g g on g.name = (array['TTC 6+ months', 'TTC 6+ months', 'TTC 6+ months', 'PCOS', 'PCOS', 'Two-week wait', 'Two-week wait', 'Two-week wait', 'IVF & IUI', 'After loss', 'Partners', 'Klinik Bunda Jakarta'])[1 + i % 12];

-- Hand-written queue items (the design's five).
with named(reason, author, mode, months, prior, checkin, body, grp, mins, ai, reporters) as (values
  ('self_harm'::public.community_reason, 'Bunga_Senja', 'IUI · After negative', 27, 0, '😞 Low · 3 days', 'i can''t do this anymore. 4 years, 2 IUIs, another negative this morning. everyone around me is pregnant. i don''t see the point of anything lately…', 'Two-week wait', 4, 0.94, 3),
  ('spam', 'herbal_mama88', 'TTC 6+', 5, 2, '—', 'DM me for herbal promil package, 100% hamil dalam 1 bulan! Testimoni banyak.', 'TTC 6+ months', 22, 0.71, 2),
  ('medical_misinformation', 'Kupu_Hijau', 'PCOS', 14, 0, '🙂 OK · 1 day', 'stop taking folic acid, it causes PCOS and makes it harder to conceive. trust me.', 'PCOS', 41, 0.82, 2),
  ('harassment', 'anon_4412', 'TTC', 9, 1, '—', 'kalau gak hamil-hamil ya salah kamu sendiri', 'TTC 6+ months', 60, 0.55, 3),
  ('personal_info', 'Rindu_Pagi', 'IVF', 18, 0, '🙂 OK · 2 days', 'here''s my number 0812-3456-7890… call me if you want to talk about the clinic', 'IVF & IUI', 120, 0.9, 1))
insert into public.community_posts (group_id, author_handle, author_mode, author_account_months, author_prior_reports, author_last_checkin, body, reason, ai_score, mod_status, flagged_at, created_at)
select (select id from seed_g where name = grp), author, mode, months, prior, checkin, body, reason, ai, 'open', now() - make_interval(mins => mins), now() - make_interval(mins => mins + 3)
from named;

insert into public.community_reports (post_id, reporter_handle, reason, created_at)
select p.id, 'reporter_' || k, p.reason, p.flagged_at
from public.community_posts p, generate_series(1, 3) k
where p.mod_status = 'open' and p.reason is not null and k <= case p.author_handle when 'Bunga_Senja' then 3 when 'herbal_mama88' then 2 when 'Kupu_Hijau' then 2 when 'anon_4412' then 3 else 1 end;

-- Generated reported items: 7 more (2 self-harm) => 12 reported, 3 urgent.
insert into public.community_posts (group_id, author_handle, author_mode, author_account_months, author_prior_reports, author_last_checkin, body, reason, ai_score, mod_status, flagged_at, created_at)
select (select id from seed_g where n = 1 + i % 6), 'member_' || (200 + i), 'TTC', 3 + i, i % 3, '🙂 OK · ' || i || ' days',
       (array['nobody understands, i just want to disappear for a while', 'buy my supplement, guaranteed pregnant!!', 'you are not a real mother if you skip injections', 'the vaccine makes you infertile, my aunt said', 'anyone want to chat? my whatsapp is 0857-1111-2222', 'this group is useless and so are you', 'i give up on all of this'])[i],
       (array['self_harm', 'spam', 'harassment', 'medical_misinformation', 'personal_info', 'harassment', 'self_harm'])[i]::public.community_reason,
       round((0.5 + (i * 7 % 45) / 100.0)::numeric, 2), 'open', now() - make_interval(mins => 30 + i * 47), now() - make_interval(mins => 35 + i * 47)
from generate_series(1, 7) i;

insert into public.community_reports (post_id, reporter_handle, reason, created_at)
select p.id, 'reporter_x' || p.author_handle, p.reason, p.flagged_at
from public.community_posts p where p.author_handle like 'member\_%' and p.mod_status = 'open';

-- 37 AI-flagged only (no user report).
insert into public.community_posts (group_id, author_handle, author_mode, author_account_months, author_prior_reports, body, reason, ai_score, mod_status, flagged_at, created_at)
select (select id from seed_g where n = 1 + i % 6), 'poster_' || (500 + i), 'TTC', 1 + i % 30, 0,
       (array['click the link for miracle fertility tea', 'doctors lie, use only natural remedies', 'you people are so annoying', 'contact me at my email for cheap meds', 'this is a hopeless situation'])[1 + i % 5],
       (array['spam', 'medical_misinformation', 'harassment', 'personal_info', 'self_harm'])[1 + i % 5]::public.community_reason,
       round((0.55 + (i * 13 % 40) / 100.0)::numeric, 2), 'open', now() - make_interval(mins => 5 + i * 19), now() - make_interval(mins => 8 + i * 19)
from generate_series(1, 37) i;

-- 2 appeals.
insert into public.community_posts (group_id, author_handle, author_mode, author_account_months, body, reason, ai_score, mod_status, flagged_at, created_at, resolved_at, resolution)
select (select id from seed_g where n = 2 + i), 'appeal_' || i, 'PCOS', 12, 'My post about my own clinic experience was hidden. It had no medical advice, please review.', 'medical_misinformation', 0.61,
       'appealed', now() - make_interval(hours => 3 + i), now() - make_interval(hours => 30), now() - make_interval(hours => 26), 'hide'
from generate_series(1, 2) i;

-- Resolved history for the SLA / precision KPIs: 40 items, median about 14 minutes, AI precision 92%.
insert into public.community_posts (group_id, author_handle, author_mode, body, reason, ai_score, mod_status, flagged_at, created_at, resolved_at, resolution)
select (select id from seed_g where n = 1 + i % 6), 'old_' || i, 'TTC', 'Previously moderated post ' || i,
       (array['spam', 'medical_misinformation', 'harassment', 'personal_info', 'self_harm'])[1 + i % 5]::public.community_reason,
       case when i <= 25 then 0.8 else null end,
       case when i <= 25 then case when i <= 23 then 'hidden' else 'approved' end when i % 2 = 0 then 'removed' else 'approved' end::public.community_mod_status,
       now() - make_interval(hours => 5 + i * 3), now() - make_interval(hours => 6 + i * 3),
       now() - make_interval(hours => 5 + i * 3) + make_interval(mins => 4 + (i * 7) % 20 + case when i % 4 = 0 then 12 else 0 end),
       case when i <= 25 then case when i <= 23 then 'hide' else 'approve' end when i % 2 = 0 then 'remove' else 'approve' end
from generate_series(1, 40) i;

insert into public.community_keyword_rules (keyword, action, reason) values
  ('hamil 100%', 'hide', 'spam'), ('herbal promil', 'flag', 'spam'), ('dm me', 'flag', 'spam'),
  ('whatsapp', 'flag', 'personal_info'), ('no hp', 'flag', 'personal_info'),
  ('bunuh diri', 'flag', 'self_harm'), ('gak ada gunanya', 'flag', 'self_harm'), ('salah kamu sendiri', 'flag', 'harassment');

insert into public.community_settings (key, value) values ('guidelines',
'1. Be kind. Everyone here is on a hard journey; no shaming, comparing or blaming.
2. No medical advice as fact. Share your experience, and ask your doctor before changing treatment.
3. No selling. Products, supplements and clinics may not be promoted in groups.
4. Protect privacy. Never share phone numbers, addresses or other people''s health details.
5. Take care of yourself. If you are struggling, the moderators will reach out privately; you can also call Into The Light or 119 ext 8.');
