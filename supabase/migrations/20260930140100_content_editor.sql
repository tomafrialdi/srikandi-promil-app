-- Content › editor: full field set, load/save RPCs, tip pool, audience estimate.

alter table public.content_items
  add column dek text,
  add column body text,
  add column cover_alt text,
  add column visibility text not null default 'app_web' check (visibility in ('app_web', 'app', 'web')),
  add column meta_description text check (char_length(meta_description) <= 160),
  add column target_phases text[] not null default '{}',
  add column target_modes text[] not null default '{}',
  add column target_plan text not null default 'all' check (target_plan in ('all', 'free', 'plus')),
  add column checklist jsonb not null default '{}',
  add column video_url text,
  add column duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  -- Type-specific fields.
  --   daily_tip:   icon, tap_action, deep_link, source_ref, cycle_days[], rotation, priority
  --   in_app_card: layout, variants[{title, body, cta_label, deep_link, weight}], screens[], frequency_cap, priority,
  --                run_from, run_to, dismissible, hide_after_conversion, discreet_mode
  --   video:       presenter, chapters[{at, label}], captions[], transcript, placement[], autoplay_muted
  add column details jsonb not null default '{}';

create function public.admin_content_options()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'categories', coalesce((select jsonb_agg(distinct category order by category) from public.content_items), '[]'::jsonb),
    'reviewers', coalesce((
      select jsonb_agg(distinct name order by name) from (
        select reviewer_name as name from public.content_items where reviewer_name is not null
        union
        select full_name from public.admin_profiles where role = 'medical_reviewer' and is_active
      ) r
    ), '[]'::jsonb),
    'tags', coalesce((select jsonb_agg(t order by t) from (select distinct unnest(tags) as t from public.content_items) x), '[]'::jsonb)
  );
end;
$$;

create function public.admin_content_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.content_items;
begin
  perform public.assert_console_admin();
  select * into c from public.content_items where id = p_id;
  if c.id is null then
    raise exception 'content not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'id', c.id, 'type', c.type, 'status', c.status, 'title', c.title, 'slug', c.slug, 'category', c.category,
    'tags', c.tags, 'languages', c.languages, 'visibility', c.visibility, 'scheduled_at', c.scheduled_at,
    'image_url', c.image_url, 'cover_alt', c.cover_alt, 'dek', c.dek, 'body', c.body, 'meta_description', c.meta_description,
    'target_phases', c.target_phases, 'target_modes', c.target_modes, 'target_plan', c.target_plan,
    'reviewer_name', c.reviewer_name, 'checklist', c.checklist, 'video_url', c.video_url,
    'duration_seconds', c.duration_seconds, 'details', c.details,
    'updated_at', c.updated_at,
    'updated_by', (select full_name from public.admin_profiles where id = c.created_by)
  );
end;
$$;

