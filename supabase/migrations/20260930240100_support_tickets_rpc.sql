-- Support tickets: summary, inbox, one ticket, reply, assign, status, escalation, new ticket, macros, plus two app-facing RPCs.

create function analytics_private.support_ticket_row(t public.support_tickets)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', t.id, 'number', t.number, 'subject', t.subject, 'priority', t.priority, 'status', t.status, 'channel', t.channel, 'category', t.category,
    'requester_name', t.requester_name, 'assigned_to', t.assigned_to,
    'assigned_name', (select analytics_private.short_name(full_name) from public.admin_profiles where id = t.assigned_to),
    'escalated_to', t.escalated_to, 'last_message_at', t.last_message_at, 'created_at', t.created_at, 'tags', to_jsonb(t.tags)
  )
$$;

create function public.admin_support_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_view();
  return jsonb_build_object(
    'open', (select count(*) from public.support_tickets where status <> 'resolved'),
    'unassigned', (select count(*) from public.support_tickets where status <> 'resolved' and assigned_to is null),
    'breaching', (select count(*) from public.support_tickets where status <> 'resolved' and created_at < now() - interval '24 hours'),
    'first_response_seconds', (select round(percentile_cont(0.5) within group (order by extract(epoch from first_response_at - created_at)))
                               from public.support_tickets where first_response_at is not null and created_at >= now() - interval '30 days'),
    'first_response_target_seconds', 14400,
    'csat_avg', (select round(avg(csat), 1) from public.support_tickets where csat is not null),
    'csat_count', (select count(*) from public.support_tickets where csat is not null),
    'counts', jsonb_build_object(
      'mine', (select count(*) from public.support_tickets where status <> 'resolved' and assigned_to = v_me),
      'unassigned', (select count(*) from public.support_tickets where status <> 'resolved' and assigned_to is null),
      'all', (select count(*) from public.support_tickets where status <> 'resolved')),
    'can_act', analytics_private.console_role() in ('super_admin', 'admin', 'support_agent'),
    'me', v_me,
    'role', analytics_private.console_role()
  );
end;
$$;

create function public.admin_support_list(
  p_tab text default 'all', p_search text default null, p_status text default 'open', p_limit integer default 30, p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_rows jsonb;
  v_total integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_view();
  with f as (
    select t.* from public.support_tickets t
    where (p_status = 'any' or (p_status = 'open' and t.status <> 'resolved') or (p_status = 'resolved' and t.status = 'resolved'))
      and (p_tab = 'all' or (p_tab = 'mine' and t.assigned_to = v_me) or (p_tab = 'unassigned' and t.assigned_to is null))
      and (v_search is null or t.subject ilike '%' || v_search || '%' or t.requester_name ilike '%' || v_search || '%' or ('TCK-' || t.number) ilike '%' || v_search || '%'
           or t.number::text = regexp_replace(v_search, '\D', '', 'g'))
  ), page as (
    select * from f order by last_message_at desc, number desc limit least(greatest(coalesce(p_limit, 30), 1), 100) offset greatest(coalesce(p_offset, 0), 0)
  )
  select (select count(*) from f), coalesce((select jsonb_agg(analytics_private.support_ticket_row(g) order by g.last_message_at desc, g.number desc) from page g), '[]'::jsonb)
  into v_total, v_rows;
  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

create function public.admin_support_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  t public.support_tickets;
  u public.app_users;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_view();
  select * into t from public.support_tickets where id = p_id;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  select * into u from public.app_users where id = t.user_id;
  return analytics_private.support_ticket_row(t) || jsonb_build_object(
    'requester', jsonb_build_object('user_id', t.user_id, 'name', t.requester_name, 'email', coalesce(t.requester_email, u.email),
      'platform', coalesce(t.context ->> 'platform', u.platform::text), 'app_version', coalesce(t.context ->> 'app_version', u.app_version),
      'plan', coalesce(t.context ->> 'plan', u.plan::text)),
    'first_response_at', t.first_response_at, 'resolved_at', t.resolved_at, 'csat', t.csat, 'csat_comment', t.csat_comment,
    'can_act', (analytics_private.console_role() in ('super_admin', 'admin', 'support_agent') or (analytics_private.console_role() = 'engine_engineer' and t.escalated_to = 'engine')),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'author', m.author_label, 'body', m.body, 'attachments', m.attachments, 'at', m.created_at, 'mine', m.author_id = (select auth.uid()))
                       order by m.created_at, m.id)
      from public.support_messages m where m.ticket_id = p_id), '[]'::jsonb)
  );
