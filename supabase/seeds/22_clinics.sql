-- Dev clinics: the directory from the design plus a few more in every review state.

update public.clinics set type = 'fertility', description = 'Fertility centre serving Jakarta Selatan and surrounding areas with a focus on reproductive health.', phone = '+62 21 5986 8629', whatsapp = '+62 811 8402 9320', email = 'halo@bundawomensc.id', website = 'https://bundawomensc.id',
  facilities = array['USG 4D','Pharmacy','Prayer room','Parking']::text[], province = 'DKI Jakarta', postal_code = '72359', lat = 1.933, lng = 102.569, hours = '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, walk_ins = true, teleconsult = true,
  access_notes = 'Parking available · wheelchair accessible', payments = array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], insurers = array['Prudential','AXA Mandiri','Admedika network']::text[], success = '{}'::jsonb,
  tier = 'sponsor', accepts_bookings = true, referral_enabled = true, referral_slug = 'bunda-womens-clinic', admin_email = 'admin@bundawomensc.id',
  terms_signed_at = now() - interval '60 days', bpjs_level = 'yes', status = 'verified', rating = 4.8,
  submitted_at = now() - interval '90 days', submitted_by = 'clinic admin', verified_at = now() - interval '90 days'
where name = 'Bunda Women''s Clinic';
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Bunda Women''s Clinic');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, true, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Bunda Women''s Clinic';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'verified', 'kars_2026.pdf'),('bpjs_pks', 'verified', 'bpjs_pks_2026.pdf'),('art_licence', 'verified', 'art_licence_2026.pdf'),('kfer_cert', 'verified', 'kfer_cert_2026.pdf')) as d(k, s, f) where c.name = 'Bunda Women''s Clinic'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
update public.clinics set type = 'hospital', description = 'Mother & child hospital serving Bandung and surrounding areas with a focus on reproductive health.', phone = '+62 21 5728 4050', whatsapp = '+62 811 2542 8316', email = 'halo@rsibuandana.id', website = 'https://rsibuandana.id',
  facilities = array['USG 4D','Pharmacy','Parking']::text[], province = 'Jawa Barat', postal_code = '15489', lat = -4.4109, lng = 100.495, hours = '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, walk_ins = false, teleconsult = false,
  access_notes = 'Parking available · wheelchair accessible', payments = array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], insurers = array['Prudential','AXA Mandiri','Admedika network']::text[], success = '{}'::jsonb,
  tier = 'verified', accepts_bookings = true, referral_enabled = true, referral_slug = 'rs-ibu-and-anak-harapan', admin_email = 'admin@rsibuandana.id',
  terms_signed_at = now() - interval '60 days', bpjs_level = 'yes', status = 'verified', rating = 4.6,
  submitted_at = now() - interval '90 days', submitted_by = 'clinic admin', verified_at = now() - interval '90 days'
where name = 'RS Ibu & Anak Harapan';
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'RS Ibu & Anak Harapan');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'RS Ibu & Anak Harapan';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'verified', 'kars_2026.pdf'),('bpjs_pks', 'verified', 'bpjs_pks_2026.pdf'),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'RS Ibu & Anak Harapan'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
update public.clinics set type = 'fertility', description = 'Fertility centre serving Surabaya and surrounding areas with a focus on reproductive health.', phone = '+62 21 5505 8421', whatsapp = '+62 811 3580 1245', email = 'halo@klinikpermata.id', website = 'https://klinikpermata.id',
  facilities = array['IVF lab','Andrology lab','USG 4D','Pharmacy','Parking']::text[], province = 'Jawa Timur', postal_code = '34930', lat = 1.6646, lng = 99.9201, hours = '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, walk_ins = true, teleconsult = true,
  access_notes = 'Parking available · wheelchair accessible', payments = array['Private insurance','QRIS','Debit / credit card']::text[], insurers = array['Prudential','AXA Mandiri','Admedika network']::text[], success = '{"iui_pct": 14, "ivf_pct": 41, "period": "2025"}'::jsonb,
  tier = 'verified', accepts_bookings = true, referral_enabled = true, referral_slug = 'klinik-permata-hati', admin_email = 'admin@klinikpermata.id',
  terms_signed_at = now() - interval '60 days', bpjs_level = 'no', status = 'verified', rating = 4.7,
  submitted_at = now() - interval '90 days', submitted_by = 'clinic admin', verified_at = now() - interval '90 days'
