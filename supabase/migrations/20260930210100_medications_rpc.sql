-- Medications: summary, list, one item, options, save (draft / review), reviewer decision, delete.

create function public.admin_medications_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_users integer := (select count(distinct user_id) from public.user_medications);
  v_total integer := (select count(*) from public.app_users);
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_view();
  return jsonb_build_object(
    'catalogue', (select count(*) from public.medications),
    'categories', (select count(distinct category) from public.medications),
    'rx', (select count(*) from public.medications where rx),
    'users', v_users,
    'users_pct', case when v_total > 0 then round(100.0 * v_users / v_total) end,
    'adherence', (select round(avg(adherence_pct))::int from public.user_medications where adherence_pct is not null),
    'counts', jsonb_build_object(
      'all', (select count(*) from public.medications),
      'supplements', (select count(*) from public.medications where type = 'supplement'),
      'ovulation', (select count(*) from public.medications where category = 'Ovulation induction'),
      'trigger_luteal', (select count(*) from public.medications where category in ('Trigger shot', 'Luteal support')),
      'drafts', (select count(*) from public.medications where status = 'draft')
    ),
    'can_edit', analytics_private.console_role() in ('super_admin', 'admin', 'medical_reviewer'),
    'me', (select auth.uid())
  );
end;
$$;

create function public.admin_medications_list(
  p_tab text default 'all', p_search text default null, p_type text default null, p_rx text default null,
  p_limit integer default 10, p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_rows jsonb;
  v_total integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_view();

  with f as (
    select m.* from public.medications m
    where (p_tab = 'all'
        or (p_tab = 'supplements' and m.type = 'supplement')
        or (p_tab = 'ovulation' and m.category = 'Ovulation induction')
        or (p_tab = 'trigger_luteal' and m.category in ('Trigger shot', 'Luteal support'))
        or (p_tab = 'drafts' and m.status = 'draft'))
      and (nullif(p_type, '') is null or m.type = p_type)
      and (nullif(p_rx, '') is null or m.rx = (p_rx = 'rx'))
      and (v_search is null or m.name ilike '%' || v_search || '%' or m.generic_name ilike '%' || v_search || '%'
           or exists (select 1 from unnest(m.brands) b where b ilike '%' || v_search || '%'))
  ), page as (
    select * from f order by name limit least(greatest(coalesce(p_limit, 10), 1), 500) offset greatest(coalesce(p_offset, 0), 0)
  )
  select (select count(*) from f), coalesce((select jsonb_agg(analytics_private.med_row_json(g) order by g.name) from page g), '[]'::jsonb)
  into v_total, v_rows;

  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

create function public.admin_medications_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  m public.medications;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_view();
  select * into m from public.medications where id = p_id;
  if not found then
    raise exception 'medication not found' using errcode = 'P0002';
  end if;
  return analytics_private.med_row_json(m, true);
end;
$$;

create function public.admin_medications_options()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_view();
  return jsonb_build_object(
    'categories', to_jsonb(analytics_private.med_categories()),
    'reviewers', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', full_name, 'job_title', job_title) order by full_name), '[]'::jsonb)
                  from public.admin_profiles where role = 'medical_reviewer' and is_active),
    'articles', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title) order by title), '[]'::jsonb)
                 from (select id, title from public.content_items where type = 'article' and status = 'published' order by title limit 200) a)
  );
end;
$$;

