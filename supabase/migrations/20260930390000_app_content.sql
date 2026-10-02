-- Content library → mobile app. The console authors four content types (content_items); the app
-- reads the published, app-visible ones that match the user's audience:
--   article      Health articles (Home preview + Articles screens), bookmarks
--   daily_tip    Today's tip on Home
--   in_app_card  cards placed on specific screens (layout, weighted variants, dismiss, frequency cap)
--   video        videos for the Articles feed and the Treatment screen
-- Audience = target plan / tracking mode / cycle phase (empty target = everyone).
-- Scheduled items go live lazily: any read first publishes what is due (there is no cron here).

create table public.user_content_bookmarks (
  user_id uuid not null references public.app_users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table public.user_content_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  event text not null check (event in ('impression', 'click', 'dismiss', 'read')),
  variant integer,
  created_at timestamptz not null default now()
);
create index user_content_events_idx on public.user_content_events (user_id, content_id, event);

alter table public.user_content_bookmarks enable row level security;
alter table public.user_content_events enable row level security;

-- ── Helpers (not exposed through the API) ───────────────────────────────────

create function analytics_private.publish_due_content()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.content_items
    set status = 'published', published_at = coalesce(published_at, scheduled_at)
  where status = 'scheduled' and scheduled_at <= now();
$$;

-- Who is reading: plan, tracking mode and today's cycle phase, in the console's vocabulary.
create function analytics_private.content_audience(p_user uuid, p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u public.app_users;
  m jsonb;
  v_phase text;
  v_cd integer;
  v_start date;
  v_ov date;
  v_next date;
begin
  select * into u from public.app_users where id = p_user;
  m := analytics_private.cycle_model(p_user, p_today);

  if u.tracking_mode = 'pregnant' then
    v_phase := 'Pregnant';
  elsif coalesce((m ->> 'hasData')::boolean, false) then
    v_start := (m ->> 'cycleStart')::date;
    v_ov := (m ->> 'ovulationDate')::date;
    v_next := (m ->> 'nextPeriod')::date;
    v_cd := p_today - v_start + 1;
    v_phase := case
      when p_today >= v_next then '2WW'
      when v_cd <= (m ->> 'periodLength')::int then 'Menstrual'
      when p_today between (m ->> 'fertileStart')::date and (m ->> 'fertileEnd')::date then 'Fertile'
      when p_today < (m ->> 'fertileStart')::date then 'Follicular'
      else '2WW' end;
  end if;

  return jsonb_build_object(
    'phase', v_phase,
    'cycleDay', v_cd,
    'mode', case u.tracking_mode::text when 'ivf' then 'iui' else u.tracking_mode::text end,
    'plan', case when u.plan::text = 'free' then 'free' else 'plus' end,
    'discreet', u.discreet_mode
  );
end;
$$;

create function analytics_private.content_matches(c public.content_items, aud jsonb)
returns boolean
language sql
stable
set search_path = ''
as $$
  select c.status = 'published'
    and c.visibility in ('app', 'app_web')
    and (c.published_at is null or c.published_at <= now())
    and (c.target_plan = 'all' or c.target_plan = aud ->> 'plan')
    and (cardinality(c.target_modes) = 0 or (aud ->> 'mode') = any (c.target_modes))
    and (cardinality(c.target_phases) = 0 or (aud ->> 'phase') = any (c.target_phases));
$$;

create function analytics_private.priority_rank(p_priority text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when p_priority like 'High%' then 0 when p_priority = 'Low' then 2 else 1 end;
$$;

create function analytics_private.article_summary(c public.content_items)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'category', jsonb_build_object('id', lower(replace(c.category, ' ', '-')), 'label', c.category),
    'title', c.title,
    'excerpt', coalesce(c.dek, ''),
    'readMinutes', greatest(1, ceil(coalesce(array_length(regexp_split_to_array(trim(coalesce(c.body, '')), '\s+'), 1), 0) / 200.0)::int),
    'author', coalesce(c.reviewer_name, 'Srikandi team'),
    'imageUrl', coalesce(c.image_url, '')
  );
$$;

revoke execute on function analytics_private.publish_due_content() from public, anon, authenticated;
revoke execute on function analytics_private.content_audience(uuid, date) from public, anon, authenticated;
revoke execute on function analytics_private.content_matches(public.content_items, jsonb) from public, anon, authenticated;
revoke execute on function analytics_private.article_summary(public.content_items) from public, anon, authenticated;

-- ── Articles ────────────────────────────────────────────────────────────────

-- Only articles that have a body are listed: a published shell would open to an empty page.
create function public.app_articles_list(p_today date, p_query text default null, p_category text default 'all')
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  aud jsonb;
  v_q text := nullif(trim(coalesce(p_query, '')), '');
begin
  perform analytics_private.publish_due_content();
  aud := analytics_private.content_audience(v_user, p_today);

  return jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', lower(replace(cat, ' ', '-')), 'label', cat) order by cat)
      from (select distinct c.category as cat from public.content_items c
            where c.type = 'article' and nullif(trim(coalesce(c.body, '')), '') is not null
              and analytics_private.content_matches(c, aud)) x
    ), '[]'::jsonb),
    'articles', coalesce((
      select jsonb_agg(analytics_private.article_summary(c) order by c.published_at desc nulls last)
      from (
        select * from public.content_items c
        where c.type = 'article' and nullif(trim(coalesce(c.body, '')), '') is not null
          and analytics_private.content_matches(c, aud)
          and (p_category is null or p_category = 'all' or lower(replace(c.category, ' ', '-')) = p_category)
          and (v_q is null or c.title ilike '%' || v_q || '%' or coalesce(c.dek, '') ilike '%' || v_q || '%')
        order by c.published_at desc nulls last limit 100
      ) c
    ), '[]'::jsonb)
  );
