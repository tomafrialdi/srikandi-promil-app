-- Doctors & specialists: profile, licences (STR / SIP), practice locations and weekly slots, time off,
-- consultation prices, platform roles, granular review permissions and activity.
-- Extends the doctors table that user care teams already point at.

alter table public.doctors
  add column title text not null default 'dr.' check (char_length(title) <= 10),
  add column full_name text,
  add column degree text check (char_length(degree) <= 40),
  add column specialty_group text not null default 'SpOG' check (specialty_group in ('SpOG', 'SpOG-KFER', 'SpAnd', 'Psychologist', 'Midwife')),
  add column years_experience integer check (years_experience is null or years_experience between 0 and 60),
  add column focus text[] not null default '{}' check (cardinality(focus) <= 4),
  add column bio text check (char_length(bio) <= 280),
  add column photo_url text,
  add column status text not null default 'pending' check (status in ('draft', 'pending', 'active', 'suspended')),
  add column status_reason text,
  add column listed boolean not null default true,
  add column accepting boolean not null default true,
  add column role_medical_reviewer boolean not null default false,
  add column role_engine_signoff boolean not null default false,
  add column role_community_expert boolean not null default false,
  add column role_public_advisor boolean not null default false,
  add column accepts_bpjs boolean not null default false,
  add column languages text[] not null default '{Bahasa Indonesia}',
  add column str_number text check (str_number is null or str_number ~ '^[0-9 ]{10,24}$'),
  add column str_valid_until date,
  add column str_status text not null default 'pending' check (str_status in ('pending', 'verified', 'rejected')),
  add column str_verified_at timestamptz,
  add column sip_number text check (char_length(sip_number) <= 60),
  add column sip_valid_until date,
  add column cert_label text,
  add column cert_verified_at date,
  add column booking jsonb not null default '{"window_days": 30, "min_notice_hours": 4, "auto_confirm": true, "same_day_tele": true, "slot_minutes": 30, "buffer_minutes": 10, "max_patients": 8}',
  add column fee_pct numeric(4, 1) not null default 10 check (fee_pct between 0 and 50),
  add column fee_paid_by text not null default 'clinic' check (fee_paid_by in ('clinic', 'doctor')),
  add column payout_schedule text not null default 'weekly_monday' check (payout_schedule in ('weekly_monday', 'biweekly', 'monthly')),
  add column bank jsonb not null default '{}',
  add column discounts jsonb not null default '{"plus_discount": true, "accept_promos": true, "first_tele_free": false}',
  add column portal_email text,
  add column admin_id uuid references public.admin_profiles (id) on delete set null,
  -- Measured numbers (teleconsult, referral and review pipelines write these).
  add column stats jsonb not null default '{}',
  add column reviews_count integer not null default 0,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid references public.admin_profiles (id) on delete set null;

update public.doctors set full_name = name where full_name is null;
alter table public.doctors alter column full_name set not null;

create trigger doctors_set_updated_at
  before update on public.doctors
  for each row execute function public.set_updated_at();

create index doctors_status_idx on public.doctors (status);
create index doctors_group_idx on public.doctors (specialty_group);

create table public.doctor_locations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  clinic_id uuid references public.clinics (id) on delete set null,
  kind text not null check (kind in ('primary', 'secondary', 'virtual')),
  label text not null check (char_length(label) between 2 and 80),
  address text check (char_length(address) <= 160),
  sip_number text check (char_length(sip_number) <= 60),
  sort_order integer not null default 0
);
create index doctor_locations_doctor_idx on public.doctor_locations (doctor_id, sort_order);
create unique index doctor_locations_one_primary on public.doctor_locations (doctor_id) where kind = 'primary';
create unique index doctor_locations_one_virtual on public.doctor_locations (doctor_id) where kind = 'virtual';

