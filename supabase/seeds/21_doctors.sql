-- Dev doctors: the network from the design plus a bench of generic profiles.

update public.doctors set
  title = case when name like 'dr.%' then 'dr.' else '' end,
  full_name = regexp_replace(regexp_replace(split_part(name, ',', 1), '^dr\.\s*', ''), '^Bdn\.\s*', ''),
  degree = nullif(trim(split_part(name, ',', 2)), ''),
  specialty_group = case when name like '%SpOG-KFER%' then 'SpOG-KFER' when name like '%SpAnd%' then 'SpAnd' when name like '%M.Psi%' then 'Psychologist' else 'SpOG' end,
  status = 'active', str_status = 'verified', str_verified_at = now() - interval '200 days', listed = true;

update public.doctors set specialty = 'Fertility psychologist' where name like 'Nadira%';
update public.doctors set title = 'dr.', years_experience = 14, focus = array['Infertility','PCOS','IUI / IVF'],
  bio = 'Reproductive endocrinologist at Bunda Women''s Clinic with 14 years helping couples conceive. Medical advisor to Srikandi Promil.',
  str_number = '3121 1002 2345 678', str_valid_until = '2029-12-31', sip_number = 'SIP/0412/DKI/2024', sip_valid_until = '2027-08-31',
  cert_label = 'KFER certificate', cert_verified_at = '2026-01-12', role_medical_reviewer = true, role_engine_signoff = true, role_public_advisor = true,
  accepts_bpjs = true, languages = array['Bahasa Indonesia','English'], portal_email = 'sarah.lestari@bundaclinic.id', reviews_count = 312, rating = 4.9,
  admin_id = (select id from public.admin_profiles where full_name = 'dr. Sarah Lestari'),
  bank = '{"holder":"PT Bunda Sehat Medika","bank":"BCA","last4":"2231","verified_at":"2026-01-04","npwp":true}'::jsonb,
  stats = '{"referrals_30d":312,"teleconsults_30d":148,"articles_reviewed":41,"visits_30d":96,"gross_month":61400000,"shared_reports":212,"active_shares":47,"engine_signoffs":3,"turnaround_h":18,"teleconsult_delta_pct":12,"payout_next":"2026-05-26"}'::jsonb
where name like 'dr. Sarah%';
update public.doctors set full_name = 'Nadira Putri', title = '', years_experience = 8, focus = array['Recurrent loss','Infertility'], reviews_count = 480 where name like 'Nadira%';
update public.doctors set years_experience = 6, reviews_count = 205, focus = array['Infertility'] where name like 'dr. Ayu%';
update public.doctors set years_experience = 12, reviews_count = 350, focus = array['Male factor'] where name like 'dr. Bima%';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Andi Wibowo, SpOG', 'dr.', 'Andi Wibowo', 'SpOG', 'SpOG', 'PCOS & hormones', 11, array['PCOS','Infertility']::text[], c.name, c.city, 4.8, 940,
  'active', 'verified', '6109 2407 3361 204', '2029-12-31', now() - interval '120 days', 'SIP/867/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 195, "teleconsults_30d": 67, "articles_reviewed": 15, "visits_30d": 108, "gross_month": 25000000, "shared_reports": 152, "active_shares": 6}'::jsonb
from public.clinics c where c.name = 'RS Ibu & Anak Harapan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Bima Santoso, SpAnd', 'dr.', 'Bima Santoso', 'SpAnd', 'SpAnd', 'Andrology · male fertility', 9, array['Male factor','Infertility']::text[], c.name, c.city, 4.7, 610,
  'active', 'verified', '9899 1443 9652 405', '2029-12-31', now() - interval '120 days', 'SIP/758/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 66, "teleconsults_30d": 0, "articles_reviewed": 22, "visits_30d": 53, "gross_month": 48000000, "shared_reports": 113, "active_shares": 15}'::jsonb
