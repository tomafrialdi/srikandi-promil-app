-- Notifications from the app's side: the inbox, read state, push tokens, reminder preferences,
-- the device time zone; and the dispatcher's health for the console.

-- The app now also reports its time zone (campaigns go out at the user's local time).
drop function public.app_report_device(text, text, text);
create function public.app_report_device(p_platform text, p_app_version text, p_device_model text, p_timezone text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version text := nullif(trim(coalesce(p_app_version, '')), '');
  v_model text := nullif(trim(coalesce(p_device_model, '')), '');
  v_tz text := nullif(trim(coalesce(p_timezone, '')), '');
begin
  if p_platform is null or p_platform not in ('ios', 'android')
     or char_length(coalesce(v_version, '')) > 20
     or char_length(coalesce(v_model, '')) > 60
  then
    raise exception 'invalid device info' using errcode = '22023';
  end if;
  update public.app_users set
    platform = p_platform::public.platform_type,
    app_version = coalesce(v_version, app_version),
    device_model = v_model,
    -- Only a real IANA name is kept; anything else leaves the current value.
    timezone = case when v_tz is not null and exists (select 1 from pg_timezone_names where name = v_tz) then v_tz else timezone end
  where id = analytics_private.current_app_user();
end;
$$;

create function public.app_notifications_get(p_limit integer default 60)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  u public.app_users;
begin
  select * into u from public.app_users where id = v_user;
  return jsonb_build_object(
    'discreetMode', u.discreet_mode,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'type', n.type, 'category', n.category,
        'title', case when u.discreet_mode then n.discreet_title else n.title end,
        'body', case when u.discreet_mode then n.discreet_body else n.body end,
        'created_at', n.created_at, 'read_at', n.read_at,
        'cta', case when n.deep_link <> '' then jsonb_build_object('label', n.cta_label, 'route', n.deep_link) end
      ) order by n.created_at desc)
      from (select * from public.user_notifications
            where user_id = v_user and created_at <= now()
            order by created_at desc limit least(greatest(coalesce(p_limit, 60), 1), 200)) n
    ), '[]'::jsonb)
  );
end;
$$;

create function public.app_notifications_unread_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.user_notifications
  where user_id = analytics_private.current_app_user() and read_at is null and created_at <= now();
$$;

-- Marks one notification read. The first read of a campaign message counts as an "open" for the console.
create function analytics_private.notification_mark_read(p_user uuid, p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n public.user_notifications;
  v_tz text;
  v_local timestamp;
begin
  update public.user_notifications set read_at = now()
  where id = p_id and user_id = p_user and read_at is null
  returning * into n;
  if n.id is null then return; end if;

  if n.campaign_id is not null then
    update public.notification_campaigns set opened_count = opened_count + 1 where id = n.campaign_id;
  end if;
  update public.push_deliveries set opened_at = now()
  where id = (select id from public.push_deliveries
              where user_id = p_user and title = n.title and opened_at is null order by sent_at desc limit 1);

  select timezone into v_tz from public.app_users where id = p_user;
  v_local := now() at time zone coalesce(v_tz, 'Asia/Jakarta');
  insert into public.notification_hourly_opens (day, hour, opens)
  values (v_local::date, extract(hour from v_local)::smallint, 1)
  on conflict (day, hour) do update set opens = public.notification_hourly_opens.opens + 1;
end;
$$;

create function public.app_notification_read(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform analytics_private.notification_mark_read(analytics_private.current_app_user(), p_id);
end;
$$;

create function public.app_notifications_read_all()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_id uuid;
begin
  for v_id in select id from public.user_notifications where user_id = v_user and read_at is null and created_at <= now() loop
    perform analytics_private.notification_mark_read(v_user, v_id);
  end loop;
end;
$$;

create function public.app_push_token_register(p_token text, p_platform text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
begin
  if p_platform is null or p_platform not in ('ios', 'android')
     or p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_\-]+\]$' or char_length(p_token) > 200 then
    raise exception 'invalid push token' using errcode = '22023';
  end if;
  -- A token belongs to one phone; if it moves to another account (sign-in on the same phone) it follows.
  insert into public.user_push_tokens (user_id, token, platform) values (v_user, p_token, p_platform)
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, disabled_at = null, last_seen_at = now();
end;
$$;

create function public.app_push_token_remove(p_token text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.user_push_tokens where token = p_token and user_id = analytics_private.current_app_user();
$$;

create function public.app_set_notification_pref(p_key text, p_enabled boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_enabled is null or p_key not in ('periodReminder', 'ovulationReminder', 'dailyLogReminder') then
    raise exception 'invalid preference' using errcode = '22023';
  end if;
  update public.app_users set
    notif_period_reminder = case when p_key = 'periodReminder' then p_enabled else notif_period_reminder end,
    notif_ovulation_reminder = case when p_key = 'ovulationReminder' then p_enabled else notif_ovulation_reminder end,
    notif_daily_log_reminder = case when p_key = 'dailyLogReminder' then p_enabled else notif_daily_log_reminder end
  where id = analytics_private.current_app_user();
end;
$$;

-- Discreet mode: notifications (and reminders) use neutral wording.
create function public.app_set_discreet_mode(p_enabled boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_enabled is null then
    raise exception 'invalid input' using errcode = '22023';
  end if;
  update public.app_users set discreet_mode = p_enabled where id = analytics_private.current_app_user();
end;
$$;

-- Console: is the dispatcher running? (It is a scheduled job, so a stale heartbeat means it isn't set up.)
create function public.admin_notifications_dispatcher_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.notification_dispatcher_state;
begin
  perform public.assert_console_admin();
  select * into s from public.notification_dispatcher_state where id = 1;
  return jsonb_build_object(
    'last_run_at', s.last_run_at,
    'minutes_ago', case when s.last_run_at is not null then round(extract(epoch from now() - s.last_run_at) / 60)::int end,
    'queued', (select count(*) from public.notification_campaigns where status = 'scheduled' or (status = 'active' and kind = 'trigger')),
    'pending_push', (select count(*) from public.user_notifications where push_status = 'pending'),
    'devices', (select count(*) from public.user_push_tokens where disabled_at is null)
  );
end;
$$;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('app_report_device', 'app_notifications_get', 'app_notifications_unread_count', 'app_notification_read',
                        'app_notifications_read_all', 'app_push_token_register', 'app_push_token_remove',
                        'app_set_notification_pref', 'app_set_discreet_mode', 'admin_notifications_dispatcher_status')
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;
revoke execute on function analytics_private.notification_mark_read(uuid, uuid) from public, anon, authenticated;
