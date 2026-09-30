-- Notifications › editor: load/save, reach estimate and status actions.

create function public.admin_notification_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.notification_campaigns;
begin
  perform public.assert_console_admin();
  select * into c from public.notification_campaigns where id = p_id;
  if c.id is null then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'id', c.id, 'name', c.name, 'channel', c.channel, 'kind', c.kind, 'status', c.status,
    'audience_rules', c.audience_rules, 'audience_label', c.audience_label, 'language', c.language,
    'title', c.title, 'body', c.body, 'discreet_body', c.discreet_body, 'deep_link', c.deep_link, 'category', c.category,
    'trigger_event', c.trigger_event, 'send_time', c.send_time, 'send_at', c.send_at,
    'quiet_hours', c.quiet_hours, 'max_one_per_day', c.max_one_per_day, 'ab_test', c.ab_test,
    'requires_approval', c.requires_approval, 'updated_at', c.updated_at,
    'updated_by', (select full_name from public.admin_profiles where id = c.created_by)
  );
end;
$$;

create function public.admin_notification_save(p_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_name text := trim(coalesce(p_payload ->> 'name', ''));
  v_status public.notification_status;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'editor', 'content_editor']::public.admin_role[]);

  if v_name = '' then
    raise exception 'a campaign name is required' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_payload -> 'audience_rules', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_payload -> 'audience_rules', '[]'::jsonb)) > 10 then
    raise exception 'audience rules must be a list of at most 10 conditions' using errcode = '22023';
  end if;

  if v_id is not null then
    select status into v_status from public.notification_campaigns where id = v_id for update;
    if v_status is null then
      raise exception 'campaign not found' using errcode = 'P0002';
    end if;
    if v_status in ('sending', 'sent') then
      raise exception 'a campaign that has been sent cannot be edited' using errcode = '22023';
    end if;
  end if;

  begin
    if v_id is null then
      insert into public.notification_campaigns (
        name, channel, kind, audience_rules, audience_label, language, title, body, discreet_body, deep_link, category,
        trigger_event, send_time, send_at, quiet_hours, max_one_per_day, ab_test, created_by
      ) values (
        v_name, (p_payload ->> 'channel')::public.notification_channel, (p_payload ->> 'kind')::public.notification_kind,
        coalesce(p_payload -> 'audience_rules', '[]'::jsonb), coalesce(nullif(p_payload ->> 'audience_label', ''), 'Everyone'),
        coalesce(p_payload ->> 'language', 'en'), coalesce(p_payload ->> 'title', ''), coalesce(p_payload ->> 'body', ''),
        coalesce(p_payload ->> 'discreet_body', ''), coalesce(p_payload ->> 'deep_link', ''), coalesce(p_payload ->> 'category', ''),
        nullif(p_payload ->> 'trigger_event', ''), nullif(p_payload ->> 'send_time', ''), nullif(p_payload ->> 'send_at', '')::timestamptz,
        coalesce((p_payload ->> 'quiet_hours')::boolean, true), coalesce((p_payload ->> 'max_one_per_day')::boolean, true),
        coalesce((p_payload ->> 'ab_test')::boolean, false), (select auth.uid())
      ) returning id into v_id;
    else
      update public.notification_campaigns set
        name = v_name, channel = (p_payload ->> 'channel')::public.notification_channel, kind = (p_payload ->> 'kind')::public.notification_kind,
        audience_rules = coalesce(p_payload -> 'audience_rules', '[]'::jsonb), audience_label = coalesce(nullif(p_payload ->> 'audience_label', ''), 'Everyone'),
        language = coalesce(p_payload ->> 'language', 'en'), title = coalesce(p_payload ->> 'title', ''), body = coalesce(p_payload ->> 'body', ''),
        discreet_body = coalesce(p_payload ->> 'discreet_body', ''), deep_link = coalesce(p_payload ->> 'deep_link', ''),
        category = coalesce(p_payload ->> 'category', ''), trigger_event = nullif(p_payload ->> 'trigger_event', ''),
        send_time = nullif(p_payload ->> 'send_time', ''), send_at = nullif(p_payload ->> 'send_at', '')::timestamptz,
        quiet_hours = coalesce((p_payload ->> 'quiet_hours')::boolean, true), max_one_per_day = coalesce((p_payload ->> 'max_one_per_day')::boolean, true),
        ab_test = coalesce((p_payload ->> 'ab_test')::boolean, false)
      where id = v_id;
    end if;
  exception
    when check_violation or invalid_text_representation then
      raise exception 'a field has an invalid value (channel, type or language)' using errcode = '22023';
  end;

  perform analytics_private.write_audit(case when p_id is null then 'notification.create' else 'notification.update' end, 'notification_campaigns',
    jsonb_build_object('id', v_id));
  return jsonb_build_object('id', v_id, 'status', (select status from public.notification_campaigns where id = v_id));
