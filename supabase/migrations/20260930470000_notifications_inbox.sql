-- Notifications, end to end.
--   console campaigns  --notifications_dispatch()-->  user_notifications (the app's inbox)  --push sender-->  phones
-- The dispatcher is called every few minutes (Supabase Cron -> Edge Function `notify-dispatch`). It delivers
-- due one-off / scheduled campaigns, and evaluates trigger campaigns at each user's local send time.
-- Inbox rows are created per user; push goes out afterwards for users who registered a device token.

-- ── User settings the dispatcher and the reminders need ─────────────────────
alter table public.app_users
  add column timezone text not null default 'Asia/Jakarta' check (char_length(timezone) <= 60),
  add column notif_period_reminder boolean not null default true,
  add column notif_ovulation_reminder boolean not null default true,
  add column notif_daily_log_reminder boolean not null default false;

-- Failure reasons the console shows; two new ones for a push provider that isn't set up yet.
alter table public.notification_failures drop constraint notification_failures_reason_check;
alter table public.notification_failures add constraint notification_failures_reason_check
  check (reason in ('expired_apns_token', 'app_uninstalled', 'fcm_throttled', 'invalid_deep_link',
                    'missing_push_credentials', 'provider_error'));

-- ── Tables ───────────────────────────────────────────────────────────────────
create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  campaign_id uuid references public.notification_campaigns (id) on delete set null,
  -- Machine name; the app picks icon and colour from it. Category = the app's filter tab.
  type text not null,
  category text not null check (category in ('cycle', 'reminders', 'partner', 'community', 'updates')),
  title text not null,
  body text not null,
  -- Neutral copy shown when the user turned discreet mode on.
  discreet_title text not null default 'Reminder',
  discreet_body text not null default '',
  deep_link text not null default '',
  cta_label text not null default '',
  -- Once per user per campaign per key (a trigger campaign repeats with a new key, e.g. the date).
  dedupe_key text not null default 'once',
  channel public.notification_channel not null default 'in_app',
  -- When it appears (and, for push, goes out). Later than creation during quiet hours.
  created_at timestamptz not null default now(),
  read_at timestamptz,
  push_status text not null default 'skipped' check (push_status in ('skipped', 'pending', 'sent', 'failed', 'no_token')),
  push_sent_at timestamptz,
  push_ticket text,
  unique (user_id, campaign_id, dedupe_key)
);
create index user_notifications_user_idx on public.user_notifications (user_id, created_at desc);
create index user_notifications_push_idx on public.user_notifications (created_at) where push_status = 'pending';

create table public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz
);
create index user_push_tokens_user_idx on public.user_push_tokens (user_id) where disabled_at is null;

create table public.notification_dispatcher_state (
  id integer primary key check (id = 1),
  last_run_at timestamptz not null,
  last_delivered integer not null default 0
);

alter table public.user_notifications enable row level security;
alter table public.user_push_tokens enable row level security;
alter table public.notification_dispatcher_state enable row level security;

-- ── Helpers (not exposed through the API) ───────────────────────────────────

