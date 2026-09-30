-- Clinics & specialists directory ("Find a specialist"): profile, location & hours, services and price ranges,
-- payment / insurance, licences & documents, linked doctors, listing tier and clinic admin access.
-- Extends the clinics table that user care journeys already point at.

alter table public.clinics
  add column legal_entity text check (char_length(legal_entity) <= 120),
  add column type text not null default 'fertility' check (type in ('fertility', 'hospital', 'obgyn', 'laboratory', 'private_practice')),
  add column description text check (char_length(description) <= 200),
  add column photos text[] not null default '{}' check (cardinality(photos) <= 6),
  add column phone text check (char_length(phone) <= 30),
  add column whatsapp text check (char_length(whatsapp) <= 30),
  add column email text check (char_length(email) <= 120),
  add column website text check (char_length(website) <= 200),
  add column facilities text[] not null default '{}' check (cardinality(facilities) <= 12),
  add column province text,
  add column postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  add column lat numeric(9, 6) check (lat is null or lat between -11.5 and 6.5),
  add column lng numeric(9, 6) check (lng is null or lng between 94 and 142),
  add column hours jsonb not null default '{}',
  add column walk_ins boolean not null default false,
  add column teleconsult boolean not null default false,
  add column access_notes text check (char_length(access_notes) <= 200),
  add column payments text[] not null default '{}',
  add column insurers text[] not null default '{}',
  add column success jsonb not null default '{}',
  add column tier text not null default 'listed' check (tier in ('listed', 'verified', 'sponsor')),
  add column accepts_bookings boolean not null default false,
  add column referral_enabled boolean not null default false,
  add column referral_slug text unique check (referral_slug is null or referral_slug ~ '^[a-z0-9-]{3,60}$'),
  add column admin_email text check (char_length(admin_email) <= 120),
  add column admin_role text not null default 'clinic_manager' check (admin_role in ('owner', 'clinic_manager', 'front_desk')),
  add column terms_signed_at timestamptz,
  add column bpjs_level text not null default 'no' check (bpjs_level in ('yes', 'partial', 'no')),
  add column status text not null default 'draft' check (status in ('draft', 'pending', 'verified', 'suspended')),
  add column status_reason text,
  add column submitted_at timestamptz,
  add column submitted_by text,
  add column verified_at timestamptz,
  add column docs_request jsonb,
  add column created_by uuid references public.admin_profiles (id) on delete set null,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid references public.admin_profiles (id) on delete set null;

create trigger clinics_set_updated_at
  before update on public.clinics
  for each row execute function public.set_updated_at();

create index clinics_status_idx on public.clinics (status);
create index clinics_city_idx on public.clinics (city);

create table public.clinic_services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  label text not null check (char_length(label) between 2 and 80),
  icon text not null default 'stethoscope',
  price_min integer not null default 0 check (price_min between 0 and 1000000000),
  price_max integer not null default 0 check (price_max between 0 and 1000000000),
  bpjs boolean not null default false,
  listed boolean not null default false,
  sort_order integer not null default 0,
  check (price_max >= price_min)
);
create index clinic_services_clinic_idx on public.clinic_services (clinic_id, sort_order);

-- Status of each licence. The files themselves live in encrypted storage (not built yet): only the name is kept here.
create table public.clinic_documents (
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  kind text not null check (kind in ('operating_licence', 'nib', 'kars', 'bpjs_pks', 'art_licence', 'kfer_cert')),
  file_name text check (char_length(file_name) <= 120),
  status text not null default 'missing' check (status in ('missing', 'review', 'verified', 'rejected')),
  note text check (char_length(note) <= 200),
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (clinic_id, kind)
);

alter table public.doctor_locations
  add column clinic_role text not null default 'doctor' check (clinic_role in ('doctor', 'medical_director', 'visiting'));

alter table public.clinic_services enable row level security;
alter table public.clinic_documents enable row level security;

create function analytics_private.require_clinics_edit()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
end;
$$;

create function analytics_private.clinic_days()
returns text[]
language sql
immutable
set search_path = ''
as $$ select array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] $$;

create function analytics_private.clinic_slug(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(trim(both '-' from regexp_replace(lower(regexp_replace(coalesce(p_name, ''), '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')), 60)
$$;