where name = 'Klinik Permata Hati';
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Klinik Permata Hati');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, false, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, false, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, true, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, true, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Klinik Permata Hati';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'review', 'kars_2026.pdf'),('bpjs_pks', 'missing', null),('art_licence', 'verified', 'art_licence_2026.pdf'),('kfer_cert', 'verified', 'kfer_cert_2026.pdf')) as d(k, s, f) where c.name = 'Klinik Permata Hati'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
update public.clinics set type = 'fertility', description = 'Fertility centre serving Medan and surrounding areas with a focus on reproductive health.', phone = '+62 21 5347 1492', whatsapp = '+62 811 8601 6345', email = 'halo@morulasehatm.id', website = 'https://morulasehatm.id',
  facilities = array['IVF lab','Andrology lab','Prayer room']::text[], province = 'Sumatera Utara', postal_code = '40624', lat = -2.8339, lng = 116.2067, hours = '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, walk_ins = true, teleconsult = true,
  access_notes = 'Parking available · wheelchair accessible', payments = array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], insurers = array['Prudential','AXA Mandiri','Admedika network']::text[], success = '{"iui_pct": 14, "ivf_pct": 41, "period": "2025"}'::jsonb,
  tier = 'listed', accepts_bookings = false, referral_enabled = false, referral_slug = null, admin_email = 'admin@morulasehatm.id',
  terms_signed_at = null, bpjs_level = 'partial', status = 'pending', rating = rating,
  submitted_at = '2026-05-19 09:30+07'::timestamptz, submitted_by = 'clinic admin', verified_at = null
