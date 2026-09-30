-- Dev catalogue: the medications the seeded users already log, plus a few more in every review state.

insert into public.medications (name, generic_name, type, category, strength_value, strength_unit, form, brands, bpom, rx, require_doctor_note, presets,
  reminder_template, warnings, show_quick_log, show_program, suggest_pcos, include_report, reviewer_id, status, reviewed_by, reviewed_at, match_names, created_by)
select m.name, m.generic, m.type, m.category, m.sv, m.su, m.form, m.brands, m.bpom, m.rx, m.rx, m.presets::jsonb,
  m.reminder, m.warnings, true, m.program, m.pcos, true,
  (select id from public.admin_profiles where full_name = m.reviewer), m.status,
  case when m.status = 'published' then m.reviewer end, case when m.status = 'published' then m.reviewed::timestamptz end, m.match,
  (select id from public.admin_profiles where full_name = 'Bayu Pratama')
from (values
  ('Folic acid 400 mcg', 'Folic acid', 'supplement', 'Supplement', 400, 'mcg', 'tablet', array['Folavit', 'Folamil'], null, false,
   '[{"dose":"400 mcg","frequency":"1× daily","timing":"Every day (no cycle link)","time":"08:00"}]', 'Time for {name} {dose} 🌿',
   'Start at least a month before trying to conceive.', false, false, 'dr. Sarah Lestari', 'published', '2026-01-14', array['Folic acid 400 mcg']),
  ('Letrozole 2.5 mg', 'Letrozole', 'oral', 'Ovulation induction', 2.5, 'mg', 'tablet', array['Femara', 'Letrozol Hexpharm', 'Lezra'], 'DKL1234567810A1', true,
   '[{"dose":"2.5 mg","frequency":"1× daily","timing":"CD 3–7","time":"20:00"},{"dose":"5 mg","frequency":"1× daily","timing":"CD 3–7","time":"20:00"},{"dose":"7.5 mg","frequency":"1× daily","timing":"CD 3–7","time":"20:00"}]',
   'Time for Letrozole {dose} 💊 · Day {n} of 5', 'Take only as prescribed by your doctor. Stop and contact your clinic if you have severe pelvic pain.',
   true, false, 'dr. Sarah Lestari', 'published', '2026-05-02', array['Letrozole 2.5 mg']),
  ('Clomiphene citrate 50 mg', 'Clomiphene citrate', 'oral', 'Ovulation induction', 50, 'mg', 'tablet', array['Clomid', 'Blesifen'], 'DKL9876543210A1', true,
   '[{"dose":"50 mg","frequency":"1× daily","timing":"CD 3–7","time":"20:00"}]', 'Time for {name} {dose} 💊 · Day {n} of 5',
   'May cause hot flashes and blurred vision. Tell your doctor about any vision changes.', true, false, 'dr. Andi Wibowo', 'published', '2026-03-11', array[]::text[]),
  ('hCG trigger (Ovidrel)', 'choriogonadotropin alfa', 'injection', 'Trigger shot', 250, 'mcg', 'pen', array['Ovidrel', 'choriogonadotropin alfa'], 'DKI5544332211A1', true,
   '[{"dose":"250 mcg","frequency":"Once","timing":"Trigger day","time":"21:00"}]', 'Trigger shot tonight at {time} — {name} {dose}',
   'Inject exactly at the time your clinic gave you. Do not skip.', true, false, 'dr. Sarah Lestari', 'published', '2026-05-02', array['Ovidrel trigger']),
  ('Progesterone 200 mg', 'Progesterone', 'topical', 'Luteal support', 200, 'mg', 'suppository', array['Utrogestan', 'Cygest'], 'DKL5566778899A1', true,
   '[{"dose":"200 mg","frequency":"2× daily","timing":"From ovulation until test","time":"08:00, 20:00"}]', 'Time for {name} {dose} · {n} DPO',
   'Use as instructed. Report unusual bleeding to your doctor.', true, false, 'dr. Sarah Lestari', 'published', '2026-01-14', array['Progesterone 200 mg']),
  ('Myo-inositol 2 g', 'Myo-inositol', 'supplement', 'Supplement · PCOS', 2, 'g', 'sachet', array['Inofolic', 'Ovacare', 'Pregnosia'], null, false,
   '[{"dose":"2 g","frequency":"2× daily","timing":"Every day (no cycle link)","time":"08:00, 20:00"},{"dose":"4 g","frequency":"1× daily","timing":"Every day (no cycle link)","time":"08:00"}]',
   'Time for {name} {dose} 🌿', 'May cause mild nausea. Consult your doctor if you are taking metformin or have diabetes.', false, true, 'dr. Andi Wibowo', 'in_review', null, array['Myo-inositol 2 g']),
  ('Metformin 500 mg', 'Metformin', 'oral', 'PCOS · insulin', 500, 'mg', 'tablet', array['Glucophage'], 'DKL1122334455A1', true,
   '[{"dose":"500 mg","frequency":"2× daily","timing":"Every day (no cycle link)","time":"08:00, 20:00"}]', 'Time for {name} {dose} 💊',
   'Take with food. Tell your doctor about kidney problems.', false, true, 'dr. Andi Wibowo', 'draft', null, array[]::text[]),
  ('Vitamin D3 1000 IU', 'Vitamin D3', 'supplement', 'Supplement', 1000, 'IU', 'capsule', array['Vidoran', 'Calcitrol D3'], null, false,
   '[{"dose":"1000 IU","frequency":"1× daily","timing":"Every day (no cycle link)","time":"08:00"}]', 'Time for {name} {dose} 🌿', 'Do not exceed the dose on the label.', false, false, 'dr. Sarah Lestari', 'published', '2026-01-14', array['Vitamin D3 1000 IU']),
  ('Coenzyme Q10 100 mg', 'Coenzyme Q10', 'supplement', 'Supplement', 100, 'mg', 'capsule', array['Q10 Plus'], null, false,
   '[{"dose":"100 mg","frequency":"1× daily","timing":"Every day (no cycle link)","time":"08:00"}]', 'Time for {name} {dose} 🌿', 'May interact with blood thinners.', false, false, 'dr. Sarah Lestari', 'published', '2026-02-20', array[]::text[]),
  ('Levothyroxine 50 mcg', 'Levothyroxine', 'oral', 'Thyroid', 50, 'mcg', 'tablet', array['Euthyrox', 'Thyrax'], 'DKL2233445566A1', true,
   '[{"dose":"50 mcg","frequency":"1× daily","timing":"Every day (no cycle link)","time":"06:30"}]', 'Time for {name} {dose} 💊', 'Take on an empty stomach, 30 minutes before breakfast.', false, false, 'dr. Andi Wibowo', 'published', '2026-03-11', array[]::text[]),
  ('Dydrogesterone 10 mg', 'Dydrogesterone', 'oral', 'Luteal support', 10, 'mg', 'tablet', array['Duphaston'], 'DKL3344556677A1', true,
   '[{"dose":"10 mg","frequency":"2× daily","timing":"From ovulation until test","time":"08:00, 20:00"}]', 'Time for {name} {dose} · {n} DPO', 'Use only as prescribed.', true, false, 'dr. Sarah Lestari', 'published', '2026-04-02', array[]::text[]),
  ('Paracetamol 500 mg', 'Paracetamol', 'oral', 'Pain relief', 500, 'mg', 'tablet', array['Panadol', 'Sanmol'], null, false,
   '[{"dose":"500 mg","frequency":"As needed","timing":"Every day (no cycle link)","time":""}]', 'Time for {name} {dose}', 'Do not take more than 4 g per day.', false, false, 'dr. Andi Wibowo', 'published', '2026-02-20', array[]::text[]),
  ('Omega-3 1000 mg', 'Omega-3', 'supplement', 'Supplement', 1000, 'mg', 'capsule', array['Blackmores Omega'], null, false,
   '[{"dose":"1000 mg","frequency":"1× daily","timing":"Every day (no cycle link)","time":"12:00"}]', 'Time for {name} {dose} 🌿', 'Choose a mercury-tested product.', false, false, 'dr. Sarah Lestari', 'draft', null, array[]::text[])
) as m(name, generic, type, category, sv, su, form, brands, bpom, rx, presets, reminder, warnings, program, pcos, reviewer, status, reviewed, match);

update public.user_medications um set medication_id = m.id
from public.medications m
where um.medication_id is null and (lower(um.name) = lower(m.name) or um.name = any (m.match_names));

