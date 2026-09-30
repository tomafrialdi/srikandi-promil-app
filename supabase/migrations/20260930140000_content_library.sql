-- Content › library: articles, daily tips, in-app cards and videos.

create type public.content_type as enum ('article', 'daily_tip', 'in_app_card', 'video');
create type public.content_status as enum ('draft', 'medical_review', 'changes_requested', 'scheduled', 'published', 'archived');

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  type public.content_type not null,
  title text not null,
  -- Articles: the URL path. Other types: a short descriptor ("follicular", "home below cycle").
  slug text,
  context text,
  category text not null,
  status public.content_status not null default 'draft',
  -- Null = no medical review required (in-app cards).
  reviewer_name text,
  languages text[] not null default array['en', 'id'],
  tags text[] not null default '{}',
  image_url text,
  views_30d integer not null default 0,
  ctr_pct numeric(4, 1),
  avg_read_seconds integer,
  scheduled_at timestamptz,
  published_at timestamptz,
  review_started_at timestamptz,
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_languages_check check (languages <@ array['en', 'id'] and cardinality(languages) > 0)
);

create unique index content_items_slug_idx on public.content_items (slug) where slug is not null;
create index content_items_status_idx on public.content_items (status, updated_at desc);
create index content_items_type_idx on public.content_items (type);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

alter table public.content_items enable row level security;
create policy "admins read content" on public.content_items for select to authenticated using ((select public.is_console_admin()));

create function analytics_private.content_status_group(p_status public.content_status)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_status when 'changes_requested' then 'medical_review' else p_status::text end
$$;

-- KPI cards + tab counts + filter options.
create function public.admin_content_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    select jsonb_build_object(
      'published', count(*) filter (where status = 'published'),
      'published_this_month', count(*) filter (where status = 'published' and published_at >= date_trunc('month', now())),
      'in_review', count(*) filter (where status in ('medical_review', 'changes_requested')),
      'past_sla', count(*) filter (where status = 'medical_review' and review_started_at < now() - interval '48 hours'),
      'scheduled', count(*) filter (where status = 'scheduled'),
      'next_scheduled_at', min(scheduled_at) filter (where status = 'scheduled' and scheduled_at > now()),
      'drafts', count(*) filter (where status = 'draft'),
      'stale_drafts', count(*) filter (where status = 'draft' and updated_at < now() - interval '30 days'),
      'reads_30d', coalesce(sum(views_30d) filter (where status = 'published'), 0),
      'avg_read_seconds', round(avg(avg_read_seconds) filter (where status = 'published' and avg_read_seconds is not null)),
      'counts', jsonb_build_object(
        'all', count(*),
        'draft', count(*) filter (where status = 'draft'),
        'medical_review', count(*) filter (where status in ('medical_review', 'changes_requested')),
        'scheduled', count(*) filter (where status = 'scheduled'),
        'published', count(*) filter (where status = 'published'),
        'archived', count(*) filter (where status = 'archived')),
      'categories', coalesce((select jsonb_agg(distinct category order by category) from public.content_items), '[]'::jsonb),
      'reviewers', coalesce((select jsonb_agg(distinct reviewer_name order by reviewer_name) from public.content_items where reviewer_name is not null), '[]'::jsonb)
    )
    from public.content_items
  );
end;
$$;

create function public.admin_content_list(
  p_tab text default 'all',
  p_search text default null,
  p_type public.content_type default null,
  p_category text default null,
  p_reviewer text default null,
  p_lang text default null,
  p_limit integer default 9,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  perform public.assert_console_admin();

  return (
    with filtered as (
      select c.*
      from public.content_items c
      where (p_tab = 'all' or analytics_private.content_status_group(c.status) = p_tab)
        and (p_type is null or c.type = p_type)
        and (p_category is null or c.category = p_category)
        and (p_reviewer is null or c.reviewer_name = p_reviewer)
        and (p_lang is null or p_lang = any (c.languages))
        and (v_search is null or c.title ilike '%' || v_search || '%' or c.slug ilike '%' || v_search || '%'
             or exists (select 1 from unnest(c.tags) t where t ilike '%' || v_search || '%'))
    )
    select jsonb_build_object(
      'total', (select count(*) from filtered),
      'rows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id, 'type', type, 'title', title,
          'sub', coalesce(slug, case type when 'daily_tip' then 'tip' when 'in_app_card' then 'card' else 'video' end || ' · ' || context),
          'category', category, 'status', status, 'reviewer', reviewer_name, 'languages', languages,
          'image_url', image_url, 'views_30d', views_30d, 'ctr_pct', ctr_pct, 'updated_at', updated_at
        ) order by updated_at desc, id)
        from (select * from filtered order by updated_at desc, id limit greatest(p_limit, 1) offset greatest(p_offset, 0)) page
      ), '[]'::jsonb)
    )
  );
end;
$$;

-- Bottom row: medical review queue (oldest first) + top performers.
create function public.admin_content_highlights()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'review_queue', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'reviewer', reviewer_name, 'status', status,
        'hours', floor(extract(epoch from (now() - review_started_at)) / 3600),
        'past_sla', status = 'medical_review' and review_started_at < now() - interval '48 hours'
      ) order by (status = 'changes_requested'), review_started_at)
      from (
        select * from public.content_items
        where status in ('medical_review', 'changes_requested') and review_started_at is not null
        order by review_started_at limit 3
      ) q
    ), '[]'::jsonb),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'type', type, 'title', title, 'views_30d', views_30d, 'ctr_pct', ctr_pct) order by views_30d desc, id)
      from (select * from public.content_items where status = 'published' order by views_30d desc, id limit 3) t
    ), '[]'::jsonb)
  );
end;
$$;

-- Bulk actions from the library: send to review · schedule · archive.
create function public.admin_content_bulk_action(p_ids uuid[], p_action text, p_at timestamptz default null)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'editor', 'content_editor']::public.admin_role[]);

  if p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 200 then
    raise exception 'select between 1 and 200 items' using errcode = '22023';
  end if;

  if p_action = 'send_to_review' then
    update public.content_items
       set status = 'medical_review', review_started_at = now()
     where id = any (p_ids) and status in ('draft', 'changes_requested') and reviewer_name is not null;
  elsif p_action = 'schedule' then
    if p_at is null or p_at <= now() then
      raise exception 'pick a publish time in the future' using errcode = '22023';
    end if;
    update public.content_items
       set status = 'scheduled', scheduled_at = p_at
     where id = any (p_ids) and status in ('draft', 'medical_review', 'scheduled');
  elsif p_action = 'archive' then
    update public.content_items set status = 'archived' where id = any (p_ids) and status <> 'archived';
  else
    raise exception 'unknown action' using errcode = '22023';
  end if;

  get diagnostics v_count = row_count;
  perform analytics_private.write_audit('content.' || p_action, 'content_items',
    jsonb_build_object('ids', p_ids, 'changed', v_count, 'at', p_at));
  return v_count;
end;
$$;
