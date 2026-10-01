-- Profile photo of an app user. The image itself lives on ImageKit; only its URL is stored.

alter table public.app_users add column avatar_url text;

-- p_url = null removes the photo. Only URLs on our ImageKit endpoint are accepted, so a
-- client cannot point the profile at an arbitrary host.
create function public.app_update_avatar(p_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_url is not null
     and (char_length(p_url) > 500 or p_url !~ '^https://ik\.imagekit\.io/cq3bz6rgo/[A-Za-z0-9_./%~-]+$')
  then
    raise exception 'invalid avatar url' using errcode = '22023';
  end if;

  update public.app_users set avatar_url = p_url where auth_user_id = v_uid;
  if not found then
    raise exception 'no app user for this account' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.app_update_avatar(text) from public, anon;
grant execute on function public.app_update_avatar(text) to authenticated;
