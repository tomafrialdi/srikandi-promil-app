-- Fertility engine: editing the draft, medical sign-off and rollout.
-- Lifecycle: draft -> in_review -> canary (5 %, then 25 %) -> live (100 %). Rolled back / archived versions are kept.

-- ── validation helpers ───────────────────────────────────────────────────────

create function analytics_private.engine_check_groups(p_groups jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  g jsonb;
  c jsonb;
begin
  if jsonb_typeof(p_groups) is distinct from 'array' or jsonb_array_length(p_groups) > 6 then
    raise exception 'conditions must be a list of at most 6 groups' using errcode = '22023';
  end if;
  for g in select * from jsonb_array_elements(p_groups) loop
    if jsonb_typeof(g) is distinct from 'array' or jsonb_array_length(g) = 0 or jsonb_array_length(g) > 8 then
      raise exception 'every condition group needs 1–8 conditions' using errcode = '22023';
    end if;
    for c in select * from jsonb_array_elements(g) loop
      if not (c ->> 'field') = any (analytics_private.engine_fields()) then
        raise exception 'unknown signal "%"', c ->> 'field' using errcode = '22023';
      end if;
      if not (c ->> 'op') = any (array['=', '≠', '≥', '≤', '>', '<', 'between']) then
        raise exception 'unknown operator "%"', c ->> 'op' using errcode = '22023';
      end if;
      if char_length(coalesce(c ->> 'value', '')) not between 1 and 60 then
        raise exception 'every condition needs a value (max 60 characters)' using errcode = '22023';
      end if;
    end loop;
  end loop;
end;
$$;

create function analytics_private.engine_check_weights(p_weights jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  k text;
  v numeric;
  total numeric := 0;
  out jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(p_weights) is distinct from 'object' then
    raise exception 'weights must be an object' using errcode = '22023';
  end if;
  foreach k in array array['lh', 'cf', 'bbt', 'calendar', 'skin', 'protocol'] loop
    if jsonb_typeof(p_weights -> k) is distinct from 'number' then
      raise exception 'weight "%" is missing', k using errcode = '22023';
    end if;
    v := round((p_weights ->> k)::numeric, 2);
    if v < 0 or v > 1 then
      raise exception 'weights must be between 0 and 1' using errcode = '22023';
    end if;
    total := total + v;
    out := out || jsonb_build_object(k, v);
  end loop;
  if abs(total - 1) > 0.005 then
    raise exception 'signal weights must sum to 1.00 (now %)', total using errcode = '22023';
  end if;
  return out;
end;
$$;

-- Same rules for a whole config (used again on submit, so a half-edited draft can't go to review).
create function analytics_private.engine_check_config(p_config jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  m text;
  s jsonb;
begin
  foreach m in array analytics_private.engine_modes() loop
    perform analytics_private.engine_check_weights(p_config -> 'modes' -> m -> 'weights');
  end loop;
  if not exists (select 1 from jsonb_array_elements(p_config -> 'statuses') x where (x ->> 'default')::boolean) then
    raise exception 'the status list needs a default (last) status' using errcode = '22023';
  end if;
  for s in select * from jsonb_array_elements(p_config -> 'statuses') loop
    perform analytics_private.engine_check_groups(s -> 'entry');
    perform analytics_private.engine_check_groups(s -> 'exit');
  end loop;
end;
$$;

-- ── op handlers: each takes the config and returns the changed config ────────

create function analytics_private.engine_op_weights(p_cfg jsonb, p_op jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if not (p_op ->> 'mode') = any (analytics_private.engine_modes()) then
    raise exception 'unknown mode' using errcode = '22023';
  end if;
  return jsonb_set(p_cfg, array['modes', p_op ->> 'mode', 'weights'], analytics_private.engine_check_weights(p_op -> 'weights'));
end;
$$;

create function analytics_private.engine_op_params(p_cfg jsonb, p_op jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  m text := p_op ->> 'mode';
  u jsonb;
  cfg jsonb := p_cfg;
begin
  if not m = any (analytics_private.engine_modes()) then
    raise exception 'unknown mode' using errcode = '22023';
  end if;
  for u in select * from jsonb_array_elements(p_op -> 'params') loop
    if char_length(trim(coalesce(u ->> 'value', ''))) not between 1 and 80 then
      raise exception 'a parameter value needs 1–80 characters' using errcode = '22023';
    end if;
    cfg := jsonb_set(cfg, array['modes', m, 'params'], (
      select jsonb_agg(case when x ->> 'key' = u ->> 'key' then x || jsonb_build_object('value', trim(u ->> 'value')) else x end)
      from jsonb_array_elements(cfg -> 'modes' -> m -> 'params') x
    ));
  end loop;
  return cfg;
end;
$$;

create function analytics_private.engine_op_toggle(p_cfg jsonb, p_op jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  m text := p_op ->> 'mode';
  grp text := p_op ->> 'group';
begin
  if not m = any (analytics_private.engine_modes()) or not grp = any (array['notifications', 'features']) then
    raise exception 'unknown mode or group' using errcode = '22023';
  end if;
  if jsonb_typeof(p_op -> 'enabled') is distinct from 'boolean' then
    raise exception 'enabled must be true or false' using errcode = '22023';
  end if;
  return jsonb_set(p_cfg, array['modes', m, grp], (
    select jsonb_agg(case when x ->> 'key' = p_op ->> 'key' then x || jsonb_build_object('enabled', p_op -> 'enabled') else x end)
    from jsonb_array_elements(p_cfg -> 'modes' -> m -> grp) x
  ));
end;
$$;

create function analytics_private.engine_op_override(p_cfg jsonb, p_op jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  m text := p_op ->> 'mode';
  o jsonb := p_op -> 'override';
  list jsonb;
begin
  if not m = any (analytics_private.engine_modes()) or jsonb_typeof(o) is distinct from 'object' then
    raise exception 'invalid override' using errcode = '22023';
  end if;
  if not (o ->> 'kind') = any (array['same', 'rule', 'rename', 'hidden', 'extra']) then
    raise exception 'unknown override kind' using errcode = '22023';
  end if;
  if not (o ->> 'status') ~ '^[a-z][a-z0-9_]{1,40}$' then
    raise exception 'invalid status key' using errcode = '22023';
  end if;
  if char_length(coalesce(o ->> 'copy', '')) > 140 or char_length(coalesce(o ->> 'rule', '')) > 200 then
    raise exception 'copy or rule text is too long' using errcode = '22023';
  end if;
  if o ? 'entry' then
    perform analytics_private.engine_check_groups(o -> 'entry');
  end if;
  list := coalesce(p_cfg -> 'modes' -> m -> 'status_overrides', '[]'::jsonb);
  if exists (select 1 from jsonb_array_elements(list) x where x ->> 'status' = o ->> 'status') then
    list := (select jsonb_agg(case when x ->> 'status' = o ->> 'status' then o else x end) from jsonb_array_elements(list) x);
  else
    list := list || jsonb_build_array(o);
  end if;
  return jsonb_set(p_cfg, array['modes', m, 'status_overrides'], list);
end;
$$;

create function analytics_private.engine_op_status(p_cfg jsonb, p_op jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  s jsonb := p_op -> 'status';
  v_key text := s ->> 'key';
  is_default boolean;
  existing jsonb;
  list jsonb;
  pos integer := coalesce((s ->> 'order')::int, 1000);
begin
  if jsonb_typeof(s) is distinct from 'object' then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  if not v_key ~ '^[a-z][a-z0-9_]{2,40}$' then
    raise exception 'the rule key must be snake_case (3–41 characters)' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(s ->> 'name', ''))) not between 2 and 40 then
    raise exception 'the status name needs 2–40 characters' using errcode = '22023';
  end if;
  if not (s ->> 'color') = any (array['primary', 'pink', 'blue', 'green', 'amber', 'purple', 'gray', 'red']) then
    raise exception 'pick a colour' using errcode = '22023';
  end if;
  if char_length(coalesce(s ->> 'icon', '')) not between 2 and 30 then
    raise exception 'pick an icon' using errcode = '22023';
  end if;
  if not (s ->> 'category') = any (array['menstrual', 'follicular', 'fertile', 'luteal', 'pregnancy', 'other']) then
    raise exception 'pick a category' using errcode = '22023';
  end if;
  if jsonb_typeof(s -> 'modes') is distinct from 'array'
     or exists (select 1 from jsonb_array_elements_text(s -> 'modes') x where not x = any (analytics_private.engine_modes())) then
    raise exception 'invalid modes' using errcode = '22023';
  end if;
  if char_length(coalesce(s ->> 'description', '')) > 400 or char_length(coalesce(s ->> 'copy', '')) > 140 then
    raise exception 'description or copy is too long' using errcode = '22023';
  end if;

  select x into existing from jsonb_array_elements(p_cfg -> 'statuses') x where x ->> 'key' = v_key;
  is_default := coalesce((existing ->> 'default')::boolean, false);
  if not is_default then
    if jsonb_array_length(coalesce(s -> 'entry', '[]'::jsonb)) = 0 then
      raise exception 'add at least one entry condition' using errcode = '22023';
    end if;
    perform analytics_private.engine_check_groups(s -> 'entry');
    perform analytics_private.engine_check_groups(coalesce(s -> 'exit', '[]'::jsonb));
  end if;
  s := s || jsonb_build_object('default', is_default, 'counts_as', coalesce(existing -> 'counts_as', '[]'::jsonb));
  if existing ? 'counts_mode' then
    s := s || jsonb_build_object('counts_mode', existing -> 'counts_mode');
  end if;

  -- Insert or replace, then keep the default status last and renumber 1..n by the requested position.
  select coalesce(jsonb_agg(x order by (x ->> 'order')::int), '[]'::jsonb) into list
  from (
    select case when x ->> 'key' = v_key then s else x end as x
    from jsonb_array_elements(p_cfg -> 'statuses') x
    union all
    select s where existing is null
  ) u(x);
  select jsonb_agg(jsonb_set(t.x, '{order}', to_jsonb(t.rn)) order by t.rn) into list
  from (
    select x, row_number() over (order by (x ->> 'default')::boolean, case when x ->> 'key' = v_key then pos * 10 - 5 else (x ->> 'order')::int * 10 end, x ->> 'key') as rn
    from jsonb_array_elements(list) x
  ) t;
  return jsonb_set(p_cfg, '{statuses}', list);
end;
$$;

create function analytics_private.engine_op_delete_status(p_cfg jsonb, p_op jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_key text := p_op ->> 'key';
  cfg jsonb := p_cfg;
  m text;
begin
  if exists (select 1 from jsonb_array_elements(cfg -> 'statuses') x where x ->> 'key' = v_key and (x ->> 'default')::boolean) then
    raise exception 'the default status can''t be deleted' using errcode = '22023';
  end if;
  cfg := jsonb_set(cfg, '{statuses}', (
    select jsonb_agg(jsonb_set(t.x, '{order}', to_jsonb(t.rn)) order by t.rn)
    from (select x, row_number() over (order by (x ->> 'order')::int) as rn
          from jsonb_array_elements(cfg -> 'statuses') x where x ->> 'key' <> v_key) t
  ));
  foreach m in array analytics_private.engine_modes() loop
    cfg := jsonb_set(cfg, array['modes', m, 'status_overrides'], coalesce((
      select jsonb_agg(x) from jsonb_array_elements(cfg -> 'modes' -> m -> 'status_overrides') x where x ->> 'status' <> v_key
    ), '[]'::jsonb));
  end loop;
  return cfg;
end;
$$;

-- ── the draft ────────────────────────────────────────────────────────────────

-- Returns the editable version, creating a draft from the newest released one when there is none.
create function analytics_private.engine_draft_for_edit()
returns public.engine_versions
language plpgsql
volatile
set search_path = ''
as $$
declare
  w public.engine_versions;
  base public.engine_versions;
begin
  select * into w from public.engine_versions where status in ('draft', 'in_review');
  if found then
    if w.status = 'in_review' then
      raise exception '% is in review; withdraw it before editing', w.version using errcode = '22023';
    end if;
    return w;
  end if;
  select * into base from public.engine_versions where status in ('canary', 'live') order by case status when 'canary' then 1 else 2 end limit 1;
  insert into public.engine_versions (version, status, config, created_by)
  values (analytics_private.engine_next_version(), 'draft', base.config, (select auth.uid()))
  returning * into w;
  return w;
end;
$$;

create function public.admin_engine_draft_patch(p_ops jsonb, p_summary text default null, p_mode text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  w public.engine_versions;
  cfg jsonb;
  op jsonb;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_engine_edit();
  if jsonb_typeof(p_ops) is distinct from 'array' or jsonb_array_length(p_ops) = 0 or jsonb_array_length(p_ops) > 30 then
    raise exception 'nothing to change' using errcode = '22023';
  end if;

  w := analytics_private.engine_draft_for_edit();
  cfg := w.config;
  for op in select * from jsonb_array_elements(p_ops) loop
    cfg := case op ->> 'op'
      when 'set_weights' then analytics_private.engine_op_weights(cfg, op)
      when 'set_params' then analytics_private.engine_op_params(cfg, op)
      when 'set_toggle' then analytics_private.engine_op_toggle(cfg, op)
      when 'save_override' then analytics_private.engine_op_override(cfg, op)
      when 'save_status' then analytics_private.engine_op_status(cfg, op)
      when 'delete_status' then analytics_private.engine_op_delete_status(cfg, op)
      else null
    end;
    if cfg is null then
      raise exception 'unknown change "%"', op ->> 'op' using errcode = '22023';
    end if;
  end loop;

  update public.engine_versions set config = cfg, golden = null where id = w.id;
  insert into public.engine_events (version_id, mode, kind, tone, title, detail, actor_id)
  values (w.id, nullif(p_mode, ''), 'draft', 'info', coalesce(nullif(trim(p_summary), ''), 'Draft updated'),
          'Draft ' || w.version || ' · ' || (select analytics_private.short_name(full_name) from public.admin_profiles where id = (select auth.uid())),
          (select auth.uid()));
  perform analytics_private.write_audit('engine.draft', w.version, jsonb_build_object('summary', coalesce(nullif(trim(p_summary), ''), 'Edited engine draft ' || w.version)));
  return jsonb_build_object('id', w.id, 'version', w.version);
end;
$$;

create function public.admin_engine_discard_draft()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  w public.engine_versions;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_engine_edit();
  delete from public.engine_versions where status = 'draft' returning * into w;
  if not found then
    raise exception 'there is no draft to discard' using errcode = 'P0002';
  end if;
  perform analytics_private.write_audit('engine.discard', w.version, jsonb_build_object('summary', 'Discarded engine draft ' || w.version));
end;
$$;

-- ── review ───────────────────────────────────────────────────────────────────

create function public.admin_engine_submit(p_summary text, p_notes text, p_golden jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  w public.engine_versions;
  v_me uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  perform analytics_private.require_engine_edit();
  perform analytics_private.require_role(array['super_admin', 'engine_engineer']::public.admin_role[]);

  select * into w from public.engine_versions where status = 'draft';
  if not found then
    raise exception 'there is no draft to submit' using errcode = 'P0002';
  end if;
  if jsonb_typeof(p_golden) is distinct from 'object' or (p_golden ->> 'total') is null then
    raise exception 'run the golden test suite before submitting' using errcode = '22023';
  end if;
  if coalesce((p_golden ->> 'failed')::int, 1) > 0 then
    raise exception 'fix the failing golden tests before submitting' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_summary, ''))) < 3 then
    raise exception 'describe the change in a few words' using errcode = '22023';
  end if;
  perform analytics_private.engine_check_config(w.config);

  update public.engine_versions
     set status = 'in_review', submitted_at = now(), summary = trim(p_summary), notes = nullif(trim(coalesce(p_notes, '')), ''), golden = p_golden
   where id = w.id;
  insert into public.engine_approvals (version_id, reviewer_id)
  select w.id, r.admin_id from public.engine_reviewers r
  join public.admin_profiles p on p.id = r.admin_id and p.is_active
  where r.admin_id <> v_me;
  if not found then
    raise exception 'no medical reviewer is available to approve this version' using errcode = '22023';
  end if;
  insert into public.engine_events (version_id, kind, tone, title, detail, actor_id)
  values (w.id, 'submit', 'info', w.version || ' submitted for medical review · ' || trim(p_summary),
          'Needs approval from every medical reviewer', v_me);
  perform analytics_private.write_audit('engine.submit', w.version, jsonb_build_object('summary', 'Submitted engine ' || w.version || ' for medical review'));
end;
$$;

create function public.admin_engine_withdraw()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  w public.engine_versions;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_engine_edit();
  perform analytics_private.require_role(array['super_admin', 'engine_engineer']::public.admin_role[]);
  select * into w from public.engine_versions where status = 'in_review' for update;
  if not found then
    raise exception 'nothing is in review' using errcode = 'P0002';
  end if;
  delete from public.engine_approvals where version_id = w.id;
  update public.engine_versions set status = 'draft', submitted_at = null where id = w.id;
  insert into public.engine_events (version_id, kind, tone, title, actor_id)
  values (w.id, 'withdraw', 'warning', w.version || ' withdrawn from review', (select auth.uid()));
  perform analytics_private.write_audit('engine.withdraw', w.version, jsonb_build_object('summary', 'Withdrew engine ' || w.version || ' from review'));
end;
$$;

create function public.admin_engine_decide(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v public.engine_versions;
  v_me uuid := (select auth.uid());
  v_name text := (select analytics_private.short_name(full_name) from public.admin_profiles where id = v_me);
begin
  perform public.assert_console_admin();
  select * into v from public.engine_versions where id = p_id and status in ('in_review', 'canary') for update;
  if not found then
    raise exception 'that version is not waiting for approval' using errcode = 'P0002';
  end if;
  update public.engine_approvals
     set decision = case when p_approve then 'approved' else 'rejected' end::public.engine_decision, note = nullif(trim(coalesce(p_note, '')), ''), decided_at = now()
   where version_id = p_id and reviewer_id = v_me and decision = 'pending';
  if not found then
    raise exception 'you have no pending approval for %', v.version using errcode = '42501';
  end if;

  if p_approve then
    insert into public.engine_events (version_id, kind, tone, title, detail, actor_id)
    values (p_id, 'approve', 'success', v.version || ' approved', v_name, v_me);
    perform analytics_private.write_audit('engine.approve', v.version, jsonb_build_object('summary', 'Approved engine ' || v.version));
  else
    if v.status = 'in_review' then
      delete from public.engine_approvals where version_id = p_id;
      update public.engine_versions set status = 'draft', submitted_at = null where id = p_id;
    else
      update public.engine_versions set status = 'rolled_back', rollout_pct = 0, archived_at = now() where id = p_id;
    end if;
    insert into public.engine_events (version_id, kind, tone, title, detail, actor_id)
    values (p_id, 'reject', 'error', v.version || ' rejected by ' || v_name, nullif(trim(coalesce(p_note, '')), ''), v_me);
    perform analytics_private.write_audit('engine.reject', v.version, jsonb_build_object('summary', 'Rejected engine ' || v.version));
  end if;
end;
$$;

-- ── rollout ──────────────────────────────────────────────────────────────────

create function public.admin_engine_release(p_id uuid, p_action text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v public.engine_versions;
  v_approved integer;
  v_total integer;
  v_me uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'engine_engineer']::public.admin_role[]);
  select * into v from public.engine_versions where id = p_id for update;
  if not found then
    raise exception 'version not found' using errcode = 'P0002';
  end if;
  select count(*) filter (where decision = 'approved'), count(*) into v_approved, v_total from public.engine_approvals where version_id = p_id;

  if p_action = 'canary' then
    if v.status <> 'in_review' then
      raise exception '% is not in review', v.version using errcode = '22023';
    end if;
    if v_approved < 1 then
      raise exception 'at least one medical approval is needed to start a canary' using errcode = '22023';
    end if;
    if exists (select 1 from public.engine_versions where status = 'canary') then
      raise exception 'another canary is already running; roll it back or promote it first' using errcode = '22023';
    end if;
    update public.engine_versions set status = 'canary', rollout_pct = 5, canary_at = now() where id = p_id;
    insert into public.engine_events (version_id, kind, tone, title, detail, actor_id)
    values (p_id, 'canary', 'warning', v.version || ' canary · 5% of users', v.summary, v_me);

  elsif p_action = 'expand_25' then
    if v.status <> 'canary' or v.rollout_pct <> 5 then
      raise exception '% is not a 5 %% canary', v.version using errcode = '22023';
    end if;
    if v_approved < 1 then
      raise exception 'at least one medical approval is needed' using errcode = '22023';
    end if;
    update public.engine_versions set rollout_pct = 25 where id = p_id;
    insert into public.engine_events (version_id, kind, tone, title, actor_id)
    values (p_id, 'expand', 'warning', v.version || ' expanded to 25% of users', v_me);

  elsif p_action = 'expand_100' then
    if v.status <> 'canary' then
      raise exception '% is not a canary', v.version using errcode = '22023';
    end if;
    if v_approved < v_total or v_total = 0 then
      raise exception 'every medical reviewer has to approve before 100%%' using errcode = '22023';
    end if;
    update public.engine_versions set status = 'archived', archived_at = now(), rollout_pct = 0 where status = 'live';
    update public.engine_versions set status = 'live', rollout_pct = 100, live_at = now(),
      signed_off_by = (select string_agg(analytics_private.short_name(p.full_name), ' + ' order by r.sort_order)
                       from public.engine_approvals a join public.admin_profiles p on p.id = a.reviewer_id join public.engine_reviewers r on r.admin_id = a.reviewer_id
                       where a.version_id = p_id)
     where id = p_id;
    insert into public.engine_events (version_id, kind, tone, title, detail, actor_id)
    values (p_id, 'release', 'success', v.version || ' released · ' || coalesce(v.summary, ''), 'Live for 100% of users', v_me);

  elsif p_action = 'rollback' then
    if v.status <> 'canary' then
      raise exception '% is not a canary', v.version using errcode = '22023';
    end if;
    update public.engine_versions set status = 'rolled_back', rollout_pct = 0, archived_at = now() where id = p_id;
    insert into public.engine_events (version_id, kind, tone, title, actor_id)
    values (p_id, 'rollback', 'error', v.version || ' rolled back', v_me);

  else
    raise exception 'unknown release action' using errcode = '22023';
  end if;

  perform analytics_private.write_audit('engine.' || p_action, v.version, jsonb_build_object('summary', 'Engine ' || v.version || ': ' || replace(p_action, '_', ' ')));
end;
$$;