from public.clinics c where c.name = 'Klinik Permata Hati';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Ratna Dewi, SpOG(K)', 'dr.', 'Ratna Dewi', 'SpOG(K)', 'SpOG', 'Maternal-fetal medicine', 18, array['Recurrent loss']::text[], c.name, c.city, 4.6, 520,
  'pending', 'pending', '9236 6401 4654 727', '2029-12-31', null, 'SIP/930/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 119, "teleconsults_30d": 0, "articles_reviewed": 25, "visits_30d": 50, "gross_month": 40000000, "shared_reports": 78, "active_shares": 17}'::jsonb
from public.clinics c where c.name = 'RS Ibu & Anak Harapan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'Bdn. Wulan Sari, S.Tr.Keb', 'Bdn.', 'Wulan Sari', 'S.Tr.Keb', 'Midwife', 'Midwife · preconception', 7, array['Infertility']::text[], c.name, c.city, 4.8, 730,
  'active', 'verified', '1457 5577 8737 365', '2029-12-31', now() - interval '120 days', 'SIP/298/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 196, "teleconsults_30d": 114, "articles_reviewed": 25, "visits_30d": 64, "gross_month": 38000000, "shared_reports": 40, "active_shares": 19}'::jsonb
from public.clinics c where c.name = 'Morula Sehat Medan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Rina Kartika, SpOG-KFER', 'dr.', 'Rina Kartika', 'SpOG-KFER', 'SpOG-KFER', 'Reproductive endocrinology', 14, array['Recurrent loss']::text[], c.name, c.city, 4.3, 259,
  'active', 'verified', '6533 4348 8907 739', '2029-12-31', now() - interval '120 days', 'SIP/724/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 20, "teleconsults_30d": 122, "articles_reviewed": 29, "visits_30d": 103, "gross_month": 37000000, "shared_reports": 184, "active_shares": 10}'::jsonb
from public.clinics c where c.name = 'Bunda Women''s Clinic';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Dimas Pratama, SpAnd', 'dr.', 'Dimas Pratama', 'SpAnd', 'SpAnd', 'Andrology · male fertility', 5, array['Recurrent loss']::text[], c.name, c.city, 4.8, 268,
  'active', 'verified', '3924 8109 6447 188', '2029-12-31', now() - interval '120 days', 'SIP/920/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 222, "teleconsults_30d": 118, "articles_reviewed": 12, "visits_30d": 30, "gross_month": 25000000, "shared_reports": 63, "active_shares": 13}'::jsonb
from public.clinics c where c.name = 'Morula Sehat Medan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'Bdn. Melati Hartono, S.Tr.Keb', 'Bdn.', 'Melati Hartono', 'S.Tr.Keb', 'Midwife', 'Midwife · preconception', 5, array['Male factor','Recurrent loss','Infertility']::text[], c.name, c.city, 4.4, 355,
  'active', 'verified', '8771 6741 3554 661', '2029-12-31', now() - interval '120 days', 'SIP/661/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 87, "teleconsults_30d": 5, "articles_reviewed": 0, "visits_30d": 103, "gross_month": 21000000, "shared_reports": 154, "active_shares": 13}'::jsonb
from public.clinics c where c.name = 'RS Ibu & Anak Harapan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Yusuf Rahman, SpOG', 'dr.', 'Yusuf Rahman', 'SpOG', 'SpOG', 'Obstetrics & gynaecology', 9, array['Male factor']::text[], c.name, c.city, 4.3, 548,
  'active', 'verified', '5126 4486 5799 613', '2029-12-31', now() - interval '120 days', 'SIP/346/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 186, "teleconsults_30d": 66, "articles_reviewed": 17, "visits_30d": 73, "gross_month": 23000000, "shared_reports": 35, "active_shares": 27}'::jsonb
from public.clinics c where c.name = 'RS Ibu & Anak Harapan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'Sinta Maharani, M.Psi', '', 'Sinta Maharani', 'M.Psi', 'Psychologist', 'Fertility psychologist', 17, array['Recurrent loss','Male factor']::text[], c.name, c.city, 4.8, 347,
  'active', 'verified', '3142 9713 3487 636', '2029-12-31', now() - interval '120 days', 'SIP/622/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 29, "teleconsults_30d": 112, "articles_reviewed": 24, "visits_30d": 43, "gross_month": 53000000, "shared_reports": 21, "active_shares": 14}'::jsonb