where name = 'Morula Sehat Medan';
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Morula Sehat Medan');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 1),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, true, 2)) as s(l, i, a, b, bp, li, n) where c.name = 'Morula Sehat Medan';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'review', 'bpjs_pks_2026.pdf'),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Morula Sehat Medan'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'dr. Sarah Lestari, SpOG-KFER', 'Jakarta Selatan', 'Jl. Contoh Raya No. 82, Jakarta Selatan', 4.9, false, false, 'private_practice', 'Private practice serving Jakarta Selatan and surrounding areas with a focus on reproductive health.', '+62 21 5401 9188', '+62 811 1075 2392', 'halo@drsarahlesta.id', 'https://drsarahlesta.id',
  array['USG 4D']::text[], 'DKI Jakarta', '82255', -2.6407, 104.4136, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, true,
  'Parking available · wheelchair accessible', array['Private insurance','QRIS','Debit / credit card']::text[], array['Admedika network']::text[], '{}'::jsonb, 'verified', true, true,
  'dr-sarah-lestari-spog-kfer', 'admin@drsarahlesta.id', now() - interval '60 days', 'no', 'verified',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('dr. Sarah Lestari, SpOG-KFER') and city = 'Jakarta Selatan');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'dr. Sarah Lestari, SpOG-KFER');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, false, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, false, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, false, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'dr. Sarah Lestari, SpOG-KFER';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'missing', null),('art_licence', 'missing', null),('kfer_cert', 'verified', 'kfer_cert_2026.pdf')) as d(k, s, f) where c.name = 'dr. Sarah Lestari, SpOG-KFER'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Klinik Sehat Ibu', 'Makassar', 'Jl. Contoh Raya No. 120, Makassar', 3.1, true, false, 'obgyn', 'OB-GYN practice serving Makassar and surrounding areas with a focus on reproductive health.', '+62 21 5960 2363', '+62 811 5161 6165', 'halo@kliniksehati.id', 'https://kliniksehati.id',
  array['Pharmacy']::text[], 'Sulawesi Selatan', '13899', 0.8169, 109.3193, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, false,
  'Parking available · wheelchair accessible', array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], array['Admedika network']::text[], '{}'::jsonb, 'verified', false, false,
  null, 'admin@kliniksehati.id', now() - interval '60 days', 'yes', 'suspended',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('Klinik Sehat Ibu') and city = 'Makassar');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Klinik Sehat Ibu');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, false, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, false, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Klinik Sehat Ibu';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'review', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'verified', 'bpjs_pks_2026.pdf'),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Klinik Sehat Ibu'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Klinik Fertilitas Nusantara', 'Semarang', 'Jl. Contoh Raya No. 9, Semarang', 4.5, false, true, 'fertility', 'Fertility centre serving Semarang and surrounding areas with a focus on reproductive health.', '+62 21 5676 2768', '+62 811 7560 2766', 'halo@klinikfertili.id', 'https://klinikfertili.id',
  array['IVF lab','USG 4D','Egg freezing','Parking']::text[], 'Jawa Tengah', '12213', 1.8357, 106.6781, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, true,
  'Parking available · wheelchair accessible', array['Private insurance','QRIS','Debit / credit card']::text[], array['Prudential','AXA Mandiri','Admedika network']::text[], '{"iui_pct": 14, "ivf_pct": 41, "period": "2025"}'::jsonb, 'sponsor', true, true,
  'klinik-fertilitas-nusantara', 'admin@klinikfertili.id', now() - interval '60 days', 'no', 'verified',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('Klinik Fertilitas Nusantara') and city = 'Semarang');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Klinik Fertilitas Nusantara');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, false, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, false, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, true, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, true, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Klinik Fertilitas Nusantara';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'verified', 'kars_2026.pdf'),('bpjs_pks', 'missing', null),('art_licence', 'verified', 'art_licence_2026.pdf'),('kfer_cert', 'verified', 'kfer_cert_2026.pdf')) as d(k, s, f) where c.name = 'Klinik Fertilitas Nusantara'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'RS Kartika Husada', 'Yogyakarta', 'Jl. Contoh Raya No. 109, Yogyakarta', 4.4, true, false, 'hospital', 'Mother & child hospital serving Yogyakarta and surrounding areas with a focus on reproductive health.', '+62 21 5801 1008', '+62 811 4498 4436', 'halo@rskartikahus.id', 'https://rskartikahus.id',
  array['USG 4D','Pharmacy','Prayer room','Parking']::text[], 'DI Yogyakarta', '59212', 2.761, 99.6935, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, false, false,
  'Parking available · wheelchair accessible', array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], array['Prudential','AXA Mandiri','Admedika network']::text[], '{}'::jsonb, 'verified', true, true,
  'rs-kartika-husada', 'admin@rskartikahus.id', now() - interval '60 days', 'yes', 'verified',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('RS Kartika Husada') and city = 'Yogyakarta');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'RS Kartika Husada');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'RS Kartika Husada';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'verified', 'kars_2026.pdf'),('bpjs_pks', 'verified', 'bpjs_pks_2026.pdf'),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'RS Kartika Husada'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Laboratorium Andro Prima', 'Bandung', 'Jl. Contoh Raya No. 91, Bandung', 4.3, false, false, 'laboratory', 'Andrology and semen analysis laboratory serving Bandung and surrounding areas with a focus on reproductive health.', '+62 21 5506 7877', '+62 811 2196 4252', 'halo@laboratoriuma.id', 'https://laboratoriuma.id',
  array['Andrology lab']::text[], 'Jawa Barat', '21422', 1.0529, 104.2383, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, false,
  'Parking available · wheelchair accessible', array['Private insurance','QRIS','Debit / credit card']::text[], array['Admedika network']::text[], '{}'::jsonb, 'listed', true, false,
  null, 'admin@laboratoriuma.id', now() - interval '60 days', 'no', 'verified',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('Laboratorium Andro Prima') and city = 'Bandung');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Laboratorium Andro Prima');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, false, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, false, false, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, false, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, false, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Laboratorium Andro Prima';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'missing', null),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Laboratorium Andro Prima'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Klinik Bunda Sejahtera', 'Bekasi', 'Jl. Contoh Raya No. 40, Bekasi', 0, true, false, 'obgyn', 'OB-GYN practice serving Bekasi and surrounding areas with a focus on reproductive health.', '+62 21 5440 1248', '+62 811 7718 2933', 'halo@klinikbundas.id', 'https://klinikbundas.id',
  array['USG 4D','Pharmacy']::text[], 'Jawa Barat', '11435', -6.3521, 113.3766, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, false,
  'Parking available · wheelchair accessible', array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], array['Admedika network']::text[], '{}'::jsonb, 'listed', false, false,
  null, 'admin@klinikbundas.id', null, 'yes', 'pending',
  '2026-05-22 09:30+07'::timestamptz, 'clinic admin', null