end;
$$;

create function public.app_article_get(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  c public.content_items;
begin
  perform analytics_private.publish_due_content();
  select * into c from public.content_items
    where id = p_id and type = 'article' and status = 'published' and visibility in ('app', 'app_web')
      and (published_at is null or published_at <= now());
  if c.id is null then
    raise exception 'article not found' using errcode = 'P0002';
  end if;

  return analytics_private.article_summary(c) || jsonb_build_object(
    'publishedAt', to_char(coalesce(c.published_at, c.created_at), 'YYYY-MM-DD'),
    'bookmarked', exists (select 1 from public.user_content_bookmarks b where b.user_id = v_user and b.content_id = c.id),
    'markdown', coalesce(c.body, ''),
    'related', coalesce((
      select jsonb_agg(analytics_private.article_summary(r))
      from (
        select * from public.content_items r
        where r.type = 'article' and r.id <> c.id and r.category = c.category
          and r.status = 'published' and r.visibility in ('app', 'app_web')
          and nullif(trim(coalesce(r.body, '')), '') is not null
        order by r.published_at desc nulls last limit 3
      ) r
    ), '[]'::jsonb)
  );
end;
$$;

create function public.app_content_set_bookmark(p_id uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
begin
  if p_on is null or not exists (select 1 from public.content_items where id = p_id and type = 'article') then
    raise exception 'invalid bookmark' using errcode = '22023';
  end if;
  if p_on then
    insert into public.user_content_bookmarks (user_id, content_id) values (v_user, p_id) on conflict do nothing;
  else
    delete from public.user_content_bookmarks where user_id = v_user and content_id = p_id;
  end if;
end;
$$;

-- ── Daily tip ───────────────────────────────────────────────────────────────

-- Tips pinned to today's cycle day win; otherwise one from the pool, stable for the whole day.
create function public.app_daily_tip(p_today date)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  aud jsonb;
  v_cd integer;
  t public.content_items;
begin
  perform analytics_private.publish_due_content();
  aud := analytics_private.content_audience(v_user, p_today);
  v_cd := (aud ->> 'cycleDay')::int;

  select * into t from public.content_items c
  where c.type = 'daily_tip' and analytics_private.content_matches(c, aud)
    and nullif(trim(c.title), '') is not null
    -- "Pinned" tips only appear on their own cycle days.
    and (coalesce(c.details ->> 'rotation', '') not like 'Pinned%'
         or (v_cd is not null and coalesce(c.details -> 'cycle_days', '[]'::jsonb) @> to_jsonb(v_cd)))
  order by
    (v_cd is not null and coalesce(c.details -> 'cycle_days', '[]'::jsonb) @> to_jsonb(v_cd)) desc,
    analytics_private.priority_rank(c.details ->> 'priority'),
    md5(c.id::text || p_today::text)
  limit 1;

  if t.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', t.id,
    -- A tip with only a title shows that as the text.
    'headline', case when nullif(trim(coalesce(t.body, t.dek, '')), '') is not null then t.title end,
    'text', coalesce(nullif(trim(coalesce(t.body, '')), ''), nullif(trim(coalesce(t.dek, '')), ''), t.title),
    'icon', t.details ->> 'icon',
    'tapAction', t.details ->> 'tap_action',
    'deepLink', nullif(t.details ->> 'deep_link', '')
  );
end;
$$;

-- ── In-app cards ────────────────────────────────────────────────────────────

create function public.app_content_cards(p_screen text, p_today date)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  aud jsonb;
  v_label text;
  v_discreet boolean;
  c public.content_items;
  v_variants jsonb;
  v_total integer;
  v_pick integer;
  v_acc integer;
  v_idx integer;
  v_variant jsonb;
  v_result jsonb := '[]'::jsonb;
  v_i integer;
begin
  v_label := case p_screen
    when 'home' then 'Home · below cycle card'
    when 'calendar' then 'Calendar'
    when 'two_week_wait' then 'Two-week wait'
    when 'log_today' then 'Log today sheet'
    when 'insights' then 'Insights'
  end;
  if v_label is null then
    raise exception 'unknown screen' using errcode = '22023';
  end if;

  perform analytics_private.publish_due_content();
  aud := analytics_private.content_audience(v_user, p_today);
  v_discreet := coalesce((aud ->> 'discreet')::boolean, false);

  for c in
    select * from public.content_items ci
    where ci.type = 'in_app_card' and analytics_private.content_matches(ci, aud)
      and coalesce(ci.details -> 'screens', '[]'::jsonb) ? v_label
      and (nullif(ci.details ->> 'run_from', '') is null or (ci.details ->> 'run_from')::date <= p_today)
      and (nullif(ci.details ->> 'run_to', '') is null or (ci.details ->> 'run_to')::date >= p_today)
      -- A discreet-mode user only sees cards that opted in (with neutral copy).
      and (not v_discreet or coalesce((ci.details ->> 'discreet_mode')::boolean, false))
      -- Dismissed, converted (when asked to hide) or over the frequency cap: not shown again.
      and not exists (select 1 from public.user_content_events e
                      where e.user_id = v_user and e.content_id = ci.id and e.event = 'dismiss')
      and not (coalesce((ci.details ->> 'hide_after_conversion')::boolean, false)
               and exists (select 1 from public.user_content_events e
                           where e.user_id = v_user and e.content_id = ci.id and e.event = 'click'))
      and (nullif(ci.details ->> 'frequency_cap', '') is null
           or (select count(*) from public.user_content_events e
               where e.user_id = v_user and e.content_id = ci.id and e.event = 'impression')
              < (ci.details ->> 'frequency_cap')::int)
    order by analytics_private.priority_rank(ci.details ->> 'priority'), ci.published_at desc nulls last
    limit 2
  loop
    -- Weighted variant (A/B), stable per user so a card doesn't change copy between visits.
    v_variants := coalesce(c.details -> 'variants', '[]'::jsonb);
    if jsonb_array_length(v_variants) = 0 then
      v_variants := jsonb_build_array(jsonb_build_object(
        'title', c.title, 'body', coalesce(c.dek, ''), 'cta_label', '', 'deep_link', '', 'weight', 100));
    end if;
    select coalesce(sum(greatest(coalesce((v ->> 'weight')::int, 0), 0)), 0) into v_total
      from jsonb_array_elements(v_variants) v;
    v_pick := (abs(hashtextextended(v_user::text || c.id::text, 0)) % greatest(v_total, 1))::int;
    v_acc := 0;
    v_idx := 0;
    for v_i in 0 .. jsonb_array_length(v_variants) - 1 loop
      v_acc := v_acc + greatest(coalesce((v_variants -> v_i ->> 'weight')::int, 0), 0);
      if v_pick < v_acc then
        v_idx := v_i;
        exit;
      end if;
    end loop;
    v_variant := v_variants -> v_idx;

    v_result := v_result || jsonb_build_object(
      'id', c.id,
      'layout', coalesce(c.details ->> 'layout', 'hero'),
      'imageUrl', nullif(c.image_url, ''),
      'dismissible', coalesce((c.details ->> 'dismissible')::boolean, true),
      'variant', v_idx,
      'title', case when v_discreet then 'New feature available' else v_variant ->> 'title' end,
      'body', case when v_discreet then null else nullif(v_variant ->> 'body', '') end,
      'ctaLabel', nullif(v_variant ->> 'cta_label', ''),
      'deepLink', nullif(v_variant ->> 'deep_link', ''));
  end loop;

  return v_result;
end;
$$;

-- ── Videos ──────────────────────────────────────────────────────────────────

create function public.app_videos(p_placement text, p_today date)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  aud jsonb;
  v_label text;
begin
  v_label := case p_placement
    when 'feed' then 'Articles & videos feed'
    when 'treatment' then 'Treatment program screen'
    when 'two_week_wait' then 'Two-week wait'
  end;
  if v_label is null then
    raise exception 'unknown placement' using errcode = '22023';
  end if;

  perform analytics_private.publish_due_content();
  aud := analytics_private.content_audience(v_user, p_today);

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'title', v.title, 'description', coalesce(v.dek, ''),
      'thumbnailUrl', nullif(v.image_url, ''), 'videoUrl', v.video_url,
      'durationSeconds', v.duration_seconds, 'presenter', nullif(v.details ->> 'presenter', '')
    ) order by v.published_at desc nulls last)
    from (
      select * from public.content_items v
      where v.type = 'video' and analytics_private.content_matches(v, aud)
        and nullif(trim(coalesce(v.video_url, '')), '') is not null
        and coalesce(v.details -> 'placement', '[]'::jsonb) ? v_label
      order by v.published_at desc nulls last limit 10
    ) v
  ), '[]'::jsonb);
end;
$$;

-- ── Events (impressions, clicks, dismissals, reads) ─────────────────────────

create function public.app_content_event(p_id uuid, p_event text, p_variant integer default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
begin
  if p_event is null or p_event not in ('impression', 'click', 'dismiss', 'read')
     or not exists (select 1 from public.content_items where id = p_id) then
    raise exception 'invalid content event' using errcode = '22023';
  end if;
  insert into public.user_content_events (user_id, content_id, event, variant) values (v_user, p_id, p_event, p_variant);
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
      and p.proname in ('app_articles_list', 'app_article_get', 'app_content_set_bookmark', 'app_daily_tip',
                        'app_content_cards', 'app_videos', 'app_content_event')
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;

-- Discreet mode is a choice the user makes (Privacy & security, not built yet), so it starts off.
-- It used to default to on, which would hide every in-app card from new users. Only app accounts
-- are reset: nobody could have chosen it yet.
alter table public.app_users alter column discreet_mode set default false;
update public.app_users set discreet_mode = false where auth_user_id is not null and discreet_mode;
