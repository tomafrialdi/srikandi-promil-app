-- Community moderation RPCs.

create function public.admin_community_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  perform public.assert_console_admin();
  return (
    with p as (
      select p.*, (select count(*) from public.community_reports r where r.post_id = p.id) as reports from public.community_posts p
    ),
    resolved as (
      select * from public.community_posts where resolved_at >= now() - interval '7 days' and flagged_at is not null
    ),
    ai_resolved as (
      select * from resolved where ai_score is not null and mod_status in ('approved', 'hidden', 'removed', 'escalated')
    )
    select jsonb_build_object(
      'posts_today', (select count(*) from public.community_posts where (created_at at time zone 'Asia/Jakarta')::date = v_today),
      'posts_delta_pct', analytics_private.pct(
        (select count(*) from public.community_posts where (created_at at time zone 'Asia/Jakarta')::date = v_today)
        - (select count(*) from public.community_posts where (created_at at time zone 'Asia/Jakarta')::date = v_today - 1),
        (select count(*) from public.community_posts where (created_at at time zone 'Asia/Jakarta')::date = v_today - 1), 0),
      'open_reports', (select count(*) from p where mod_status = 'open' and reports > 0),
      'urgent', (select count(*) from p where mod_status = 'open' and reports > 0 and reason = 'self_harm'),
      'ai_flagged', (select count(*) from p where mod_status = 'open' and reports = 0),
      'ai_precision_pct', (select analytics_private.pct(count(*) filter (where mod_status in ('hidden', 'removed', 'escalated')), count(*), 0) from ai_resolved),
      'median_review_min', (select round((percentile_cont(0.5) within group (order by extract(epoch from (resolved_at - flagged_at))) / 60)::numeric) from resolved),
      'counts', jsonb_build_object(
        'reported', (select count(*) from p where mod_status = 'open' and reports > 0),
        'ai_flagged', (select count(*) from p where mod_status = 'open' and reports = 0),
        'appeals', (select count(*) from p where mod_status = 'appealed'))
    )
  );
end;
$$;

create function public.admin_community_queue(p_tab text default 'reported')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'reason', reason, 'excerpt', left(body, 90), 'author', author_handle, 'group', group_name,
      'flagged_at', flagged_at, 'reports', reports, 'ai_score', ai_score, 'pii', reason = 'personal_info'
    ) order by (reason = 'self_harm') desc, flagged_at desc, id)
    from (
      select p.*, g.name as group_name, (select count(*) from public.community_reports r where r.post_id = p.id) as reports
      from public.community_posts p join public.community_groups g on g.id = p.group_id
      where p.mod_status in ('open', 'appealed')
    ) q
    where (p_tab = 'appeals' and q.mod_status = 'appealed')
       or (p_tab = 'reported' and q.mod_status = 'open' and q.reports > 0)
       or (p_tab = 'ai_flagged' and q.mod_status = 'open' and q.reports = 0)
  ), '[]'::jsonb);
end;
$$;

create function public.admin_community_post(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p public.community_posts;
  v_group text;
  v_reports integer;
begin
  perform public.assert_console_admin();
  select * into p from public.community_posts where id = p_id;
  if p.id is null then
    raise exception 'post not found' using errcode = 'P0002';
  end if;
  select name into v_group from public.community_groups where id = p.group_id;
  select count(*) into v_reports from public.community_reports where post_id = p.id;
  -- Reading a flagged post's context is a privileged view: keep a trail.
  perform analytics_private.write_audit('community.view_post', p_id::text);

  return jsonb_build_object(
    'id', p.id, 'reason', p.reason, 'mod_status', p.mod_status, 'author', p.author_handle, 'group', v_group,
    'body', p.body, 'created_at', p.created_at, 'reports', v_reports, 'ai_score', p.ai_score,
    'account_months', p.author_account_months, 'mode', p.author_mode, 'prior_reports', p.author_prior_reports,
    'last_checkin', p.author_last_checkin, 'resolution', p.resolution,
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object('note', n.note, 'at', n.created_at, 'by', coalesce(a.full_name, 'moderator')) order by n.created_at desc)
      from public.community_mod_notes n left join public.admin_profiles a on a.id = n.author_id where n.post_id = p.id
    ), '[]'::jsonb)
  );
end;
$$;