end;
$$;

create function public.admin_support_reply(p_id uuid, p_body text, p_kind text default 'agent', p_resolve boolean default false)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.support_tickets;
  v_body text := trim(coalesce(p_body, ''));
  v_me uuid := (select auth.uid());
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_act(p_id);
  if p_kind not in ('agent', 'note') then
    raise exception 'unknown message type' using errcode = '22023';
  end if;
  if char_length(v_body) not between 1 and 4000 then
    raise exception 'write a message (up to 4000 characters)' using errcode = '22023';
  end if;
  select * into t from public.support_tickets where id = p_id for update;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  insert into public.support_messages (ticket_id, kind, author_id, author_label, body) values (p_id, p_kind, v_me, analytics_private.support_author_label(v_me), v_body);

  if p_kind = 'agent' then
    update public.support_tickets set
      first_response_at = coalesce(first_response_at, now()), last_message_at = now(),
      assigned_to = coalesce(assigned_to, v_me),
      status = case when p_resolve then 'resolved' else 'pending' end,
      resolved_at = case when p_resolve then now() else null end
    where id = p_id;
    if p_resolve then
      perform analytics_private.support_add_event(p_id, 'Marked as resolved');
    end if;
    perform analytics_private.write_audit(case when p_resolve then 'support.resolve' else 'support.reply' end, 'TCK-' || t.number,
      jsonb_build_object('summary', (case when p_resolve then 'Replied and resolved ' else 'Replied to ' end) || 'TCK-' || t.number));
  else
    update public.support_tickets set last_message_at = last_message_at where id = p_id;
  end if;
end;
$$;