from public.clinics c where c.name = 'Morula Sehat Medan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Farah Nabila, SpOG-KFER', 'dr.', 'Farah Nabila', 'SpOG-KFER', 'SpOG-KFER', 'Reproductive endocrinology', 20, array['IUI / IVF','Recurrent loss']::text[], c.name, c.city, 4.4, 195,
  'active', 'verified', '2011 6340 9492 643', '2029-12-31', now() - interval '120 days', 'SIP/668/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 267, "teleconsults_30d": 0, "articles_reviewed": 25, "visits_30d": 33, "gross_month": 50000000, "shared_reports": 34, "active_shares": 20}'::jsonb
from public.clinics c where c.name = 'Klinik Permata Hati';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Hendra Wijaya, SpOG', 'dr.', 'Hendra Wijaya', 'SpOG', 'SpOG', 'Obstetrics & gynaecology', 19, array['Infertility','Endometriosis']::text[], c.name, c.city, 4.8, 135,
  'active', 'verified', '9318 8408 1456 878', '2029-12-31', now() - interval '120 days', 'SIP/164/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 246, "teleconsults_30d": 83, "articles_reviewed": 19, "visits_30d": 84, "gross_month": 53000000, "shared_reports": 151, "active_shares": 17}'::jsonb
from public.clinics c where c.name = 'Klinik Permata Hati';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'Bdn. Laila Fitria, S.Tr.Keb', 'Bdn.', 'Laila Fitria', 'S.Tr.Keb', 'Midwife', 'Midwife · preconception', 12, array['Endometriosis','Infertility']::text[], c.name, c.city, 4.7, 331,
  'active', 'verified', '8832 9319 5057 815', '2029-12-31', now() - interval '120 days', 'SIP/635/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 152, "teleconsults_30d": 0, "articles_reviewed": 29, "visits_30d": 91, "gross_month": 27000000, "shared_reports": 134, "active_shares": 13}'::jsonb
from public.clinics c where c.name = 'Bunda Women''s Clinic';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Agus Salim, SpAnd', 'dr.', 'Agus Salim', 'SpAnd', 'SpAnd', 'Andrology · male fertility', 16, array['IUI / IVF','Infertility','Recurrent loss']::text[], c.name, c.city, 4.8, 293,
  'active', 'verified', '6177 2188 4942 538', '2029-12-31', now() - interval '120 days', 'SIP/174/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 128, "teleconsults_30d": 77, "articles_reviewed": 25, "visits_30d": 35, "gross_month": 24000000, "shared_reports": 184, "active_shares": 47}'::jsonb
from public.clinics c where c.name = 'Klinik Permata Hati';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'Citra Anindya, M.Psi', '', 'Citra Anindya', 'M.Psi', 'Psychologist', 'Fertility psychologist', 16, array['Recurrent loss','Infertility']::text[], c.name, c.city, 4.8, 325,
  'active', 'verified', '8663 4597 2542 507', '2029-12-31', now() - interval '120 days', 'SIP/598/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 103, "teleconsults_30d": 57, "articles_reviewed": 5, "visits_30d": 110, "gross_month": 42000000, "shared_reports": 151, "active_shares": 30}'::jsonb
from public.clinics c where c.name = 'RS Ibu & Anak Harapan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Nurul Hidayah, SpOG', 'dr.', 'Nurul Hidayah', 'SpOG', 'SpOG', 'Obstetrics & gynaecology', 17, array['Endometriosis','Recurrent loss']::text[], c.name, c.city, 4.4, 226,
  'active', 'verified', '6218 2510 6995 119', '2029-12-31', now() - interval '120 days', 'SIP/446/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 254, "teleconsults_30d": 112, "articles_reviewed": 22, "visits_30d": 22, "gross_month": 39000000, "shared_reports": 104, "active_shares": 38}'::jsonb