-- approve · hide · hide_support (hide + private support message) · escalate · remove
create function public.admin_community_resolve(p_id uuid, p_action text, p_note text default null)
returns public.community_mod_status
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p public.community_posts;
  v_next public.community_mod_status;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'moderator', 'support_agent', 'support']::public.admin_role[]);
  select * into p from public.community_posts where id = p_id for update;
  if p.id is null then
    raise exception 'post not found' using errcode = 'P0002';
  end if;
  if p.mod_status not in ('open', 'appealed') then
    raise exception 'this post was already handled' using errcode = '22023';
  end if;

  v_next := case p_action
    when 'approve' then 'approved'
    when 'hide' then 'hidden'
    when 'hide_support' then 'hidden'
    when 'escalate' then 'escalated'
    when 'remove' then 'removed'
  end;
  if v_next is null then
    raise exception 'unknown action' using errcode = '22023';
  end if;
  if p_action = 'hide_support' and p.reason is distinct from 'self_harm' then
    raise exception 'the support message is only for self-harm risk posts' using errcode = '22023';
  end if;

  update public.community_posts
     set mod_status = v_next, resolved_at = now(), resolved_by = (select auth.uid()), resolution = p_action
   where id = p.id;
  if nullif(trim(coalesce(p_note, '')), '') is not null then
    insert into public.community_mod_notes (post_id, author_id, note) values (p.id, (select auth.uid()), trim(p_note));
  end if;
  perform analytics_private.write_audit('community.' || p_action, p_id::text, jsonb_build_object('reason', p.reason));
  return v_next;
end;
$$;

create function public.admin_community_add_note(p_id uuid, p_note text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  if length(trim(coalesce(p_note, ''))) < 1 then
    raise exception 'write a note first' using errcode = '22023';
  end if;
  if not exists (select 1 from public.community_posts where id = p_id) then
    raise exception 'post not found' using errcode = 'P0002';
  end if;
  insert into public.community_mod_notes (post_id, author_id, note) values (p_id, (select auth.uid()), trim(p_note));
end;
$$;

create function public.admin_community_groups()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'public', (select count(*) from public.community_groups where visibility = 'public'),
    'private', (select count(*) from public.community_groups where visibility = 'private'),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'visibility', visibility, 'members', member_count, 'posts_per_day', posts_day, 'reports_7d', reports_7d,
        'moderators', moderators, 'status', case when protected then 'protected' when reports_7d >= 20 then 'busy' else 'healthy' end
      ) order by member_count desc)
      from (
        select g.*,
          (select round(count(*) / 7.0) from public.community_posts p where p.group_id = g.id and p.created_at >= now() - interval '7 days') as posts_day,
          (select count(*) from public.community_reports r join public.community_posts p on p.id = r.post_id
            where p.group_id = g.id and r.created_at >= now() - interval '7 days') as reports_7d
        from public.community_groups g
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create function public.admin_community_group_create(p_payload jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := trim(coalesce(p_payload ->> 'name', ''));
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'moderator']::public.admin_role[]);
  if v_name = '' then
    raise exception 'a group name is required' using errcode = '22023';
  end if;
  begin
    insert into public.community_groups (name, description, visibility, hosted_by, protected, moderators, created_by)
    values (
      v_name, coalesce(p_payload ->> 'description', ''), coalesce(p_payload ->> 'visibility', 'public'),
      nullif(trim(p_payload ->> 'hosted_by'), ''), coalesce((p_payload ->> 'protected')::boolean, false),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_payload -> 'moderators', '[]'::jsonb))), '{}'), (select auth.uid())
    ) returning id into v_id;
  exception
    when unique_violation then
      raise exception 'a group with this name already exists' using errcode = '23505';
    when check_violation then
      raise exception 'the group name must be 2–60 characters and visibility public or private' using errcode = '22023';
  end;
  perform analytics_private.write_audit('community.group_create', v_id::text, jsonb_build_object('name', v_name));
  return v_id;
end;
$$;

create function public.admin_community_keyword_rules()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'keyword', keyword, 'action', action, 'reason', reason) order by keyword) from public.community_keyword_rules), '[]'::jsonb);
end;
$$;

create function public.admin_community_keyword_rule_save(p_keyword text, p_action text, p_reason public.community_reason)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'moderator']::public.admin_role[]);
  begin
    insert into public.community_keyword_rules (keyword, action, reason) values (lower(trim(p_keyword)), p_action, p_reason);
  exception
    when unique_violation then
      raise exception 'that keyword already has a rule' using errcode = '23505';
    when check_violation then
      raise exception 'keyword must be 2–60 characters and the action flag or hide' using errcode = '22023';
  end;
  perform analytics_private.write_audit('community.keyword_add', lower(trim(p_keyword)), jsonb_build_object('action', p_action));
end;
$$;

create function public.admin_community_keyword_rule_delete(p_id bigint)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'moderator']::public.admin_role[]);
  delete from public.community_keyword_rules where id = p_id;
  perform analytics_private.write_audit('community.keyword_delete', p_id::text);
end;
$$;

create function public.admin_community_guidelines()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'text', coalesce((select value from public.community_settings where key = 'guidelines'), ''),
    'updated_at', (select updated_at from public.community_settings where key = 'guidelines')
  );
end;
$$;

create function public.admin_community_guidelines_save(p_text text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  if length(trim(coalesce(p_text, ''))) < 20 then
    raise exception 'the guidelines are too short' using errcode = '22023';
  end if;
  insert into public.community_settings (key, value) values ('guidelines', trim(p_text))
  on conflict (key) do update set value = excluded.value, updated_at = now();
  perform analytics_private.write_audit('community.guidelines_update', 'guidelines');
end;
$$;
