-- Scheduling and publishing now follow approval.
--   approve          medical_review -> approved (or scheduled, when the editor already set a publish time)
--   approve_publish  ... and straight to published
--   schedule / publish_now   only for approved items (in-app cards excepted: they skip medical review)
--   republish        archived -> published (was approved before) or back to draft (never approved)
-- Content that was already live or scheduled before this change counts as approved, so nothing gets stuck.

update public.content_items
   set approved_at = coalesce(published_at, scheduled_at, updated_at)
 where approved_at is null
   and (status in ('published', 'scheduled') or (status = 'archived' and published_at is not null));

create or replace function public.admin_content_summary()
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
        'approved', count(*) filter (where status = 'approved'),
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

create or replace function public.admin_content_bulk_action(p_ids uuid[], p_action text, p_at timestamptz default null)
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

  -- Going live is a separate step from approval: only approved items can be scheduled or published.
  -- In-app cards are promotional and skip medical review, so they can be scheduled from a draft.
  elsif p_action = 'schedule' then
    if p_at is null or p_at <= now() then
      raise exception 'pick a publish time in the future' using errcode = '22023';
    end if;
    update public.content_items
       set status = 'scheduled', scheduled_at = p_at
     where id = any (p_ids)
       and ((status in ('approved', 'scheduled') and approved_at is not null)
            or (type = 'in_app_card' and status in ('draft', 'scheduled')));

  elsif p_action = 'publish_now' then
    update public.content_items
       set status = 'published', published_at = now(), scheduled_at = null
     where id = any (p_ids)
       and ((status = 'approved' and approved_at is not null)
            or (type = 'in_app_card' and status in ('draft', 'scheduled')));

  -- Archived content comes back live if it was approved before; otherwise it returns to draft
  -- and goes through review again.
  elsif p_action = 'republish' then
    update public.content_items
       set status = case when approved_at is not null or type = 'in_app_card'
                         then 'published'::public.content_status else 'draft'::public.content_status end,
           published_at = case when approved_at is not null or type = 'in_app_card'
                               then coalesce(published_at, now()) else published_at end,
           scheduled_at = null
     where id = any (p_ids) and status = 'archived';

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

create or replace function public.admin_content_review(p_ids uuid[], p_decision text, p_note text default null)
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
  if p_decision not in ('approve', 'approve_publish', 'request_changes') then
    raise exception 'unknown decision' using errcode = '22023';
  end if;

  select full_name, role into v_name, v_role from public.admin_profiles where id = v_actor;

  if p_decision in ('approve', 'approve_publish') then
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

      -- "Approve" signs it off (a publish time the editor already chose is honoured); "Approve & publish"
      -- also takes it live right away.
      update public.content_items set
        status = case
          when scheduled_at > now() then 'scheduled'::public.content_status
          when p_decision = 'approve_publish' then 'published'::public.content_status
          else 'approved'::public.content_status end,
        published_at = case when scheduled_at > now() or p_decision <> 'approve_publish' then published_at else now() end,
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