create function public.admin_support_assign(p_id uuid, p_admin uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.support_tickets;
  v_name text;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_act(p_id);
  select * into t from public.support_tickets where id = p_id for update;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  if p_admin is not null then
    select analytics_private.short_name(full_name) into v_name from public.admin_profiles
     where id = p_admin and is_active and role in ('support_agent', 'admin', 'super_admin', 'engine_engineer');
    if v_name is null then
      raise exception 'that person can not be assigned tickets' using errcode = '22023';
    end if;
  end if;
  update public.support_tickets set assigned_to = p_admin where id = p_id;
  perform analytics_private.support_add_event(p_id, case when p_admin is null then 'Unassigned' when p_admin = (select auth.uid()) then 'Assigned to themselves' else 'Assigned to ' || v_name end);
  perform analytics_private.write_audit('support.assign', 'TCK-' || t.number, jsonb_build_object('summary', 'Assigned TCK-' || t.number || ' to ' || coalesce(v_name, 'nobody')));
end;
$$;

create function public.admin_support_update(p_id uuid, p_patch jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.support_tickets;
  v_tags text[];
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_act(p_id);
  select * into t from public.support_tickets where id = p_id for update;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  if p_patch ? 'priority' then
    if not p_patch ->> 'priority' in ('high', 'medium', 'low') then
      raise exception 'unknown priority' using errcode = '22023';
    end if;
    update public.support_tickets set priority = p_patch ->> 'priority' where id = p_id;
    perform analytics_private.support_add_event(p_id, 'Priority set to ' || (p_patch ->> 'priority'));
  end if;
  if p_patch ? 'tags' then
    select coalesce(array_agg(distinct lower(regexp_replace(trim(both '#' from trim(x)), '[^a-zA-Z0-9-]+', '-', 'g'))) filter (where trim(both '#' from trim(x)) <> ''), '{}')
      into v_tags from jsonb_array_elements_text(p_patch -> 'tags') x;
    if cardinality(v_tags) > 8 then
      raise exception 'at most 8 tags' using errcode = '22023';
    end if;
    update public.support_tickets set tags = v_tags where id = p_id;
  end if;
  if p_patch ? 'category' then
    if not p_patch ->> 'category' in ('bug', 'billing', 'privacy', 'partner', 'integrations', 'account', 'medical', 'other') then
      raise exception 'unknown category' using errcode = '22023';
    end if;
    update public.support_tickets set category = p_patch ->> 'category' where id = p_id;
  end if;
end;
$$;

create function public.admin_support_set_status(p_id uuid, p_status text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.support_tickets;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_act(p_id);
  if p_status not in ('open', 'pending', 'resolved') then
    raise exception 'unknown status' using errcode = '22023';
  end if;
  select * into t from public.support_tickets where id = p_id for update;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  update public.support_tickets set status = p_status, resolved_at = case when p_status = 'resolved' then now() else null end, last_message_at = now() where id = p_id;
  perform analytics_private.support_add_event(p_id, case p_status when 'resolved' then 'Marked as resolved' when 'open' then 'Reopened' else 'Set to waiting for customer' end);
  perform analytics_private.write_audit('support.status', 'TCK-' || t.number, jsonb_build_object('summary', 'TCK-' || t.number || ' → ' || p_status));
end;
$$;

create function public.admin_support_escalate(p_id uuid, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.support_tickets;
  v_reason text := analytics_private.require_reason(p_reason);
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  select * into t from public.support_tickets where id = p_id for update;
  if not found then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;
  if t.escalated_to is not null then
    raise exception 'this ticket is already with the engine team' using errcode = '22023';
  end if;
  update public.support_tickets set escalated_to = 'engine', status = 'pending', tags = (select array(select distinct unnest(tags || array['escalated']))), last_message_at = now() where id = p_id;
  perform analytics_private.support_add_event(p_id, 'Escalated to engine team · ' || v_reason);
  perform analytics_private.write_audit('support.escalate', 'TCK-' || t.number, jsonb_build_object('summary', 'Escalated TCK-' || t.number || ' to the engine team', 'reason', v_reason));
end;
$$;

create function public.admin_support_agents()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_view();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'role', c.label) order by p.full_name)
    from public.admin_profiles p join public.admin_role_catalog c on c.role = p.role
    where p.is_active and p.role in ('support_agent', 'admin', 'super_admin', 'engine_engineer')
  ), '[]'::jsonb);
end;
$$;

create function public.admin_support_search_users(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_query, '')), '');
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  if v_q is null or char_length(v_q) < 2 then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'name', full_name, 'email', email, 'plan', plan, 'platform', platform) order by full_name)
    from (select * from public.app_users where full_name ilike '%' || v_q || '%' or email ilike '%' || v_q || '%' order by full_name limit 8) u
  ), '[]'::jsonb);
end;
$$;

create function public.admin_support_create(p_payload jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p jsonb := p_payload;
  v_user uuid := nullif(p ->> 'user_id', '')::uuid;
  u public.app_users;
  v_name text;
  v_id uuid;
  v_me uuid := (select auth.uid());
  v_body text := trim(coalesce(p ->> 'body', ''));
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  if v_user is not null then
    select * into u from public.app_users where id = v_user;
    if not found then
      raise exception 'that user does not exist' using errcode = '22023';
    end if;
  end if;
  v_name := coalesce(u.full_name, nullif(trim(coalesce(p ->> 'requester_name', '')), ''));
  if v_name is null then
    raise exception 'pick a user or enter the requester name' using errcode = '22023';
  end if;
  if char_length(v_body) < 2 then
    raise exception 'write the customer''s message' using errcode = '22023';
  end if;
  begin
    insert into public.support_tickets (user_id, requester_name, requester_email, channel, category, subject, priority, assigned_to, tags, context, created_by)
    values (v_user, v_name, coalesce(u.email, nullif(trim(coalesce(p ->> 'requester_email', '')), '')), coalesce(p ->> 'channel', 'web'), coalesce(p ->> 'category', 'other'),
            trim(coalesce(p ->> 'subject', '')), coalesce(p ->> 'priority', 'medium'), case when coalesce((p ->> 'assign_me')::boolean, true) then v_me end, '{}',
            case when u.id is null then '{}'::jsonb else jsonb_build_object('platform', u.platform, 'app_version', u.app_version, 'plan', u.plan) end, v_me)
    returning id into v_id;
  exception when check_violation then
    raise exception 'check the subject (3–140 characters), channel, category and priority' using errcode = '22023';
  end;
  insert into public.support_messages (ticket_id, kind, author_label, body) values (v_id, 'customer', v_name, left(v_body, 4000));
  perform analytics_private.support_add_event(v_id, 'Ticket created by ' || coalesce((select analytics_private.short_name(full_name) from public.admin_profiles where id = v_me), 'support'));
  perform analytics_private.write_audit('support.create', v_id::text, jsonb_build_object('summary', 'Created a support ticket for ' || v_name));
  return v_id;
end;
$$;

-- ── macros ───────────────────────────────────────────────────────────────────

create function public.admin_support_macros()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_support_view();
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'shortcut', shortcut, 'body', body, 'uses', uses) order by shortcut) from public.support_macros), '[]'::jsonb);
end;
$$;