-- Create / edit. Drafts are edited in place; a published item keeps serving the app until its revision is approved.
create function public.admin_medications_save(p_id uuid, p_payload jsonb, p_submit boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_clean jsonb;
  m public.medications;
  v_id uuid;
  v_name text;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_edit();
  v_clean := analytics_private.med_clean(p_payload);
  v_name := analytics_private.med_display_name(v_clean);
  if p_submit then
    perform analytics_private.med_check_submit(v_clean);
  end if;

  if p_id is null then
    if exists (select 1 from public.medications where lower(name) = lower(v_name)) then
      raise exception '% is already in the catalogue', v_name using errcode = '23505';
    end if;
    insert into public.medications (
      name, generic_name, type, category, strength_value, strength_unit, form, brands, bpom, rx, require_doctor_note, presets,
      reminder_template, warnings, show_quick_log, show_program, suggest_pcos, include_report, reviewer_id, article_id, status, created_by
    ) values (
      v_name, v_clean ->> 'generic_name', v_clean ->> 'type', v_clean ->> 'category', (v_clean ->> 'strength_value')::numeric, v_clean ->> 'strength_unit',
      v_clean ->> 'form', array(select jsonb_array_elements_text(v_clean -> 'brands')), v_clean ->> 'bpom', (v_clean ->> 'rx')::boolean,
      (v_clean ->> 'require_doctor_note')::boolean, v_clean -> 'presets', v_clean ->> 'reminder_template', v_clean ->> 'warnings',
      (v_clean ->> 'show_quick_log')::boolean, (v_clean ->> 'show_program')::boolean, (v_clean ->> 'suggest_pcos')::boolean,
      (v_clean ->> 'include_report')::boolean, nullif(v_clean ->> 'reviewer_id', '')::uuid, nullif(v_clean ->> 'article_id', '')::uuid,
      case when p_submit then 'in_review' else 'draft' end, v_me
    ) returning id into v_id;
    perform analytics_private.write_audit(case when p_submit then 'medication.submit' else 'medication.create' end, v_id::text,
      jsonb_build_object('summary', (case when p_submit then 'Submitted medication ' else 'Drafted medication ' end) || v_name));
    return v_id;
  end if;

  select * into m from public.medications where id = p_id for update;
  if not found then
    raise exception 'medication not found' using errcode = 'P0002';
  end if;
  if m.status = 'in_review' or m.revision is not null then
    raise exception '% is waiting for its medical reviewer', m.name using errcode = '22023';
  end if;
  if exists (select 1 from public.medications where lower(name) = lower(v_name) and id <> p_id) then
    raise exception '% is already in the catalogue', v_name using errcode = '23505';
  end if;

  if m.status = 'published' then
    -- Live values stay as they are until the reviewer approves the revision.
    perform analytics_private.med_check_submit(v_clean);
    update public.medications set revision = v_clean, revision_by = v_me, review_note = null where id = p_id;
    perform analytics_private.write_audit('medication.revise', p_id::text, jsonb_build_object('summary', 'Sent changes to ' || m.name || ' for review'));
    return p_id;
  end if;

  update public.medications set
    name = v_name, generic_name = v_clean ->> 'generic_name', type = v_clean ->> 'type', category = v_clean ->> 'category',
    strength_value = (v_clean ->> 'strength_value')::numeric, strength_unit = v_clean ->> 'strength_unit', form = v_clean ->> 'form',
    brands = array(select jsonb_array_elements_text(v_clean -> 'brands')), bpom = v_clean ->> 'bpom', rx = (v_clean ->> 'rx')::boolean,
    require_doctor_note = (v_clean ->> 'require_doctor_note')::boolean, presets = v_clean -> 'presets',
    reminder_template = v_clean ->> 'reminder_template', warnings = v_clean ->> 'warnings',
    show_quick_log = (v_clean ->> 'show_quick_log')::boolean, show_program = (v_clean ->> 'show_program')::boolean,
    suggest_pcos = (v_clean ->> 'suggest_pcos')::boolean, include_report = (v_clean ->> 'include_report')::boolean,
    reviewer_id = nullif(v_clean ->> 'reviewer_id', '')::uuid, article_id = nullif(v_clean ->> 'article_id', '')::uuid,
    status = case when p_submit then 'in_review' else 'draft' end, review_note = null
  where id = p_id;
  perform analytics_private.write_audit(case when p_submit then 'medication.submit' else 'medication.update' end, p_id::text,
    jsonb_build_object('summary', (case when p_submit then 'Submitted medication ' else 'Updated draft ' end) || v_name));
  return p_id;
end;
$$;

-- The assigned medical reviewer approves (publishes / applies the revision) or sends it back.
create function public.admin_medications_review(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  m public.medications;
  c jsonb;
  v_name text := (select full_name from public.admin_profiles where id = (select auth.uid()));
begin
  perform public.assert_console_admin();
  select * into m from public.medications where id = p_id for update;
  if not found then
    raise exception 'medication not found' using errcode = 'P0002';
  end if;
  if not (m.status = 'in_review' or m.revision is not null) then
    raise exception '% is not waiting for review', m.name using errcode = '22023';
  end if;
  if m.reviewer_id is distinct from v_me then
    raise exception 'only the assigned medical reviewer can decide this' using errcode = '42501';
  end if;
  if not p_approve and char_length(trim(coalesce(p_note, ''))) < 3 then
    raise exception 'tell the author what to change' using errcode = '22023';
  end if;

  if p_approve then
    c := coalesce(m.revision, jsonb_build_object(
      'generic_name', m.generic_name, 'type', m.type, 'category', m.category, 'strength_value', m.strength_value, 'strength_unit', m.strength_unit,
      'form', m.form, 'brands', to_jsonb(m.brands), 'bpom', m.bpom, 'rx', m.rx, 'require_doctor_note', m.require_doctor_note, 'presets', m.presets,
      'reminder_template', m.reminder_template, 'warnings', m.warnings, 'show_quick_log', m.show_quick_log, 'show_program', m.show_program,
      'suggest_pcos', m.suggest_pcos, 'include_report', m.include_report, 'reviewer_id', m.reviewer_id, 'article_id', m.article_id));
    update public.medications set
      name = analytics_private.med_display_name(c), generic_name = c ->> 'generic_name', type = c ->> 'type', category = c ->> 'category',
      strength_value = (c ->> 'strength_value')::numeric, strength_unit = c ->> 'strength_unit', form = c ->> 'form',
      brands = array(select jsonb_array_elements_text(c -> 'brands')), bpom = c ->> 'bpom', rx = (c ->> 'rx')::boolean,
      require_doctor_note = (c ->> 'require_doctor_note')::boolean, presets = c -> 'presets', reminder_template = c ->> 'reminder_template',
      warnings = c ->> 'warnings', show_quick_log = (c ->> 'show_quick_log')::boolean, show_program = (c ->> 'show_program')::boolean,
      suggest_pcos = (c ->> 'suggest_pcos')::boolean, include_report = (c ->> 'include_report')::boolean,
      reviewer_id = nullif(c ->> 'reviewer_id', '')::uuid, article_id = nullif(c ->> 'article_id', '')::uuid,
      status = 'published', revision = null, revision_by = null, review_note = null, reviewed_by = v_name, reviewed_at = now()
    where id = p_id;
    perform analytics_private.write_audit('medication.approve', p_id::text, jsonb_build_object('summary', 'Approved medication ' || m.name));
  else
    update public.medications set
      status = case when m.status = 'in_review' then 'draft' else m.status end, revision = null, revision_by = null, review_note = trim(p_note)
    where id = p_id;
    perform analytics_private.write_audit('medication.reject', p_id::text, jsonb_build_object('summary', 'Sent ' || m.name || ' back for changes', 'note', trim(p_note)));
  end if;
end;
$$;

create function public.admin_medications_delete(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  m public.medications;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_edit();
  select * into m from public.medications where id = p_id for update;
  if not found then
    raise exception 'medication not found' using errcode = 'P0002';
  end if;
  if m.status <> 'draft' then
    raise exception 'only drafts can be deleted' using errcode = '22023';
  end if;
  delete from public.medications where id = p_id;
  perform analytics_private.write_audit('medication.delete', p_id::text, jsonb_build_object('summary', 'Deleted draft ' || m.name));
end;
$$;

-- Discard a revision that is not in review anymore (author changed their mind).
create function public.admin_medications_withdraw(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  m public.medications;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_meds_edit();
  select * into m from public.medications where id = p_id for update;
  if not found or not (m.status = 'in_review' or m.revision is not null) then
    raise exception 'nothing to withdraw' using errcode = 'P0002';
  end if;
  update public.medications set status = case when status = 'in_review' then 'draft' else status end, revision = null, revision_by = null where id = p_id;
  perform analytics_private.write_audit('medication.withdraw', p_id::text, jsonb_build_object('summary', 'Withdrew ' || m.name || ' from review'));
end;
$$;
