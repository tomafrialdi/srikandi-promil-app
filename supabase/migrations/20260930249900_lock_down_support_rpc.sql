-- admin_support_* RPCs and the two app-facing ones: authenticated only.

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'admin\_support\_%' or p.proname in ('support_open_ticket', 'support_rate_ticket'))
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end;
$$;
