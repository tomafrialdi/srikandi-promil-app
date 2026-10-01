-- Partner (mobile): the partner's name and what the user chooses to share with them.
-- Account linking is a later step, so `app_users.partner_linked` is left untouched and the
-- console keeps showing "Not linked" for these users. RLS on, no policies: RPC access only.

create table public.user_partner (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  partner_name text not null check (char_length(partner_name) between 1 and 40),
  share_fertile_window boolean not null default true,
  share_period_dates boolean not null default true,
  share_test_results boolean not null default true,
  share_mood boolean not null default false,
  share_symptoms_notes boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_partner_set_updated_at
  before update on public.user_partner
  for each row execute function public.set_updated_at();

alter table public.user_partner enable row level security;

create function public.app_partner_get()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.user_partner;
begin
  select * into p from public.user_partner where user_id = analytics_private.current_app_user();
  if not found then
    return jsonb_build_object('partner', null);
  end if;
  return jsonb_build_object('partner', jsonb_build_object(
    'name', p.partner_name,
    'addedAt', to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'sharing', jsonb_build_object(
      'fertileWindow', p.share_fertile_window,
      'periodDates', p.share_period_dates,
      'testResults', p.share_test_results,
      'mood', p.share_mood,
      'symptomsNotes', p.share_symptoms_notes)
  ));
end;
$$;

-- Adds the partner, or renames the existing one (sharing choices are kept).
create function public.app_partner_save(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  v_name text := trim(coalesce(p_name, ''));
begin
  if char_length(v_name) not between 1 and 40 then
    raise exception 'invalid partner name' using errcode = '22023';
  end if;
  insert into public.user_partner (user_id, partner_name) values (v_user, v_name)
  on conflict (user_id) do update set partner_name = excluded.partner_name;
end;
$$;

create function public.app_partner_set_sharing(p_key text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
begin
  if p_enabled is null then
    raise exception 'invalid input' using errcode = '22023';
  end if;
  update public.user_partner set
    share_fertile_window = case when p_key = 'fertileWindow' then p_enabled else share_fertile_window end,
    share_period_dates = case when p_key = 'periodDates' then p_enabled else share_period_dates end,
    share_test_results = case when p_key = 'testResults' then p_enabled else share_test_results end,
    share_mood = case when p_key = 'mood' then p_enabled else share_mood end,
    share_symptoms_notes = case when p_key = 'symptomsNotes' then p_enabled else share_symptoms_notes end
  where user_id = v_user
    and p_key in ('fertileWindow', 'periodDates', 'testResults', 'mood', 'symptomsNotes');
  if not found then
    raise exception 'unknown sharing option or no partner' using errcode = '22023';
  end if;
end;
$$;

create function public.app_partner_remove()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_partner where user_id = analytics_private.current_app_user();
end;
$$;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'app\_partner\_%'
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;