end;
$$;

-- Users matching the tracking-mode / plan / last-active rules (cycle phase is not stored per user).
create function public.admin_notification_reach(p_rules jsonb)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_modes text[];
  v_plan text;
  v_days integer;
begin
  perform public.assert_console_admin();
  select coalesce(array(select jsonb_array_elements_text(r -> 'value')), '{}') into v_modes
    from jsonb_array_elements(coalesce(p_rules, '[]'::jsonb)) r where r ->> 'field' = 'tracking_mode' limit 1;
  select r ->> 'value' into v_plan from jsonb_array_elements(coalesce(p_rules, '[]'::jsonb)) r where r ->> 'field' = 'plan' limit 1;
  select nullif(r ->> 'value', '')::integer into v_days from jsonb_array_elements(coalesce(p_rules, '[]'::jsonb)) r where r ->> 'field' = 'last_active' limit 1;

  return (
    select count(*)::integer from public.app_users u
    where (coalesce(cardinality(v_modes), 0) = 0 or u.tracking_mode::text = any (v_modes) or ('iui' = any (v_modes) and u.tracking_mode in ('iui', 'ivf')))
      and (v_plan is null or v_plan = 'all'
           or (v_plan = 'free' and u.plan in ('free', 'trial'))
           or (v_plan = 'plus' and u.plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored')))
      and (v_days is null or u.last_active_at >= now() - make_interval(days => v_days))
      and u.tracking_mode <> 'after_loss'
  );
end;
$$;

-- pause · resume · schedule (queue it for the sender) · resend (failed -> queued again)
create function public.admin_notification_action(p_id uuid, p_action text)
returns public.notification_status
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.notification_campaigns;
  v_next public.notification_status;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'editor', 'content_editor']::public.admin_role[]);
  select * into c from public.notification_campaigns where id = p_id for update;
  if c.id is null then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  if p_action = 'pause' and c.status = 'active' then
    v_next := 'paused';
  elsif p_action = 'resume' and c.status = 'paused' then
    v_next := 'active';
  elsif p_action in ('schedule', 'resend') and c.status in ('draft', 'failed', 'scheduled') then
    if btrim(c.title) = '' or btrim(c.body) = '' then
      raise exception 'add a title and a body before scheduling' using errcode = '22023';
    end if;
    if c.channel = 'push' and btrim(c.discreet_body) = '' then
      raise exception 'the discreet variant is required for push notifications' using errcode = '22023';
    end if;
    if c.kind = 'trigger' then
      if coalesce(btrim(c.trigger_event), '') = '' then
        raise exception 'choose the event that triggers this campaign' using errcode = '22023';
      end if;
      v_next := 'active';
    elsif c.kind = 'scheduled' then
      if c.send_at is null or c.send_at <= now() then
        raise exception 'pick a send time in the future' using errcode = '22023';
      end if;
      v_next := 'scheduled';
    else
      update public.notification_campaigns set send_at = now() where id = c.id;
      v_next := 'scheduled';
    end if;
  else
    raise exception 'that action is not available for a % campaign', c.status using errcode = '22023';
  end if;

  update public.notification_campaigns set status = v_next where id = c.id;
  perform analytics_private.write_audit('notification.' || p_action, 'notification_campaigns', jsonb_build_object('id', c.id, 'status', v_next));
  return v_next;
end;
$$;