-- Console category text ("Cycle · 2WW", "Promo", "Content" …) -> the app's filter tab.
create function analytics_private.notification_app_category(p_category text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_category ilike 'cycle%' then 'cycle'
    when p_category ilike 'partner%' then 'partner'
    when p_category ilike 'community%' then 'community'
    when p_category ilike 'reminder%' or p_category ilike 'care%' then 'reminders'
    else 'updates' end;
$$;

create function analytics_private.notification_type(p_trigger text, p_category text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_trigger ilike '%fertile window%' then 'fertile_window_open'
    when p_trigger ilike '%2WW%' then 'two_week_wait'
    when p_trigger ilike 'cycle day 1%' then 'cycle_started'
    when p_trigger ilike '%partner%' then 'partner_invite'
    when p_trigger ilike '%trial%' then 'trial_ending'
    when p_category ilike 'content%' then 'new_article'
    when p_category ilike 'promo%' then 'promo'
    else 'campaign' end;
$$;

create function analytics_private.notification_render(p_text text, p_vars jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_out text := coalesce(p_text, '');
  k text;
begin
  for k in select jsonb_object_keys(p_vars) loop
    v_out := replace(v_out, '{' || k || '}', coalesce(p_vars ->> k, ''));
  end loop;
  return v_out;
end;
$$;

-- Does this user belong to the campaign's audience? (tracking mode, plan, recent activity, cycle phase)
create function analytics_private.campaign_matches(
  c public.notification_campaigns, u public.app_users, p_aud jsonb, p_model jsonb, p_local_date date)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  r jsonb;
  v_modes text[];
  v_plan text;
  v_label text;
  v_phase text;
begin
  -- Gentle mode (after a loss) never receives campaigns.
  if u.tracking_mode = 'after_loss' then return false; end if;

  for r in select * from jsonb_array_elements(coalesce(c.audience_rules, '[]'::jsonb)) loop
    case r ->> 'field'
      when 'tracking_mode' then
        v_modes := coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(r -> 'value') = 'array' then r -> 'value' else '[]'::jsonb end)), '{}');
        if cardinality(v_modes) > 0 and not (u.tracking_mode::text = any (v_modes) or ('iui' = any (v_modes) and u.tracking_mode = 'ivf')) then
          return false;
        end if;
      when 'plan' then
        v_plan := r ->> 'value';
        if v_plan = 'free' and u.plan::text not in ('free', 'trial') then return false; end if;
        if v_plan = 'plus' and u.plan::text not in ('plus_monthly', 'plus_yearly', 'clinic_sponsored') then return false; end if;
      when 'last_active' then
        if coalesce(nullif(r ->> 'value', '')::integer, 0) > 0
           and (u.last_active_at is null or u.last_active_at < now() - make_interval(days => (r ->> 'value')::integer)) then
          return false;
        end if;
      when 'cycle_phase' then
        v_label := r ->> 'value';
        v_phase := case
          when v_label ilike 'Fertile window%' then 'Fertile'
          when v_label ilike 'Menstrual%' then 'Menstrual'
          when v_label ilike 'Follicular%' then 'Follicular'
          when v_label ilike '2WW%' then '2WW'
          when v_label ilike 'Pregnant%' then 'Pregnant'
        end;
        if v_phase is not null and coalesce(p_aud ->> 'phase', '') <> v_phase then return false; end if;
        -- "Fertile window (day 1)": only on the day the window opens.
        if v_label ilike 'Fertile window (day 1)%'
           and coalesce((p_model ->> 'fertileStart')::date, date '1900-01-01') <> p_local_date then
          return false;
        end if;
      else null;
    end case;
  end loop;
  return true;
end;
$$;

-- Creates the inbox row for one user, honouring "max one per day" and quiet hours. Returns 1 if created.
create function analytics_private.campaign_deliver(
  c public.notification_campaigns, u public.app_users, p_dedupe text, p_model jsonb, p_local_ts timestamp)
returns integer
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_vars jsonb;
  v_when timestamptz := now();
  v_hour integer := extract(hour from p_local_ts);
  v_day_start timestamptz;
  v_count integer;