from public.clinics c where c.name = 'RS Ibu & Anak Harapan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Rizal Fauzi, SpOG-KFER', 'dr.', 'Rizal Fauzi', 'SpOG-KFER', 'SpOG-KFER', 'Reproductive endocrinology', 12, array['Infertility','PCOS']::text[], c.name, c.city, 4.4, 567,
  'active', 'verified', '4744 2716 2377 371', '2029-12-31', now() - interval '120 days', 'SIP/378/2025', '2027-06-30', false,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 40, "teleconsults_30d": 46, "articles_reviewed": 8, "visits_30d": 36, "gross_month": 42000000, "shared_reports": 193, "active_shares": 21}'::jsonb
from public.clinics c where c.name = 'Morula Sehat Medan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'Bdn. Putri Amelia, S.Tr.Keb', 'Bdn.', 'Putri Amelia', 'S.Tr.Keb', 'Midwife', 'Midwife · preconception', 5, array['Endometriosis','Male factor']::text[], c.name, c.city, 4.5, 108,
  'active', 'verified', '9103 6358 2465 385', '2029-12-31', now() - interval '120 days', 'SIP/158/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 113, "teleconsults_30d": 108, "articles_reviewed": 28, "visits_30d": 29, "gross_month": 32000000, "shared_reports": 24, "active_shares": 45}'::jsonb
from public.clinics c where c.name = 'Morula Sehat Medan';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Galuh Prameswari, SpOG', 'dr.', 'Galuh Prameswari', 'SpOG', 'SpOG', 'Obstetrics & gynaecology', 10, array['PCOS','Infertility']::text[], c.name, c.city, 4.6, 66,
  'active', 'verified', '2091 5332 2993 564', '2029-12-31', now() - interval '120 days', 'SIP/111/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 193, "teleconsults_30d": 0, "articles_reviewed": 17, "visits_30d": 73, "gross_month": 32000000, "shared_reports": 179, "active_shares": 13}'::jsonb
from public.clinics c where c.name = 'Klinik Permata Hati';
insert into public.doctors (name, title, full_name, degree, specialty_group, specialty, years_experience, focus, clinic_name, city, rating, reviews_count,
  status, str_status, str_number, str_valid_until, str_verified_at, sip_number, sip_valid_until, accepts_bpjs, languages, listed, stats)
select 'dr. Teguh Santosa, SpAnd', 'dr.', 'Teguh Santosa', 'SpAnd', 'SpAnd', 'Andrology · male fertility', 6, array['Male factor']::text[], c.name, c.city, 4.5, 158,
  'active', 'verified', '3645 5290 1825 285', '2029-12-31', now() - interval '120 days', 'SIP/306/2025', '2027-06-30', true,
  array['Bahasa Indonesia','English'], true,
  '{"referrals_30d": 179, "teleconsults_30d": 78, "articles_reviewed": 16, "visits_30d": 46, "gross_month": 33000000, "shared_reports": 134, "active_shares": 37}'::jsonb
from public.clinics c where c.name = 'Morula Sehat Medan';

-- Locations: every non-teleconsult doctor practises at their clinic; tele doctors also get the virtual location.
insert into public.doctor_locations (doctor_id, clinic_id, kind, label, address, sip_number, sort_order)
select d.id, c.id, 'primary', c.name, c.address, d.sip_number, 0 from public.doctors d join public.clinics c on c.name = d.clinic_name and c.city = d.city
where d.clinic_name <> '' and not exists (select 1 from public.doctor_locations l where l.doctor_id = d.id);

insert into public.doctor_locations (doctor_id, clinic_id, kind, label, address, sip_number, sort_order)
select d.id, c.id, 'secondary', c.name, c.address, 'SIP/1187/JBR/2025', 1 from public.doctors d, public.clinics c
where d.name like 'dr. Sarah%' and c.name = 'RS Ibu & Anak Harapan';
insert into public.doctor_locations (doctor_id, kind, label, address, sort_order)
select d.id, 'virtual', 'Teleconsult (in-app)', 'Video & chat · Indonesia-wide', 9 from public.doctors d
where d.name like 'dr. Sarah%' or d.name like 'Nadira%' or d.name like 'dr. Andi%' or d.name like 'Bdn. Wulan%' or (abs(hashtext(d.id::text)) % 100 < 55 and d.name not like 'dr. Bima%');


