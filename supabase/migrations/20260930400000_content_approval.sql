-- Content approval. A Super admin or Medical reviewer approves content (it goes live, or is
-- scheduled when the editor chose a future publish time) or asks for changes. Every decision is
-- kept in content_reviews and the audit log. A Super admin can also publish a draft straight away
-- when no medical reviewer is available: that needs a written reason and is flagged as "skipped review".

alter table public.content_items
  add column approved_by uuid references public.admin_profiles (id) on delete set null,
  add column approved_at timestamptz;

create table public.content_reviews (
  id bigint generated always as identity primary key,
  content_id uuid not null references public.content_items (id) on delete cascade,
  reviewer_id uuid references public.admin_profiles (id) on delete set null,
  reviewer_name text not null,
  decision text not null check (decision in ('approved', 'changes_requested')),
  skipped_review boolean not null default false,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index content_reviews_content_idx on public.content_reviews (content_id, created_at desc);

alter table public.content_reviews enable row level security;
create policy "admins read content reviews"
  on public.content_reviews for select
  to authenticated
  using ((select public.is_console_admin()));

create function public.admin_content_review(p_ids uuid[], p_decision text, p_note text default null)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_name text;
  v_role public.admin_role;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  c public.content_items;
  v_changed integer := 0;
  v_skipped integer := 0;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'medical_reviewer']::public.admin_role[]);

  if p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 50 then
    raise exception 'select between 1 and 50 items' using errcode = '22023';
  end if;
  if p_decision not in ('approve', 'request_changes') then
    raise exception 'unknown decision' using errcode = '22023';
  end if;

  select full_name, role into v_name, v_role from public.admin_profiles where id = v_actor;

  if p_decision = 'approve' then
    for c in
      select * from public.content_items
      where id = any (p_ids)
        and (status = 'medical_review' or (status = 'draft' and v_role = 'super_admin'))
      for update
    loop
      -- Publishing a draft without a medical review needs a written reason.
      if c.status = 'draft' and char_length(coalesce(v_note, '')) < 3 then
        raise exception 'enter a reason to publish without a medical review' using errcode = '22023';
      end if;

      update public.content_items set
        status = case when scheduled_at > now() then 'scheduled'::public.content_status else 'published'::public.content_status end,
        published_at = case when scheduled_at > now() then published_at else now() end,
        approved_by = v_actor,
        approved_at = now(),
        reviewer_name = coalesce(reviewer_name, v_name)
      where id = c.id;

      insert into public.content_reviews (content_id, reviewer_id, reviewer_name, decision, skipped_review, note)
      values (c.id, v_actor, v_name, 'approved', c.status = 'draft', v_note);

      v_changed := v_changed + 1;
      if c.status = 'draft' then v_skipped := v_skipped + 1; end if;
    end loop;
  else
    if char_length(coalesce(v_note, '')) < 3 then
      raise exception 'tell the author what to change (at least 3 characters)' using errcode = '22023';
    end if;
    for c in
      select * from public.content_items where id = any (p_ids) and status = 'medical_review' for update
    loop
      update public.content_items set status = 'changes_requested' where id = c.id;
      insert into public.content_reviews (content_id, reviewer_id, reviewer_name, decision, note)
      values (c.id, v_actor, v_name, 'changes_requested', v_note);
      v_changed := v_changed + 1;
    end loop;
  end if;

  perform analytics_private.write_audit('content.' || p_decision, 'content_items',
    jsonb_build_object('ids', p_ids, 'changed', v_changed, 'skipped_review', v_skipped, 'note', v_note));
  return v_changed;
end;
$$;

revoke execute on function public.admin_content_review(uuid[], text, text) from public, anon;
grant execute on function public.admin_content_review(uuid[], text, text) to authenticated;

-- The reviewer picker now also offers Super admins, and the editor loads the review history.
create or replace function public.admin_content_options()
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
        select full_name from public.admin_profiles where role in ('medical_reviewer', 'super_admin') and is_active
      ) r
    ), '[]'::jsonb),
    'tags', coalesce((select jsonb_agg(t order by t) from (select distinct unnest(tags) as t from public.content_items) x), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_content_get(p_id uuid)
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
    'updated_by', (select full_name from public.admin_profiles where id = c.created_by),
    'approved_at', c.approved_at,
    'approved_by', (select full_name from public.admin_profiles where id = c.approved_by),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'decision', r.decision, 'by', r.reviewer_name, 'note', r.note, 'at', r.created_at,
        'skipped_review', r.skipped_review) order by r.created_at desc)
      from (select * from public.content_reviews where content_id = c.id order by created_at desc limit 5) r
    ), '[]'::jsonb)
  );
end;
$$;
