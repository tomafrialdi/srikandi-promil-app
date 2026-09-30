-- Supabase grants EXECUTE to anon by default on new public functions; the console RPCs are
-- authenticated-only (they also enforce is_console_admin() internally).

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'dashboard\_%' or p.proname like 'analytics\_%'
           or p.proname in ('is_console_admin', 'assert_console_admin', 'log_console_event'))
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;