-- Weekly slots: clinic mornings on Mon / Wed / Fri, a teleconsult evening on Thursday.
insert into public.doctor_slots (doctor_id, location_id, weekday, starts, ends)
select l.doctor_id, l.id, s.wd, s.a::time, s.b::time from public.doctor_locations l
cross join (values (1, '09:00', '13:00'), (3, '09:00', '13:00'), (5, '09:00', '12:00')) as s(wd, a, b)
where l.kind = 'primary' and l.doctor_id in (select id from public.doctors where name not like 'dr. Sarah%');
insert into public.doctor_slots (doctor_id, location_id, weekday, starts, ends)
select l.doctor_id, l.id, 4, '19:00', '21:00' from public.doctor_locations l where l.kind = 'virtual' and l.doctor_id in (select id from public.doctors where name not like 'dr. Sarah%');
-- Dr. Sarah: the design's week.
insert into public.doctor_slots (doctor_id, location_id, weekday, starts, ends)
select d.id, l.id, s.wd, s.a::time, s.b::time from public.doctors d
join public.doctor_locations l on l.doctor_id = d.id
join (values ('primary', 1, '09:00', '13:00'), ('secondary', 2, '08:00', '12:00'), ('primary', 3, '09:00', '13:00'), ('virtual', 3, '19:00', '21:00'),
             ('virtual', 4, '19:00', '21:00'), ('primary', 5, '09:00', '12:00'), ('virtual', 6, '10:00', '14:00')) as s(k, wd, a, b) on s.k = l.kind
where d.name like 'dr. Sarah%';
insert into public.doctor_time_off (doctor_id, from_date, to_date, reason, note, is_auto)
select id, '2026-06-10'::date, '2026-06-14'::date, 'ESHRE conference, Paris', 'Bookings blocked · 6 patients notified', false from public.doctors where name like 'dr. Sarah%'
union all select id, '2026-08-17'::date, '2026-08-17'::date, 'Public holiday', 'Auto from national calendar', true from public.doctors where name like 'dr. Sarah%';


-- Services and permissions for everyone.
insert into public.doctor_services (doctor_id, kind, price_idr, bpjs, active)
select d.id, s.kind,
  case s.kind when 'clinic_first' then p.base when 'clinic_followup' then round(p.base * 0.7 / 10000) * 10000 when 'tele_video' then round(p.base * 0.6 / 10000) * 10000
    when 'tele_chat' then round(p.base * 0.35 / 10000) * 10000 when 'report_review' then round(p.base * 0.45 / 10000) * 10000 else round(p.base * 1.4 / 10000) * 10000 end,
  d.accepts_bpjs and s.kind in ('clinic_first', 'clinic_followup'),
  case s.kind when 'second_opinion' then false when 'clinic_first' then exists (select 1 from public.doctor_locations l where l.doctor_id = d.id and l.kind = 'primary')
    when 'clinic_followup' then exists (select 1 from public.doctor_locations l where l.doctor_id = d.id and l.kind = 'primary')
    else exists (select 1 from public.doctor_locations l where l.doctor_id = d.id and l.kind = 'virtual') end
from public.doctors d
cross join (values ('clinic_first'), ('clinic_followup'), ('tele_video'), ('tele_chat'), ('report_review'), ('second_opinion')) as s(kind)
cross join lateral (select case when d.name like 'dr. Sarah%' then 350000 when d.name like 'Nadira%' then 292000 when d.name like 'dr. Andi%' then 400000 when d.name like 'dr. Bima%' then 300000
                                when d.name like 'dr. Ratna%' then 400000 when d.name like 'Bdn. Wulan%' then 167000 else 200000 + (abs(hashtext(d.id::text)) % 5) * 50000 end as base) p;
