-- Tracking mode chosen in the mobile app (Settings › Tracking mode).
-- app_users.tracking_mode already exists; this is the only way the app may change it.

create function public.app_set_tracking_mode(p_mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_mode public.tracking_mode;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  -- 'pregnant' is reached through the pregnancy flow, not picked here.
  if p_mode is null or p_mode not in ('ttc', 'pcos', 'iui', 'ivf', 'after_loss') then
    raise exception 'invalid tracking mode' using errcode = '22023';
  end if;
  v_mode := p_mode::public.tracking_mode;

  update public.app_users set
    tracking_mode = v_mode,
    -- Keep the journey stage in step, but never overwrite later stages (two-week wait, pregnant).
    journey_stage = case
      when journey_stage not in ('getting_started', 'trying', 'in_treatment', 'after_loss') then journey_stage
      when v_mode in ('iui', 'ivf') then 'in_treatment'::public.journey_stage
      when v_mode = 'after_loss' then 'after_loss'::public.journey_stage
      else 'trying'::public.journey_stage
    end
  where auth_user_id = v_uid;

  if not found then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.app_set_tracking_mode(text) from public, anon;
grant execute on function public.app_set_tracking_mode(text) to authenticated;
