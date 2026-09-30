-- Notifications: campaigns, delivery stats and the campaign list RPCs.
-- Campaigns are queued here (status 'scheduled' / 'active'); a sender service picks them up and reports back
-- into sent/delivered/opened counts and notification_failures.

create type public.notification_channel as enum ('push', 'in_app', 'email');
create type public.notification_kind as enum ('trigger', 'scheduled', 'one_off');
create type public.notification_status as enum ('draft', 'active', 'paused', 'scheduled', 'sending', 'sent', 'failed');

create table public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  channel public.notification_channel not null default 'push',
  kind public.notification_kind not null default 'one_off',
  status public.notification_status not null default 'draft',
  -- Audience: [{field, op, value}] and a short label for the list.
  audience_rules jsonb not null default '[]',
  audience_label text not null default 'Everyone',
  -- Message.
  language text not null default 'en' check (language in ('en', 'id')),
  title text not null default '',
  body text not null default '',
  discreet_body text not null default '',
  deep_link text not null default '',
  category text not null default '',
  -- Delivery.
  trigger_event text,
  send_time text,
  send_at timestamptz,
  quiet_hours boolean not null default true,
  max_one_per_day boolean not null default true,
  ab_test boolean not null default false,
  requires_approval boolean not null default true,
  -- Results (written by the sender).
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  opened_count integer not null default 0,
  optout_count integer not null default 0,
  progress_pct integer check (progress_pct between 0 and 100),
  last_run_at timestamptz,
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_campaigns_status_idx on public.notification_campaigns (status, updated_at desc);

create trigger notification_campaigns_set_updated_at
  before update on public.notification_campaigns
  for each row execute function public.set_updated_at();

create table public.notification_hourly_opens (
  day date not null,
  hour smallint not null check (hour between 0 and 23),
  opens integer not null default 0,
  primary key (day, hour)
);

create table public.notification_failures (
  id bigint generated always as identity primary key,
  campaign_id uuid references public.notification_campaigns (id) on delete cascade,
  reason text not null check (reason in ('expired_apns_token', 'app_uninstalled', 'fcm_throttled', 'invalid_deep_link')),
  count integer not null check (count > 0),
  occurred_at timestamptz not null default now()
);
create index notification_failures_occurred_idx on public.notification_failures (occurred_at);

alter table public.notification_campaigns enable row level security;
alter table public.notification_hourly_opens enable row level security;
alter table public.notification_failures enable row level security;

create policy "admins read campaigns" on public.notification_campaigns for select to authenticated using ((select public.is_console_admin()));
create policy "admins read hourly opens" on public.notification_hourly_opens for select to authenticated using ((select public.is_console_admin()));
create policy "admins read notification failures" on public.notification_failures for select to authenticated using ((select public.is_console_admin()));

create function analytics_private.notification_tab(p_status public.notification_status)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'active' then 'active' when 'paused' then 'active'
    when 'sending' then 'sent' when 'sent' then 'sent'
    when 'draft' then 'drafts' when 'scheduled' then 'scheduled' when 'failed' then 'failed'
  end
$$;

create function public.admin_notifications_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    with recent as (
      select * from public.notification_campaigns where last_run_at >= now() - interval '30 days'
    )
    select jsonb_build_object(
      'sent_30d', coalesce((select sum(sent_count) from recent), 0),
      'campaigns_30d', (select count(*) from recent),
      'delivery_rate', (select round(100.0 * sum(delivered_count) / nullif(sum(sent_count), 0), 1) from recent),
      'open_rate', (select round(100.0 * sum(opened_count) / nullif(sum(delivered_count), 0), 1) from recent),
      'optout_rate', (select round(100.0 * sum(optout_count) / nullif(sum(sent_count), 0), 2) from recent),
      'counts', jsonb_build_object(
        'all', count(*),
        'active', count(*) filter (where status in ('active', 'paused')),
        'scheduled', count(*) filter (where status = 'scheduled'),
        'sent', count(*) filter (where status in ('sent', 'sending')),
        'drafts', count(*) filter (where status = 'draft'),
        'failed', count(*) filter (where status = 'failed'))
    )
    from public.notification_campaigns
  );
end;
$$;

create function public.admin_notifications_list(p_tab text default 'all', p_limit integer default 10, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    with filtered as (
      select * from public.notification_campaigns
      where p_tab = 'all' or analytics_private.notification_tab(status) = p_tab
    )
    select jsonb_build_object(
      'total', (select count(*) from filtered),
      'rows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id, 'name', name, 'channel', channel, 'kind', kind, 'status', status, 'audience', audience_label,
          'sent', sent_count, 'delivered_pct', round(100.0 * delivered_count / nullif(sent_count, 0), 1),
          'opened_pct', round(100.0 * opened_count / nullif(delivered_count, 0), 1),
          'progress_pct', progress_pct, 'last_run_at', last_run_at, 'send_at', send_at
        ) order by (status = 'sending') desc, coalesce(last_run_at, send_at, updated_at) desc, id)
        from (select * from filtered order by (status = 'sending') desc, coalesce(last_run_at, send_at, updated_at) desc, id
              limit greatest(p_limit, 1) offset greatest(p_offset, 0)) page
      ), '[]'::jsonb)
    )
  );
end;
$$;

create function public.admin_notifications_hourly()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    with h as (
      select g.hour, coalesce(sum(o.opens), 0)::integer as opens
      from generate_series(0, 23) g(hour)
      left join public.notification_hourly_opens o on o.hour = g.hour and o.day >= current_date - 6
      group by g.hour
    )
    select jsonb_build_object(
      'hours', (select jsonb_agg(opens order by hour) from h),
      'best_hour', (select hour from h order by opens desc, hour limit 1)
    )
  );
end;
$$;

create function public.admin_notifications_failures()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    with f as (
      select * from public.notification_failures where occurred_at >= now() - interval '30 days'
    ),
    total as (select coalesce(sum(count), 0) as n from f),
    worst as (
      select c.id, c.name, x.reason, round(100.0 * x.n / nullif(c.sent_count - c.delivered_count, 0)) as pct
      from public.notification_campaigns c
      join lateral (select reason, sum(count) as n from f where f.campaign_id = c.id group by reason order by sum(count) desc limit 1) x on true
      where c.status = 'failed'
      order by c.last_run_at desc nulls last
      limit 1
    )
    select jsonb_build_object(
      'total', (select n from total),
      'reasons', coalesce((
        select jsonb_agg(jsonb_build_object('reason', reason, 'pct', round(100.0 * n / nullif((select n from total), 0))) order by n desc)
        from (select reason, sum(count) as n from f group by reason) r
      ), '[]'::jsonb),
      'worst', (select jsonb_build_object('id', id, 'name', name, 'reason', reason, 'pct', pct) from worst)
    )
  );
end;
$$;
