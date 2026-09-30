-- Audit log v2: every row gets a category, a risk level, the device it came from and a SHA-256 hash chained to the
-- previous row. The table stays immutable (no update / delete); the chain makes any tampering visible.

alter table public.audit_log
  add column category text,
  add column risk text check (risk in ('low', 'med', 'high')),
  add column device text,
  add column hash bytea,
  add column prev_hash bytea;

create function analytics_private.audit_category(p_action text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_action like 'auth.%' or p_action like 'account.%' then 'auth'
    when p_action like 'health.%' or p_action like 'user.unmask%' or p_action like 'user.view.%' or p_action = 'community.view_post' then 'data_access'
    when p_action like 'users.%' or p_action like 'user.%' or p_action like 'community.%' then 'users'
    when p_action like 'content.%' or p_action like 'notification.%' then 'content'
    when p_action like 'engine.%' then 'engine'
    when p_action like 'plan.%' or p_action like 'promo.%' or p_action like 'invoice.%' or p_action like 'payment.%' or p_action like 'billing.%' then 'billing'
    when p_action like 'admin.%' or p_action like 'security.%' or p_action like 'audit.%' then 'roles'
    when p_action like 'doctor.%' or p_action like 'clinic.%' or p_action like 'medication.%' then 'care'
    when p_action like 'support.%' then 'support'
    when p_action like 'pdp.%' then 'pdp'
    else 'other' end
$$;

create function analytics_private.audit_risk(p_action text, p_metadata jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_metadata ->> 'risk' in ('low', 'med', 'high') then p_metadata ->> 'risk'
    when p_action like 'health.unmask%' or p_action like 'user.unmask%' or p_action in ('admin.role_change', 'admin.remove', 'admin.suspend', 'auth.failed_2fa', 'audit.export')
      or p_action like 'security.%' or p_action like 'pdp.delete%' then 'high'
    when p_action like 'engine.%' or p_action in ('invoice.refund', 'community.remove', 'admin.invite', 'clinic.approve', 'clinic.suspend', 'doctor.suspend', 'support.escalate',
      'medication.approve', 'plan.price_request', 'auth.failed_login', 'users.grant_plus', 'user.change_plan') or p_action like 'pdp.%' then 'med'
    else 'low' end
$$;

-- Browser + OS from the User-Agent header: "Chrome · macOS".
create function analytics_private.request_device()
returns text
language sql
stable
set search_path = ''
as $$
  select case when ua is null then null else
    case when ua ~ 'Edg/' then 'Edge' when ua ~ 'Firefox/' then 'Firefox' when ua ~ 'Chrome/' then 'Chrome' when ua ~ 'Safari/' then 'Safari' when ua ~ 'SrikandiAdmin' then 'Admin app' else 'Client' end ||
    ' · ' || case when ua ~ 'iPhone|iPad' then 'iOS' when ua ~ 'Android' then 'Android' when ua ~ 'Macintosh' then 'macOS' when ua ~ 'Windows' then 'Windows' when ua ~ 'Linux' then 'Linux' else 'other' end
  end
  from (select nullif(current_setting('request.headers', true), '')::json ->> 'user-agent' as ua) h
$$;

-- Active "suspend unmask permission" containment per admin.
create table public.admin_unmask_blocks (
  admin_id uuid primary key references public.admin_profiles (id) on delete cascade,
  until timestamptz not null,
  reason text,
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.admin_unmask_blocks enable row level security;

create table public.audit_chain_checks (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  rows_checked bigint not null,
  head_hash bytea,
  broken_at bigint,
  checked_by uuid references public.admin_profiles (id) on delete set null
);
alter table public.audit_chain_checks enable row level security;

create function analytics_private.audit_row_hash(p_prev bytea, r public.audit_log)
returns bytea
language sql
stable
set search_path = ''
as $$
  select extensions.digest(
    coalesce(p_prev, '\x'::bytea) || convert_to(
      r.id::text || '|' || coalesce(r.actor_id::text, '') || '|' || coalesce(r.actor_email, '') || '|' || r.action || '|' || coalesce(r.resource, '') || '|' ||
      to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|' || r.metadata::text || '|' || coalesce(r.ip, ''), 'UTF8'),
    'sha256')
$$;

create function public.audit_log_chain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prev bytea;
  v_until timestamptz;
begin
  if new.action like '%unmask%' and new.actor_id is not null then
    select until into v_until from public.admin_unmask_blocks where admin_id = new.actor_id and until > now();
    if v_until is not null then
      raise exception 'your unmask permission is suspended until % (security review)', to_char(v_until, 'DD Mon HH24:MI') using errcode = '42501';
    end if;
  end if;
  new.category := coalesce(new.category, analytics_private.audit_category(new.action));
  new.risk := coalesce(new.risk, analytics_private.audit_risk(new.action, new.metadata));
  new.ip := coalesce(new.ip, analytics_private.request_ip());
  new.device := coalesce(new.device, analytics_private.request_device());
  perform pg_advisory_xact_lock(7001);
  select hash into v_prev from public.audit_log order by id desc limit 1;
  new.prev_hash := v_prev;
  new.hash := analytics_private.audit_row_hash(v_prev, new);
  return new;
end;
$$;

-- Backfill existing rows in order (the immutability trigger is paused only for this one statement block).
alter table public.audit_log disable trigger audit_log_no_update;
do $$
declare
  r public.audit_log;
  v_prev bytea := null;
  v_hash bytea;
begin
  for r in select * from public.audit_log order by id loop
    r.category := analytics_private.audit_category(r.action);
    r.risk := analytics_private.audit_risk(r.action, r.metadata);
    v_hash := analytics_private.audit_row_hash(v_prev, r);
    update public.audit_log set category = r.category, risk = r.risk, prev_hash = v_prev, hash = v_hash where id = r.id;
    v_prev := v_hash;
  end loop;
end;
$$;
alter table public.audit_log enable trigger audit_log_no_update;

alter table public.audit_log alter column category set not null, alter column risk set not null, alter column hash set not null;
create index audit_log_category_idx on public.audit_log (category, created_at desc);
create index audit_log_risk_idx on public.audit_log (risk, created_at desc) where risk = 'high';
create index audit_log_resource_idx on public.audit_log (resource);

create trigger audit_log_chain_before_insert
  before insert on public.audit_log
  for each row execute function public.audit_log_chain();

-- Recomputes the chain from the start; returns { ok, rows, head, broken_at }.
create function analytics_private.audit_verify()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  r public.audit_log;
  v_prev bytea := null;
  v_count bigint := 0;
begin
  for r in select * from public.audit_log order by id loop
    if r.prev_hash is distinct from v_prev or r.hash is distinct from analytics_private.audit_row_hash(v_prev, r) then
      return jsonb_build_object('ok', false, 'rows', v_count, 'head', encode(v_prev, 'hex'), 'broken_at', r.id);
    end if;
    v_prev := r.hash;
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('ok', true, 'rows', v_count, 'head', encode(v_prev, 'hex'), 'broken_at', null);
end;
$$;