where not exists (select 1 from public.clinics where lower(name) = lower('Klinik Bunda Sejahtera') and city = 'Bekasi');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Klinik Bunda Sejahtera');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, false, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, false, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Klinik Bunda Sejahtera';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'review', 'operating_licence_2026.pdf'),('nib', 'missing', null),('kars', 'missing', null),('bpjs_pks', 'missing', null),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Klinik Bunda Sejahtera'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Fertility Care Denpasar', 'Denpasar', 'Jl. Contoh Raya No. 8, Denpasar', 0, false, true, 'fertility', 'Fertility centre serving Denpasar and surrounding areas with a focus on reproductive health.', '+62 21 5576 8976', '+62 811 3911 4086', 'halo@fertilitycare.id', 'https://fertilitycare.id',
  array['IVF lab','Parking']::text[], 'Bali', '27166', -2.7546, 102.5853, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, true,
  'Parking available · wheelchair accessible', array['Private insurance','QRIS','Debit / credit card']::text[], array['Prudential','AXA Mandiri','Admedika network']::text[], '{"iui_pct": 14, "ivf_pct": 41, "period": "2025"}'::jsonb, 'listed', false, false,
  null, 'admin@fertilitycare.id', null, 'no', 'pending',
  '2026-05-20 09:30+07'::timestamptz, 'clinic admin', null
where not exists (select 1 from public.clinics where lower(name) = lower('Fertility Care Denpasar') and city = 'Denpasar');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Fertility Care Denpasar');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, false, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, false, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Fertility Care Denpasar';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'review', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'missing', null),('art_licence', 'review', 'art_licence_2026.pdf'),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Fertility Care Denpasar'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'RSIA Permata Bunda', 'Palembang', 'Jl. Contoh Raya No. 54, Palembang', 4.2, true, false, 'hospital', 'Mother & child hospital serving Palembang and surrounding areas with a focus on reproductive health.', '+62 21 5759 7287', '+62 811 2908 7469', 'halo@rsiapermatab.id', 'https://rsiapermatab.id',
  array['Pharmacy','Prayer room','Parking']::text[], 'Sumatera Selatan', '45362', -3.0613, 103.0489, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, false, false,
  'Parking available · wheelchair accessible', array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], array['Prudential','AXA Mandiri','Admedika network']::text[], '{}'::jsonb, 'verified', true, true,
  'rsia-permata-bunda', 'admin@rsiapermatab.id', now() - interval '60 days', 'yes', 'verified',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('RSIA Permata Bunda') and city = 'Palembang');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'RSIA Permata Bunda');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, false, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'RSIA Permata Bunda';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'verified', 'kars_2026.pdf'),('bpjs_pks', 'verified', 'bpjs_pks_2026.pdf'),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'RSIA Permata Bunda'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Klinik Harapan Keluarga', 'Balikpapan', 'Jl. Contoh Raya No. 111, Balikpapan', 4.0, true, false, 'obgyn', 'OB-GYN practice serving Balikpapan and surrounding areas with a focus on reproductive health.', '+62 21 5922 5983', '+62 811 1321 4452', 'halo@klinikharapan.id', 'https://klinikharapan.id',
  array['USG 4D']::text[], 'Kalimantan Timur', '88907', -5.746, 119.413, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, false,
  'Parking available · wheelchair accessible', array['BPJS Kesehatan (with referral)','Private insurance','QRIS','Debit / credit card']::text[], array['Admedika network']::text[], '{}'::jsonb, 'listed', true, true,
  'klinik-harapan-keluarga', 'admin@klinikharapan.id', now() - interval '60 days', 'yes', 'verified',
  now() - interval '90 days', 'clinic admin', now() - interval '90 days'
