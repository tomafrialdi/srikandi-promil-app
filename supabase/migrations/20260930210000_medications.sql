-- Medications catalogue: the master list behind the app's Meds log, Treatment program and reminders.
-- Every new item or edit goes through one medical reviewer before the app can use it.

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text not null check (char_length(generic_name) between 2 and 80),
  type text not null check (type in ('oral', 'injection', 'supplement', 'topical')),
  category text not null,
  strength_value numeric not null check (strength_value > 0),
  strength_unit text not null check (strength_unit in ('mg', 'mcg', 'g', 'IU', 'mIU', 'ml')),
  form text not null check (form in ('tablet', 'capsule', 'sachet', 'injection', 'pen', 'suppository', 'gel', 'other')),
  brands text[] not null default '{}' check (cardinality(brands) <= 10),
  bpom text check (bpom is null or bpom ~ '^[A-Z0-9]{8,20}$'),
  rx boolean not null default false,
  require_doctor_note boolean not null default false,
  presets jsonb not null default '[]' check (jsonb_typeof(presets) = 'array' and jsonb_array_length(presets) <= 8),
  reminder_template text not null default '' check (char_length(reminder_template) <= 160),
  warnings text not null default '' check (char_length(warnings) <= 400),
  show_quick_log boolean not null default true,
  show_program boolean not null default false,
  suggest_pcos boolean not null default false,
  include_report boolean not null default true,
  reviewer_id uuid references public.admin_profiles (id) on delete set null,
  article_id uuid references public.content_items (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published')),
  -- Proposed edit of a published item; the published values stay live until it is approved.
  revision jsonb,
  revision_by uuid references public.admin_profiles (id) on delete set null,
  review_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_by uuid references public.admin_profiles (id) on delete set null,
  match_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index medications_name_idx on public.medications (lower(name));

create trigger medications_set_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

alter table public.medications enable row level security;

-- What people log in the app now points at the catalogue.
alter table public.user_medications add column medication_id uuid references public.medications (id) on delete set null;
create index user_medications_med_idx on public.user_medications (medication_id);

create function analytics_private.require_meds_view()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if analytics_private.console_role() not in ('super_admin', 'admin', 'medical_reviewer', 'content_editor', 'support_agent', 'analyst', 'engine_engineer') then
    raise exception 'your role is not allowed to view medications' using errcode = '42501';
  end if;
end;
$$;

create function analytics_private.require_meds_edit()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  perform analytics_private.require_role(array['super_admin', 'admin', 'medical_reviewer']::public.admin_role[]);
end;
$$;

create function analytics_private.med_categories()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['Supplement', 'Supplement · PCOS', 'Ovulation induction', 'Trigger shot', 'Luteal support', 'PCOS · insulin',
               'Thyroid', 'Anticoagulant', 'Immune support', 'Antibiotic', 'Pain relief', 'Other']
$$;

-- The fields a reviewer signs off; used for both a new item and a revision of a published one.
create function analytics_private.med_clean(p jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_brands text[];
  v_preset jsonb;
  v_presets jsonb := '[]'::jsonb;
  v_generic text := trim(coalesce(p ->> 'generic_name', ''));
  v_bpom text := nullif(upper(trim(coalesce(p ->> 'bpom', ''))), '');
  v_unit text := coalesce(p ->> 'strength_unit', '');
  v_value numeric;
  v_reviewer uuid := nullif(p ->> 'reviewer_id', '')::uuid;
  v_article uuid := nullif(p ->> 'article_id', '')::uuid;
begin
  if not coalesce(p ->> 'type', '') = any (array['oral', 'injection', 'supplement', 'topical']) then
    raise exception 'pick a medication type' using errcode = '22023';
  end if;
  if char_length(v_generic) not between 2 and 80 then
    raise exception 'enter the generic name' using errcode = '22023';
  end if;
  if not coalesce(p ->> 'category', '') = any (analytics_private.med_categories()) then
    raise exception 'pick a category' using errcode = '22023';
  end if;
  begin
    v_value := (p ->> 'strength_value')::numeric;
  exception when others then
    raise exception 'enter the strength' using errcode = '22023';
  end;
  if v_value is null or v_value <= 0 then
    raise exception 'enter the strength' using errcode = '22023';
  end if;
  if not v_unit = any (array['mg', 'mcg', 'g', 'IU', 'mIU', 'ml']) then
    raise exception 'pick a strength unit' using errcode = '22023';
  end if;
  if not coalesce(p ->> 'form', '') = any (array['tablet', 'capsule', 'sachet', 'injection', 'pen', 'suppository', 'gel', 'other']) then
    raise exception 'pick a form' using errcode = '22023';
  end if;
  if v_bpom is not null and v_bpom !~ '^[A-Z0-9]{8,20}$' then
    raise exception 'the BPOM registration number looks wrong (e.g. DKL1234567810A1)' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct trim(b)) filter (where trim(b) <> ''), '{}') into v_brands from jsonb_array_elements_text(coalesce(p -> 'brands', '[]'::jsonb)) b;
  if cardinality(v_brands) > 10 then
    raise exception 'at most 10 brand names' using errcode = '22023';
  end if;

  for v_preset in select * from jsonb_array_elements(coalesce(p -> 'presets', '[]'::jsonb)) loop
    if char_length(trim(coalesce(v_preset ->> 'dose', ''))) = 0 then
      raise exception 'every dosage preset needs a dose' using errcode = '22023';
    end if;
    v_presets := v_presets || jsonb_build_array(jsonb_build_object(
      'dose', left(trim(v_preset ->> 'dose'), 30), 'frequency', left(trim(coalesce(v_preset ->> 'frequency', '1× daily')), 30),
      'timing', left(trim(coalesce(v_preset ->> 'timing', 'Every day (no cycle link)')), 40), 'time', left(trim(coalesce(v_preset ->> 'time', '')), 40)));
  end loop;
  if jsonb_array_length(v_presets) > 8 then
    raise exception 'at most 8 dosage presets' using errcode = '22023';
  end if;

  if v_reviewer is not null and not exists (select 1 from public.admin_profiles where id = v_reviewer and role = 'medical_reviewer' and is_active) then
    raise exception 'the reviewer has to be an active medical reviewer' using errcode = '22023';
  end if;
  if v_article is not null and not exists (select 1 from public.content_items where id = v_article) then
    raise exception 'the linked article does not exist' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'generic_name', v_generic, 'type', p ->> 'type', 'category', p ->> 'category',
    'strength_value', v_value, 'strength_unit', v_unit, 'form', p ->> 'form',
    'brands', to_jsonb(v_brands), 'bpom', v_bpom,
    'rx', coalesce((p ->> 'rx')::boolean, false), 'require_doctor_note', coalesce((p ->> 'require_doctor_note')::boolean, false),
    'presets', v_presets,
    'reminder_template', left(trim(coalesce(p ->> 'reminder_template', '')), 160),
    'warnings', left(trim(coalesce(p ->> 'warnings', '')), 400),
    'show_quick_log', coalesce((p ->> 'show_quick_log')::boolean, true), 'show_program', coalesce((p ->> 'show_program')::boolean, false),
    'suggest_pcos', coalesce((p ->> 'suggest_pcos')::boolean, false), 'include_report', coalesce((p ->> 'include_report')::boolean, true),
    'reviewer_id', v_reviewer, 'article_id', v_article
  );
