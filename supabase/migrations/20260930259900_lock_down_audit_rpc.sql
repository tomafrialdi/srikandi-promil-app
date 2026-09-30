-- admin_audit_* / admin_pdp_* RPCs: authenticated only (log_auth_failure keeps anon on purpose).

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'admin\_audit\_%' or p.proname like 'admin\_pdp\_%')
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
  -- Trigger functions are never called through the API.
  revoke execute on function public.audit_log_chain() from public, anon, authenticated;
  revoke execute on function public.audit_detect() from public, anon, authenticated;
end;
$$;