where not exists (select 1 from public.clinics where lower(name) = lower('Klinik Harapan Keluarga') and city = 'Balikpapan');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Klinik Harapan Keluarga');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, true, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, true, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, false, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, false, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, false, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, false, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Klinik Harapan Keluarga';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'verified', 'bpjs_pks_2026.pdf'),('art_licence', 'missing', null),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Klinik Harapan Keluarga'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;
insert into public.clinics (name, city, address, rating, bpjs, ivf_lab, type, description, phone, whatsapp, email, website, facilities, province, postal_code, lat, lng, hours, walk_ins, teleconsult,
  access_notes, payments, insurers, success, tier, accepts_bookings, referral_enabled, referral_slug, admin_email, terms_signed_at, bpjs_level, status, submitted_at, submitted_by, verified_at)
select 'Morula Sehat Surabaya', 'Surabaya', 'Jl. Contoh Raya No. 83, Surabaya', 0, false, true, 'fertility', 'Fertility centre serving Surabaya and surrounding areas with a focus on reproductive health.', '+62 21 5690 2643', '+62 811 1689 3397', 'halo@morulasehats.id', 'https://morulasehats.id',
  array['IVF lab','Andrology lab','USG 4D','Pharmacy','Prayer room','Parking']::text[], 'Jawa Timur', '89997', -5.4477, 103.998, '{"mon": [["08:00", "20:00"]], "tue": [["08:00", "20:00"]], "wed": [["08:00", "20:00"]], "thu": [["08:00", "20:00"]], "fri": [["08:00", "11:30"], ["13:00", "20:00"]], "sat": [["08:00", "14:00"]]}'::jsonb, true, true,
  'Parking available · wheelchair accessible', array['Private insurance','QRIS','Debit / credit card']::text[], array['Prudential','AXA Mandiri','Admedika network']::text[], '{"iui_pct": 14, "ivf_pct": 41, "period": "2025"}'::jsonb, 'listed', false, false,
  null, 'admin@morulasehats.id', null, 'no', 'draft',
  null, null, null
where not exists (select 1 from public.clinics where lower(name) = lower('Morula Sehat Surabaya') and city = 'Surabaya');
delete from public.clinic_services where clinic_id = (select id from public.clinics where name = 'Morula Sehat Surabaya');
insert into public.clinic_services (clinic_id, label, icon, price_min, price_max, bpjs, listed, sort_order)
select c.id, s.l, s.i, s.a, s.b, s.bp, s.li, s.n from public.clinics c, (values
  ('OB-GYN consultation', 'stethoscope', 300000, 450000, false, true, 0),
  ('Fertility work-up (HSG, AMH, USG)', 'scan', 1500000, 3000000, false, true, 1),
  ('Semen analysis', 'microscope', 400000, 650000, false, true, 2),
  ('IUI · per cycle', 'syringe', 4500000, 6000000, false, true, 3),
  ('IVF · per cycle', 'flask', 70000000, 85000000, false, true, 4),
  ('Egg freezing', 'snowflake', 35000000, 45000000, false, true, 5)) as s(l, i, a, b, bp, li, n) where c.name = 'Morula Sehat Surabaya';
insert into public.clinic_documents (clinic_id, kind, status, file_name, verified_at)
select c.id, d.k, d.s, d.f, case when d.s = 'verified' then now() - interval '80 days' end from public.clinics c, (values ('operating_licence', 'verified', 'operating_licence_2026.pdf'),('nib', 'verified', 'nib_2026.pdf'),('kars', 'missing', null),('bpjs_pks', 'review', 'bpjs_pks_2026.pdf'),('art_licence', 'verified', 'art_licence_2026.pdf'),('kfer_cert', 'missing', null)) as d(k, s, f) where c.name = 'Morula Sehat Surabaya'
on conflict (clinic_id, kind) do update set status = excluded.status, file_name = excluded.file_name, verified_at = excluded.verified_at;

update public.clinics set status_reason = 'Repeated no-shows and unresolved patient complaints' where status = 'suspended';
-- Link a few seeded doctors to the extra clinics and mark roles.
update public.doctor_locations l set clinic_role = 'medical_director' from public.doctors d where l.doctor_id = d.id and d.name like 'dr. Sarah%' and l.kind = 'primary';
