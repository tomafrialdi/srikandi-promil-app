-- Dev-only console admin. Local development only, never run against production.
--   email:    admin@srikandipromil.id
--   password: Admin#12345
-- 2FA is enrolled on first sign-in (TOTP).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'admin@srikandipromil.id',
  extensions.crypt('Admin#12345', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Tommy Afrialdi"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@srikandipromil.id"}',
  'email', now(), now(), now()
);

insert into public.admin_profiles (id, full_name, role)
values ('11111111-1111-1111-1111-111111111111', 'Tommy Afrialdi', 'super_admin');