-- Create (p_id null) or update. Returns {id, status}. Status changes go through admin_content_bulk_action.
create function public.admin_content_save(p_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_title text := trim(coalesce(p_payload ->> 'title', ''));
  v_slug text := nullif(trim(coalesce(p_payload ->> 'slug', '')), '');
  v_type public.content_type;
  v_status public.content_status;
  v_tags text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_payload -> 'tags', '[]'::jsonb))), '{}');
  v_langs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_payload -> 'languages', '["en"]'::jsonb))), array['en']);
  v_phases text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_payload -> 'target_phases', '[]'::jsonb))), '{}');
  v_modes text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_payload -> 'target_modes', '[]'::jsonb))), '{}');
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'editor', 'content_editor']::public.admin_role[]);

  if v_title = '' then
    raise exception 'a title is required' using errcode = '22023';
  end if;
  if char_length(v_title) > 200 then
    raise exception 'the title is too long (max 200 characters)' using errcode = '22023';
  end if;
  if cardinality(v_tags) > 12 then
    raise exception 'use at most 12 tags' using errcode = '22023';
  end if;

  if v_id is null then
    v_type := (p_payload ->> 'type')::public.content_type;
  else
    select type, status into v_type, v_status from public.content_items where id = v_id for update;
    if v_type is null then
      raise exception 'content not found' using errcode = 'P0002';
    end if;
    if v_status = 'archived' then
      raise exception 'archived content cannot be edited' using errcode = '22023';
    end if;
  end if;

  if v_type = 'article' then
    if v_slug is null or v_slug !~ '^/[a-z0-9][a-z0-9/-]*$' then
      raise exception 'the URL slug must look like /blog/my-article' using errcode = '22023';
    end if;
  else
    v_slug := null;
  end if;

  begin
    if v_id is null then
      insert into public.content_items (
        type, title, slug, context, category, reviewer_name, languages, tags, image_url, cover_alt, dek, body,
        visibility, meta_description, target_phases, target_modes, target_plan, checklist, video_url, duration_seconds,
        scheduled_at, details, created_by
      ) values (
        v_type, v_title, v_slug, nullif(trim(p_payload ->> 'context'), ''), coalesce(nullif(trim(p_payload ->> 'category'), ''), 'General'),
        nullif(trim(p_payload ->> 'reviewer_name'), ''), v_langs, v_tags, nullif(p_payload ->> 'image_url', ''), p_payload ->> 'cover_alt',
        p_payload ->> 'dek', p_payload ->> 'body', coalesce(p_payload ->> 'visibility', 'app_web'), nullif(p_payload ->> 'meta_description', ''),
        v_phases, v_modes, coalesce(p_payload ->> 'target_plan', 'all'), coalesce(p_payload -> 'checklist', '{}'::jsonb),
        nullif(p_payload ->> 'video_url', ''), nullif(p_payload ->> 'duration_seconds', '')::integer,
        nullif(p_payload ->> 'scheduled_at', '')::timestamptz, coalesce(p_payload -> 'details', '{}'::jsonb), (select auth.uid())
      ) returning id, status into v_id, v_status;
    else
      update public.content_items set
        title = v_title, slug = v_slug, context = nullif(trim(p_payload ->> 'context'), ''),
        category = coalesce(nullif(trim(p_payload ->> 'category'), ''), 'General'),
        reviewer_name = nullif(trim(p_payload ->> 'reviewer_name'), ''), languages = v_langs, tags = v_tags,
        image_url = nullif(p_payload ->> 'image_url', ''), cover_alt = p_payload ->> 'cover_alt', dek = p_payload ->> 'dek', body = p_payload ->> 'body',
        visibility = coalesce(p_payload ->> 'visibility', 'app_web'), meta_description = nullif(p_payload ->> 'meta_description', ''),
        target_phases = v_phases, target_modes = v_modes, target_plan = coalesce(p_payload ->> 'target_plan', 'all'),
        checklist = coalesce(p_payload -> 'checklist', '{}'::jsonb), video_url = nullif(p_payload ->> 'video_url', ''),
        duration_seconds = nullif(p_payload ->> 'duration_seconds', '')::integer,
        scheduled_at = nullif(p_payload ->> 'scheduled_at', '')::timestamptz, details = coalesce(p_payload -> 'details', '{}'::jsonb)
      where id = v_id;
    end if;
  exception
    when unique_violation then
      raise exception 'that URL slug is already used by another article' using errcode = '23505';
    when check_violation then
      raise exception 'a field is out of range (meta description max 160 characters, visibility, plan or languages)' using errcode = '22023';
  end;

  perform analytics_private.write_audit(case when p_id is null then 'content.create' else 'content.update' end, 'content_items',
    jsonb_build_object('id', v_id, 'type', v_type));
  return jsonb_build_object('id', v_id, 'status', (select status from public.content_items where id = v_id));
end;
$$;

-- Other tips in the same category (the "tip pool" panel).
create function public.admin_content_tip_pool(p_category text, p_exclude uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'status', status, 'views_30d', views_30d) order by views_30d desc, title)
    from (
      select * from public.content_items
      where type = 'daily_tip' and category = p_category and (p_exclude is null or id <> p_exclude) and status <> 'archived'
      order by views_30d desc, title limit 6
    ) t
  ), '[]'::jsonb);
end;
$$;

-- Rough audience size for the targeting card (tracking mode + plan; phases are not stored per user).
create function public.admin_content_audience(p_modes text[], p_plan text)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    select count(*)::integer from public.app_users u
    where (coalesce(cardinality(p_modes), 0) = 0 or u.tracking_mode::text = any (p_modes)
           or ('iui' = any (p_modes) and u.tracking_mode in ('iui', 'ivf')))
      and (p_plan = 'all' or (p_plan = 'free' and u.plan in ('free', 'trial')) or (p_plan = 'plus' and u.plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored')))
  );
end;
$$;
