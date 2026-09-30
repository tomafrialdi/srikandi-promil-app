-- Dev data for Roles & access: a 35-person team (dev admin + 34), their 2FA / passkeys, sessions, devices, audit history.
-- The extra members have no usable password; only admin@srikandipromil.id can sign in.

create temp table _team (n integer, full_name text, role public.admin_role, seen interval, pw_age interval, passkey boolean);
insert into _team
select row_number() over (), t.full_name, t.role::public.admin_role, t.seen::interval, t.pw_age::interval, t.passkey
from (values
  ('Laras Wulandari', 'super_admin', '3 days', '30 days', true),
  ('Hendra Kusuma', 'admin', '4 hours', '52 days', true),
  ('Maya Puspita', 'admin', '1 day', '18 days', true),
  ('Rizky Fadillah', 'admin', '9 hours', '77 days', true),
  ('Anisa Rahmawati', 'admin', '2 days', '25 days', true),
  ('dr. Sarah Lestari', 'medical_reviewer', '2 hours', '33 days', true),
  ('dr. Andini Prameswari', 'medical_reviewer', '5 hours', '60 days', true),
  ('dr. Kevin Hartono', 'medical_reviewer', '1 day', '41 days', false),
  ('dr. Nadia Safitri', 'medical_reviewer', '6 hours', '12 days', true),
  ('Bayu Pratama', 'engine_engineer', '15 minutes', '20 days', true),
  ('Fajar Nugroho', 'engine_engineer', '3 hours', '66 days', true),
  ('Citra Ayu Lestari', 'engine_engineer', '2 days', '9 days', false),
  ('Putri Ananda', 'content_editor', '30 minutes', '15 days', false),
  ('Galih Permana', 'content_editor', '7 hours', '48 days', true),
  ('Salsabila Nur', 'content_editor', '1 day', '70 days', true),
  ('Dimas Aryo', 'content_editor', '2 days', '35 days', true),
  ('Wulan Sari', 'content_editor', '4 days', '22 days', false),
  ('Rina Maharani', 'moderator', '1 day', '38 days', true),
  ('Yoga Prasetyo', 'moderator', '3 hours', '120 days', false),
  ('Intan Permatasari', 'moderator', '8 hours', '14 days', true),
  ('Bagas Saputra', 'moderator', '2 days', '58 days', false),
  ('Novi Yulianti', 'moderator', '10 hours', '27 days', true),
  ('Reza Mahendra', 'moderator', '5 days', '81 days', false),
  ('Dewi Anggraini', 'support_agent', '1 minute', '16 days', true),
  ('Agus Setiawan', 'support_agent', '2 hours', '44 days', false),
  ('Melati Kusuma', 'support_agent', '11 hours', '31 days', true),
  ('Fitri Handayani', 'support_agent', '1 day', '63 days', false),
  ('Doni Wibowo', 'support_agent', '4 hours', '125 days', true),
  ('Sekar Ayu', 'support_agent', '3 days', '19 days', false),
  ('Taufik Hidayat', 'support_agent', '6 hours', '72 days', true),
  ('Larasati Putri', 'support_agent', '2 days', '10 days', false),
  ('Andra Wijaya', 'analyst', '5 hours', '29 days', true),
  ('Clara Sutanto', 'analyst', '1 day', '55 days', false),
  ('Eko Prasetyo', 'analyst', '3 days', '47 days', true)
) as t(full_name, role, seen, pw_age, passkey);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  ('22222222-2222-2222-2222-' || lpad(t.n::text, 12, '0'))::uuid,
  'authenticated', 'authenticated',
  lower(regexp_replace(regexp_replace(t.full_name, '^dr\. ', ''), '\s+', '.', 'g')) || '@srikandipromil.id',
  extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', t.full_name),
  now() - interval '200 days', now(), now() - t.seen,
  '', '', '', '', '', '', '', ''
from _team t;

insert into public.admin_profiles (id, full_name, role, created_at, password_changed_at)
select ('22222222-2222-2222-2222-' || lpad(t.n::text, 12, '0'))::uuid, t.full_name, t.role, now() - interval '200 days', now() - t.pw_age
from _team t;

-- 2FA for everyone, passkeys for most.
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
select gen_random_uuid(), ('22222222-2222-2222-2222-' || lpad(t.n::text, 12, '0'))::uuid, 'Authenticator', 'totp', 'verified',
       now() - interval '190 days', now() - interval '190 days', 'dev-seed-secret'
from _team t;

insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
select gen_random_uuid(), ('22222222-2222-2222-2222-' || lpad(t.n::text, 12, '0'))::uuid, 'Passkey', 'webauthn', 'verified',
       now() - interval '120 days', now() - interval '120 days'