begin
  -- Quiet hours (21:00–07:00 local): the message waits until 07:00.
  if c.channel = 'push' and c.quiet_hours and (v_hour >= 21 or v_hour < 7) then
    v_when := ((case when v_hour >= 21 then p_local_ts::date + 1 else p_local_ts::date end)::timestamp + time '07:00') at time zone u.timezone;
  end if;

  -- "Max one per day" is judged on the day the message actually goes out (a held message counts for tomorrow).
  if c.channel = 'push' and c.max_one_per_day then
    v_day_start := ((v_when at time zone u.timezone)::date)::timestamp at time zone u.timezone;
    if exists (select 1 from public.user_notifications n
               join public.notification_campaigns nc on nc.id = n.campaign_id
               where n.user_id = u.id and nc.channel = 'push'
                 and n.created_at >= v_day_start and n.created_at < v_day_start + interval '1 day') then
      return 0;
    end if;
  end if;

  v_vars := jsonb_build_object(
    'first_name', split_part(u.full_name, ' ', 1),
    'cycle_day', case when coalesce((p_model ->> 'hasData')::boolean, false) then (p_local_ts::date - (p_model ->> 'cycleStart')::date + 1)::text end,
    'partner_name', (select partner_name from public.user_partner where user_id = u.id),
    'days_to_test', case when coalesce((p_model ->> 'hasData')::boolean, false)
                         then greatest(0, ((p_model ->> 'ovulationDate')::date + 12) - p_local_ts::date)::text end);

  insert into public.user_notifications (
    user_id, campaign_id, type, category, title, body, discreet_title, discreet_body, deep_link, cta_label,
    dedupe_key, channel, created_at, push_status)
  values (
    u.id, c.id, analytics_private.notification_type(c.trigger_event, c.category),
    analytics_private.notification_app_category(c.category),
    analytics_private.notification_render(c.title, v_vars), analytics_private.notification_render(c.body, v_vars),
    'Reminder', coalesce(nullif(c.discreet_body, ''), 'Open the app to see your update'),
    c.deep_link, case when c.deep_link <> '' then 'Open' else '' end,
    p_dedupe, c.channel, v_when,
    case when c.channel = 'push' then 'pending' else 'skipped' end)
  on conflict (user_id, campaign_id, dedupe_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ── The dispatcher ───────────────────────────────────────────────────────────
-- Service role only (called by the Edge Function). Returns what it did.
create function public.notifications_dispatch()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.notification_campaigns;
  u public.app_users;
  v_model jsonb;
  v_aud jsonb;
  v_local timestamp;
  v_local_date date;
  v_time time;
  v_event boolean;
  v_sent integer;
  v_total integer := 0;
  v_campaigns integer := 0;
begin
  -- 1. One-off and scheduled campaigns that are due: everyone in the audience, now.
  for c in
    select * from public.notification_campaigns
    where status = 'scheduled' and channel in ('push', 'in_app') and send_at <= now()
    for update skip locked
  loop
    update public.notification_campaigns set status = 'sending' where id = c.id;
    v_sent := 0;
    for u in
      select * from public.app_users
      where auth_user_id is not null and status = 'active' and deletion_requested_at is null
    loop
      v_local := now() at time zone u.timezone;
      v_local_date := v_local::date;
      v_model := analytics_private.cycle_model(u.id, v_local_date);
      v_aud := analytics_private.content_audience(u.id, v_local_date);
      if analytics_private.campaign_matches(c, u, v_aud, v_model, v_local_date) then
        v_sent := v_sent + analytics_private.campaign_deliver(c, u, 'once', v_model, v_local);
      end if;
    end loop;
    update public.notification_campaigns set
      status = 'sent', sent_count = sent_count + v_sent,
      delivered_count = delivered_count + case when channel = 'in_app' then v_sent else 0 end,
      progress_pct = 100, last_run_at = now()
    where id = c.id;
    v_total := v_total + v_sent;
    v_campaigns := v_campaigns + 1;
  end loop;

  -- 2. Trigger campaigns: for users whose local clock is inside the send window (15 minutes from the
  --    chosen time), when the event happens today. One delivery per user per local day.
  for c in
    select * from public.notification_campaigns
    where status = 'active' and kind = 'trigger' and channel in ('push', 'in_app')
  loop
    v_time := coalesce(substring(c.send_time from '^(\d{2}:\d{2})')::time, time '09:00');
    v_sent := 0;
    for u in
      select * from public.app_users
      where auth_user_id is not null and status = 'active' and deletion_requested_at is null
        and (now() at time zone timezone)::time >= v_time
        and (now() at time zone timezone)::time < v_time + interval '15 minutes'
    loop
      v_local := now() at time zone u.timezone;
      v_local_date := v_local::date;
      v_model := analytics_private.cycle_model(u.id, v_local_date);
      v_aud := analytics_private.content_audience(u.id, v_local_date);
      v_event := coalesce(c.trigger_event, '') <> '' and case
        when c.trigger_event ilike '%fertile window opens%' then
          coalesce((v_model ->> 'hasData')::boolean, false) and (v_model ->> 'fertileStart')::date = v_local_date
        when c.trigger_event ilike '%2WW day 7%' then
          coalesce((v_model ->> 'hasData')::boolean, false) and v_local_date - (v_model ->> 'ovulationDate')::date = 7
          and v_local_date < (v_model ->> 'nextPeriod')::date
        when c.trigger_event ilike '%2WW day 12%' then
          coalesce((v_model ->> 'hasData')::boolean, false) and v_local_date - (v_model ->> 'ovulationDate')::date = 12
          and v_local_date < (v_model ->> 'nextPeriod')::date
        when c.trigger_event ilike 'Cycle day 1%' then
          coalesce((v_model ->> 'hasData')::boolean, false) and (v_model ->> 'cycleStart')::date = v_local_date
        when c.trigger_event ilike '%day 7 without partner%' then
          (u.created_at at time zone u.timezone)::date + 7 = v_local_date
          and not exists (select 1 from public.user_partner p where p.user_id = u.id)
        when c.trigger_event ilike '%trial ends in 2 days%' then
          u.plan = 'trial' and u.trial_started_at is not null and (u.trial_started_at at time zone u.timezone)::date + 5 = v_local_date
        else false end;
      if v_event and analytics_private.campaign_matches(c, u, v_aud, v_model, v_local_date) then
        v_sent := v_sent + analytics_private.campaign_deliver(c, u, v_local_date::text, v_model, v_local);
      end if;
    end loop;
    if v_sent > 0 then
      update public.notification_campaigns set
        sent_count = sent_count + v_sent,
        delivered_count = delivered_count + case when channel = 'in_app' then v_sent else 0 end,
        last_run_at = now()
      where id = c.id;
      v_total := v_total + v_sent;
    end if;
  end loop;

  insert into public.notification_dispatcher_state (id, last_run_at, last_delivered)
  values (1, now(), v_total)
  on conflict (id) do update set last_run_at = excluded.last_run_at, last_delivered = excluded.last_delivered;

  return jsonb_build_object('delivered', v_total, 'campaigns', v_campaigns);
end;
$$;

-- ── Push sender (service role only) ─────────────────────────────────────────

-- What to send now: pending pushes whose time has come, with the user's active device tokens.
-- Users without a token are marked no_token (they still have the inbox row).
create function public.notifications_push_batch(p_limit integer default 200)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.user_notifications n set push_status = 'no_token'
  where n.push_status = 'pending' and n.created_at <= now()
    and not exists (select 1 from public.user_push_tokens t where t.user_id = n.user_id and t.disabled_at is null);

  return coalesce((
    select jsonb_agg(row_to_json(b))
    from (
      select n.id,
             (select jsonb_agg(t.token) from public.user_push_tokens t where t.user_id = n.user_id and t.disabled_at is null) as tokens,
             case when u.discreet_mode then n.discreet_title else n.title end as title,
             case when u.discreet_mode then n.discreet_body else n.body end as body,
             jsonb_build_object('notificationId', n.id, 'deepLink', n.deep_link) as data
      from public.user_notifications n
      join public.app_users u on u.id = n.user_id
      where n.push_status = 'pending' and n.created_at <= now()
      order by n.created_at limit p_limit
    ) b
  ), '[]'::jsonb);
end;
$$;

-- results: [{id, status: 'sent'|'failed', ticket?, error?, token?, deadTokens?: [token]}]
create function public.notifications_push_report(p_results jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r jsonb;
  n public.user_notifications;
  v_reason text;
begin
  for r in select * from jsonb_array_elements(coalesce(p_results, '[]'::jsonb)) loop
    -- Devices the push service says are gone (app uninstalled) stop receiving pushes.
    update public.user_push_tokens set disabled_at = now()
    where token in (select jsonb_array_elements_text(coalesce(r -> 'deadTokens', '[]'::jsonb)));

    select * into n from public.user_notifications where id = (r ->> 'id')::uuid for update;
    if n.id is null or n.push_status <> 'pending' then continue; end if;

    if r ->> 'status' = 'sent' then
      update public.user_notifications set push_status = 'sent', push_sent_at = now(), push_ticket = r ->> 'ticket' where id = n.id;
      update public.notification_campaigns set delivered_count = delivered_count + 1 where id = n.campaign_id;
      insert into public.push_deliveries (user_id, kind, title, sent_at) values (n.user_id, n.type, n.title, now());
    else
      v_reason := case r ->> 'error'
        when 'DeviceNotRegistered' then 'app_uninstalled'
        when 'MessageRateExceeded' then 'fcm_throttled'
        when 'InvalidCredentials' then 'missing_push_credentials'
        else 'provider_error' end;
      update public.user_notifications set push_status = 'failed' where id = n.id;
      -- One row per campaign and reason per report keeps the failure card readable.
      insert into public.notification_failures (campaign_id, reason, count) values (n.campaign_id, v_reason, 1);
      if r ->> 'error' = 'DeviceNotRegistered' and r ->> 'token' is not null then
        update public.user_push_tokens set disabled_at = now() where token = r ->> 'token';
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.notifications_dispatch() from public, anon, authenticated;
revoke execute on function public.notifications_push_batch(integer) from public, anon, authenticated;
revoke execute on function public.notifications_push_report(jsonb) from public, anon, authenticated;
grant execute on function public.notifications_dispatch() to service_role;
grant execute on function public.notifications_push_batch(integer) to service_role;
grant execute on function public.notifications_push_report(jsonb) to service_role;
revoke execute on function analytics_private.notification_app_category(text) from public, anon, authenticated;
revoke execute on function analytics_private.notification_type(text, text) from public, anon, authenticated;
revoke execute on function analytics_private.notification_render(text, jsonb) from public, anon, authenticated;
revoke execute on function analytics_private.campaign_matches(public.notification_campaigns, public.app_users, jsonb, jsonb, date) from public, anon, authenticated;
revoke execute on function analytics_private.campaign_deliver(public.notification_campaigns, public.app_users, text, jsonb, timestamp) from public, anon, authenticated;