end;
$$;

-- Extra rules that only apply when the item is sent to review (a draft may be half done).
create function analytics_private.med_check_submit(p jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p ->> 'reviewer_id' is null then
    raise exception 'choose a medical reviewer' using errcode = '22023';
  end if;
  if char_length(coalesce(p ->> 'reminder_template', '')) < 5 then
    raise exception 'write the reminder template' using errcode = '22023';
  end if;
  if (p ->> 'rx')::boolean and p ->> 'bpom' is null then
    raise exception 'prescription items need a BPOM registration number' using errcode = '22023';
  end if;
  if jsonb_array_length(p -> 'presets') = 0 then
    raise exception 'add at least one dosage preset' using errcode = '22023';
  end if;
end;
$$;

create function analytics_private.med_display_name(p jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select (p ->> 'generic_name') || ' ' || trim(trailing '.' from trim(trailing '0' from (p ->> 'strength_value')::numeric::text)) || ' ' || (p ->> 'strength_unit')
$$;

create function analytics_private.med_row_json(m public.medications, p_full boolean default false)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', m.id, 'name', m.name, 'generic_name', m.generic_name, 'type', m.type, 'category', m.category,
    'strength_value', m.strength_value, 'strength_unit', m.strength_unit, 'form', m.form,
    'brands', to_jsonb(m.brands), 'rx', m.rx, 'status', m.status, 'has_revision', m.revision is not null,
    'users', (select count(distinct um.user_id) from public.user_medications um where um.medication_id = m.id),
    'adherence', (select round(avg(um.adherence_pct))::int from public.user_medications um where um.medication_id = m.id and um.adherence_pct is not null)
  ) || case when p_full then jsonb_build_object(
    'bpom', m.bpom, 'require_doctor_note', m.require_doctor_note, 'presets', m.presets, 'reminder_template', m.reminder_template,
    'warnings', m.warnings, 'show_quick_log', m.show_quick_log, 'show_program', m.show_program, 'suggest_pcos', m.suggest_pcos,
    'include_report', m.include_report, 'reviewer_id', m.reviewer_id,
    'reviewer_name', (select full_name from public.admin_profiles where id = m.reviewer_id), 'article_id', m.article_id,
    'article_title', (select title from public.content_items where id = m.article_id),
    'review_note', m.review_note, 'reviewed_by', m.reviewed_by, 'reviewed_at', m.reviewed_at, 'revision', m.revision,
    'revision_by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = m.revision_by),
    'created_by', (select analytics_private.short_name(full_name) from public.admin_profiles where id = m.created_by)
  ) else '{}'::jsonb end
$$;