from _team t where t.passkey;

-- 53 live sessions across 29 members (the dev admin adds their own when signing in).
insert into auth.sessions (id, user_id, created_at, updated_at, refreshed_at, user_agent, ip, aal)
select gen_random_uuid(), ('22222222-2222-2222-2222-' || lpad(t.n::text, 12, '0'))::uuid,
       now() - t.seen - interval '1 hour', now() - t.seen, now() - t.seen,
       (array['Mozilla/5.0 (Macintosh) Chrome/126', 'SrikandiAdmin/2.4 (iOS)', 'Mozilla/5.0 (Windows NT 10.0) Edge/126'])[1 + (t.n + s) % 3],
       ('103.12.44.' || (10 + t.n))::inet, 'aal2'
from _team t
cross join generate_series(1, 2) s
where t.n <= 29 and (t.n <= 24 or s = 1);

-- Devices: 31 managed laptops, 18 admin-app installs, 4 unmanaged browsers.
insert into public.admin_devices (admin_id, kind, last_seen_at)
select ('22222222-2222-2222-2222-' || lpad((1 + (d.i % 34))::text, 12, '0'))::uuid, d.kind, now() - (d.i % 20 || ' days')::interval
from (
  select i, 'managed_laptop' as kind from generate_series(1, 31) i
  union all select i + 40, 'admin_app' from generate_series(1, 18) i
  union all select i + 80, 'browser' from generate_series(1, 4) i
) d;

insert into public.admin_devices (admin_id, kind) values ('11111111-1111-1111-1111-111111111111', 'managed_laptop');

-- Temporary allowlist entry for a clinic visit.
insert into public.admin_ip_allowlist (cidr, label, expires_on)
values ('182.1.7.3/32', 'dr. Sarah — clinic (temporary)', current_date + 30);

update public.admin_ip_allowlist a set last_used_at = now() - u.ago
from (values ('103.12.44.0/24', interval '12 minutes'), ('10.0.0.0/16', interval '0 minutes'),
             ('36.84.10.0/24', interval '2 days'), ('182.1.7.3/32', interval '1 day')) as u(cidr, ago)
where a.cidr = u.cidr::cidr;

-- Policy last changed by two Super admins.
update public.admin_security_policy
   set requested_by = '11111111-1111-1111-1111-111111111111', approved_by = '22222222-2222-2222-2222-000000000001',
       updated_at = now() - interval '18 days', version = 3;

-- Recent audit history.
insert into public.audit_log (actor_id, actor_email, action, resource, metadata, ip, created_at)
select p.id, u.email, a.action, a.resource, jsonb_build_object('summary', a.summary), a.ip, now() - a.ago
from (values
  ('Dewi Anggraini', 'engine.override', 'usr_8f21k9', 'Overrode LH result → Peak', '103.12.44.21', interval '40 minutes'),
  ('Tommy Afrialdi', 'health.unmask', 'usr_8f21k9', 'Unmasked health data (reason: TCK-4821)', '36.84.10.2', interval '51 minutes'),
  ('Bayu Pratama', 'engine.canary', 'engine/pcos', 'Expanded canary v3.5 → 5%', '10.0.1.5', interval '1 hour 32 minutes'),
  ('Rina Maharani', 'community.remove', 'post_77120', 'Removed post + warned user', '114.5.7.9', interval '9 hours'),
  ('dr. Sarah Lestari', 'content.approve', 'art_2291', 'Approved article “Fertile window”', '182.1.7.3', interval '13 hours'),
  ('Tommy Afrialdi', 'admin.role_change', 'adm_0014', 'Changed role: Bayu → Engine engineer', '36.84.10.2', interval '16 hours')
) as a(actor, action, resource, summary, ip, ago)
join public.admin_profiles p on p.full_name = a.actor
join auth.users u on u.id = p.id;

drop table _team;
-- Department and job title per role (dev data).
update public.admin_profiles p set department = d.department, job_title = d.title
from (values
  ('super_admin', 'Operations', 'Chief operating officer'),
  ('admin', 'Operations', 'Operations manager'),
  ('medical_reviewer', 'Medical', 'Medical reviewer'),
  ('engine_engineer', 'Engineering', 'Engine engineer'),
  ('content_editor', 'Content', 'Content editor'),
  ('moderator', 'Community', 'Community moderator'),
  ('support_agent', 'Customer care', 'Support agent'),
  ('analyst', 'Operations', 'Data analyst')
) as d(role, department, title)
where p.role = d.role::public.admin_role and p.id::text like '22222222-%' and p.department is null;