create function public.admin_support_macro_save(p_id uuid, p_title text, p_shortcut text, p_body text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_short text := lower(trim(coalesce(p_shortcut, '')));
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  if left(v_short, 1) <> '/' then
    v_short := '/' || v_short;
  end if;
  begin
    if v_id is null then
      insert into public.support_macros (title, shortcut, body, created_by) values (trim(p_title), v_short, trim(p_body), (select auth.uid())) returning id into v_id;
    else
      update public.support_macros set title = trim(p_title), shortcut = v_short, body = trim(p_body), updated_at = now() where id = v_id;
      if not found then
        raise exception 'macro not found' using errcode = 'P0002';
      end if;
    end if;
  exception
    when unique_violation then
      raise exception 'the shortcut % is already used', v_short using errcode = '23505';
    when check_violation then
      raise exception 'check the macro: title 2–60 characters, shortcut like /refund, text 2–2000 characters' using errcode = '22023';
  end;
  return v_id;
end;
$$;

create function public.admin_support_macro_delete(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  delete from public.support_macros where id = p_id;
end;
$$;

create function public.admin_support_macro_used(p_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.support_macros set uses = uses + 1 where id = p_id and analytics_private.console_role() in ('super_admin', 'admin', 'support_agent')
$$;

-- ── app-facing (apps/mobile): a signed-in app user opens a ticket and rates the answer ─────────

create function public.support_open_ticket(p_subject text, p_body text, p_category text default 'other')
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  u public.app_users;
  v_id uuid;
  v_number bigint;
begin
  select * into u from public.app_users where auth_user_id = (select auth.uid());
  if not found then
    raise exception 'only app users can open tickets' using errcode = '42501';
  end if;
  if (select count(*) from public.support_tickets where user_id = u.id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too many tickets; please wait a little' using errcode = '22023';
  end if;
  insert into public.support_tickets (user_id, requester_name, requester_email, channel, category, subject, context)
  values (u.id, u.full_name, u.email, 'app', case when p_category in ('bug', 'billing', 'privacy', 'partner', 'integrations', 'account', 'medical') then p_category else 'other' end,
          left(trim(coalesce(p_subject, '')), 140), jsonb_build_object('platform', u.platform, 'app_version', u.app_version, 'plan', u.plan))
  returning id, number into v_id, v_number;
  insert into public.support_messages (ticket_id, kind, author_label, body) values (v_id, 'customer', u.full_name, left(trim(coalesce(p_body, '')), 4000));
  return v_number;
exception when check_violation then
  raise exception 'write a subject (3–140 characters) and a message' using errcode = '22023';
end;
$$;

create function public.support_rate_ticket(p_number bigint, p_score integer, p_comment text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_score not between 1 and 5 then
    raise exception 'the rating is 1 to 5' using errcode = '22023';
  end if;
  update public.support_tickets t set csat = p_score, csat_comment = nullif(left(trim(coalesce(p_comment, '')), 300), '')
   where t.number = p_number and t.status = 'resolved' and t.csat is null
     and t.user_id = (select id from public.app_users where auth_user_id = (select auth.uid()));
  if not found then
    raise exception 'this ticket can not be rated' using errcode = 'P0002';
  end if;
end;
$$;
