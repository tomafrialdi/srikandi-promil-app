-- Mobile sign-up: every account created by the app (user_metadata.app = 'mobile')
-- gets an `app_users` row, linked to its auth user. Console admins are created
-- through invites without that marker, so they never show up as end users.

create function public.handle_new_mobile_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') <> 'mobile' then
    return new;
  end if;

  insert into public.app_users (auth_user_id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id
    where public.app_users.auth_user_id is null;

  return new;
end;
$$;

revoke execute on function public.handle_new_mobile_user() from public, anon, authenticated;

create trigger on_auth_user_created_mobile
  after insert on auth.users
  for each row execute function public.handle_new_mobile_user();

-- A user reads only their own row. Writes go through RPCs (plan, billing and
-- journey fields must never be client-writable).
create policy "users read own app_users row"
  on public.app_users for select
  to authenticated
  using (auth_user_id = (select auth.uid()));