update public.doctor_services s set price_idr = v.price
from public.doctors d, (values ('dr. Sarah%', 'clinic_first', 350000), ('dr. Sarah%', 'clinic_followup', 250000), ('dr. Sarah%', 'tele_video', 200000), ('dr. Sarah%', 'tele_chat', 120000),
  ('dr. Sarah%', 'report_review', 150000), ('dr. Sarah%', 'second_opinion', 500000), ('dr. Andi%', 'clinic_first', 250000), ('dr. Bima%', 'clinic_first', 300000),
  ('Nadira%', 'tele_video', 175000), ('dr. Ratna%', 'clinic_first', 400000), ('Bdn. Wulan%', 'clinic_first', 100000)) as v(pat, kind, price)
where s.doctor_id = d.id and d.name like v.pat and s.kind = v.kind;
update public.doctor_services s set active = true from public.doctors d where s.doctor_id = d.id and d.name like 'Nadira%' and s.kind = 'tele_video';
update public.doctors d set accepts_bpjs = false where d.name like 'Nadira%';

insert into public.doctor_permissions (doctor_id, area, can_view, can_review, can_approve, can_publish)
select d.id, a.area, true,
  d.role_medical_reviewer and a.area in ('articles', 'medications', 'engine', 'notifications'),
  d.role_medical_reviewer and a.area in ('articles', 'medications', 'engine'), false
from public.doctors d cross join (values ('articles'), ('medications'), ('engine'), ('community'), ('notifications'), ('clinic_verification')) as a(area);
update public.doctor_permissions set can_view = false where area in ('engine', 'clinic_verification') and doctor_id not in (select id from public.doctors where role_medical_reviewer);

update public.doctors set role_medical_reviewer = true, role_engine_signoff = true, admin_id = (select id from public.admin_profiles where full_name = 'dr. Andi Wibowo'),
  portal_email = 'andi.wibowo@rsharapan.id' where name like 'dr. Andi%';


insert into public.doctor_activity (doctor_id, category, icon, tone, title, detail, created_at)
select d.id, a.cat, a.icon, a.tone, a.title, a.detail, now() - a.ago
from public.doctors d cross join (values
  ('review', 'checks', 'success', 'Approved article “Understanding your fertile window”', 'via Medical review · art_2291', interval '3 hours'),
  ('consult', 'video', 'info', 'Completed 4 teleconsults', 'avg 26 min · 1 prescription note', interval '5 hours'),
  ('security', 'sign-in', 'neutral', 'Signed in from MacBook · Chrome', 'Jakarta · 2FA passed', interval '7 hours'),
  ('review', 'branch', 'warning', 'Signed off Fertility engine v3.5 (canary 5%)', 'PCOS double-LH rule · 2 of 2 approvals', interval '1 day 2 hours'),
  ('profile', 'pencil', 'info', 'Profile updated by Tommy A. (admin)', 'Bio edited · focus areas: +IUI / IVF', interval '1 day 4 hours'),
  ('review', 'star', 'success', 'New 5-star review', '“dr. Sarah was so patient explaining every step.”', interval '1 day 8 hours'),
  ('review', 'pill', 'info', 'Reviewed medication “Myo-inositol 2 g”', 'Requested changes: add metformin interaction warning', interval '10 days'),
  ('profile', 'calendar-x', 'warning', 'Added time off 10 – 14 Jun', '6 bookings moved · patients notified', interval '10 days 8 hours'),
  ('security', 'shield-warning', 'error', 'Login blocked from new device', 'Bekasi · wrong 2FA code × 3', interval '10 days 16 hours')
) as a(cat, icon, tone, title, detail, ago)
where d.name like 'dr. Sarah%';
insert into public.doctor_activity (doctor_id, category, icon, tone, title, detail, created_at)
select id, 'profile', 'user-plus', 'info', 'Doctor added by Tommy A. (admin)', 'STR verified with KKI', created_at from public.doctors where name not like 'dr. Sarah%';