-- weekday 1 = Monday … 7 = Sunday. location_id points at a virtual location for teleconsult slots.
create table public.doctor_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  location_id uuid not null references public.doctor_locations (id) on delete cascade,
  weekday integer not null check (weekday between 1 and 7),
  starts time not null,
  ends time not null,
  check (ends > starts)
);
create index doctor_slots_doctor_idx on public.doctor_slots (doctor_id, weekday, starts);

create table public.doctor_time_off (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text not null check (char_length(reason) between 2 and 100),
  note text check (char_length(note) <= 120),
  is_auto boolean not null default false,
  check (to_date >= from_date)
);
create index doctor_time_off_doctor_idx on public.doctor_time_off (doctor_id, from_date);

create table public.doctor_services (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  kind text not null check (kind in ('clinic_first', 'clinic_followup', 'tele_video', 'tele_chat', 'report_review', 'second_opinion')),
  price_idr integer not null default 0 check (price_idr between 0 and 50000000),
  bpjs boolean not null default false,
  active boolean not null default false,
  unique (doctor_id, kind)
);

create table public.doctor_permissions (
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  area text not null check (area in ('articles', 'medications', 'engine', 'community', 'notifications', 'clinic_verification')),
  can_view boolean not null default false,
  can_review boolean not null default false,
  can_approve boolean not null default false,
  can_publish boolean not null default false,
  primary key (doctor_id, area)
);

create table public.doctor_activity (
  id bigint generated always as identity primary key,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  category text not null check (category in ('profile', 'review', 'consult', 'security')),
  icon text not null default 'dot',
  tone text not null default 'neutral' check (tone in ('success', 'info', 'warning', 'error', 'neutral')),
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index doctor_activity_doctor_idx on public.doctor_activity (doctor_id, created_at desc);

alter table public.doctor_locations enable row level security;
alter table public.doctor_slots enable row level security;
alter table public.doctor_time_off enable row level security;
alter table public.doctor_services enable row level security;
alter table public.doctor_permissions enable row level security;
alter table public.doctor_activity enable row level security;

-- Access follows the "Clinics" column of the access matrix (doctors belong to the care network).
create function analytics_private.require_doctors_view()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if coalesce((select m.level from public.admin_access_matrix m where m.role = analytics_private.console_role() and m.area = 'clinics'), 'none') = 'none' then
    raise exception 'your role is not allowed to view doctors' using errcode = '42501';
  end if;
end;
$$;

create function analytics_private.require_doctors_edit()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
end;
$$;

create function analytics_private.doctor_specialties()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_array(
    jsonb_build_object('group', 'SpOG', 'label', 'Obstetrics & Gynaecology (SpOG)', 'subtitle', 'Obstetrics & gynaecology'),
    jsonb_build_object('group', 'SpOG-KFER', 'label', 'Obstetrics & Gynaecology — Fertility (KFER)', 'subtitle', 'Reproductive endocrinology'),
    jsonb_build_object('group', 'SpAnd', 'label', 'Andrology (SpAnd)', 'subtitle', 'Andrology · male fertility'),
    jsonb_build_object('group', 'Psychologist', 'label', 'Fertility psychologist', 'subtitle', 'Fertility psychologist'),
    jsonb_build_object('group', 'Midwife', 'label', 'Midwife · preconception', 'subtitle', 'Midwife · preconception'))
$$;

create function analytics_private.doctor_write_activity(p_doctor uuid, p_category text, p_icon text, p_tone text, p_title text, p_detail text default null)
returns void
language sql
set search_path = ''
as $$
  insert into public.doctor_activity (doctor_id, category, icon, tone, title, detail) values (p_doctor, p_category, p_icon, p_tone, p_title, p_detail)
$$;

-- "dr." + "Sarah Lestari" + "SpOG-KFER" -> "dr. Sarah Lestari, SpOG-KFER"
create function analytics_private.doctor_display_name(p_title text, p_full text, p_degree text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both ' ' from coalesce(nullif(trim(p_title), '') || ' ', '') || trim(p_full)) || coalesce(', ' || nullif(trim(p_degree), ''), '')
$$;
