-- Users › actions: suspend / reactivate, grant Plus, change plan.

-- Admin-level roles may act on users; others are read-only.
create function analytics_private.require_role(p_roles public.admin_role[])
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if analytics_private.console_role() is null or not (analytics_private.console_role() = any (p_roles)) then
    raise exception 'your role is not allowed to do this' using errcode = '42501';
  end if;
end;
$$;

create function public.admin_set_users_status(p_user_ids uuid[], p_status public.user_status, p_reason text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text;
  v_count integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  v_reason := analytics_private.require_reason(p_reason);

  update public.app_users set
    status = p_status,
    suspended_at = case when p_status = 'suspended' then now() end,
    suspended_reason = case when p_status = 'suspended' then v_reason end
  where id = any (p_user_ids) and status <> p_status;
  get diagnostics v_count = row_count;

  perform analytics_private.write_audit(
    case when p_status = 'suspended' then 'users.suspend' else 'users.reactivate' end,
    'users:' || coalesce(array_length(p_user_ids, 1), 0),
    jsonb_build_object('reason', v_reason, 'count', v_count, 'refs', (select jsonb_agg(analytics_private.user_ref(x)) from unnest(p_user_ids) x)));
  return v_count;
end;
$$;

-- Price breakdown for moving a user to another plan.
create function analytics_private.plan_change_quote(p_user uuid, p_plan public.plan_type, p_promo text, p_when text)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  u public.app_users;
  cur public.plan_catalog;
  tgt public.plan_catalog;
  pr public.promo_codes;
  v_list integer;
  v_discount integer := 0;
  v_period_days numeric;
  v_days_left integer := 0;
  v_credit integer := 0;
  v_total integer;
  v_lines jsonb := '[]';
  v_promo_error text;
begin
  select * into u from public.app_users where id = p_user;
  if u.id is null then raise exception 'user not found' using errcode = 'P0002'; end if;
  select * into cur from public.plan_catalog where plan = u.plan;
  select * into tgt from public.plan_catalog where plan = p_plan;
  if tgt.plan is null then raise exception 'unknown plan' using errcode = '22023'; end if;

  -- Sponsored plans are valued at the underlying Plus Yearly price.
  v_list := case when tgt.plan = 'clinic_sponsored' then (select price_idr from public.plan_catalog where plan = 'plus_yearly') else tgt.price_idr end;

  if nullif(trim(coalesce(p_promo, '')), '') is not null then
    select * into pr from public.promo_codes where code = upper(trim(p_promo));
    if pr.code is null then
      v_promo_error := 'Unknown promo code';
    elsif pr.valid_until < current_date then
      v_promo_error := 'Promo code expired';
    elsif pr.used_count >= pr.max_uses then
      v_promo_error := 'Promo code fully used';
    elsif not (tgt.plan = pr.applies_to or tgt.plan = pr.sponsor_plan) then
      v_promo_error := 'Promo code does not apply to this plan';
    else
      v_discount := round(v_list * pr.discount_pct / 100.0);
    end if;
  end if;

  if p_when = 'immediately' and u.plan in ('plus_monthly', 'plus_yearly') and u.plan_renews_at > now() then
    v_period_days := extract(epoch from (u.plan_renews_at - (u.plan_renews_at - make_interval(months => cur.period_months)))) / 86400;
    v_days_left := ceil(extract(epoch from (u.plan_renews_at - now())) / 86400);
    v_credit := round(cur.price_idr * least(v_days_left, v_period_days) / v_period_days);
  end if;

  v_lines := v_lines || jsonb_build_array(jsonb_build_object(
    'label', tgt.label || case when tgt.period_months >= 12 then ' · ' || tgt.period_months || ' months' else '' end, 'amount', v_list));
  if v_discount > 0 then
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'label', 'Promo ' || pr.code || ' (' || pr.discount_pct || '%)', 'amount', -v_discount));
  end if;
  if v_credit > 0 then
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'label', 'Unused ' || cur.label || ' (' || v_days_left || ' days)', 'amount', -v_credit));
  end if;

  v_total := case when p_when = 'immediately' then v_list - v_discount - v_credit else 0 end;

  return jsonb_build_object(
    'current', jsonb_build_object(
      'plan', u.plan, 'label', cur.label, 'price_idr', cur.price_idr, 'payment', u.payment_method,
      'renews', to_char(u.plan_renews_at, 'DD Mon YYYY'), 'days_left', v_days_left, 'active', u.status = 'active'),
    'target', jsonb_build_object('plan', tgt.plan, 'label', tgt.label),
    'promo', case when pr.code is not null and v_promo_error is null then jsonb_build_object(
      'code', pr.code, 'description', pr.description, 'audience', pr.audience, 'used', pr.used_count, 'max', pr.max_uses,
      'valid_until', to_char(pr.valid_until, 'DD Mon YYYY')) end,
    'promo_error', v_promo_error,
    'lines', v_lines,
    'apply_when', p_when,
    'due_now', greatest(v_total, 0),
    'refund', greatest(-v_total, 0),
    'needs_approval', greatest(-v_total, 0) > 500000,
    'valid_promos', (select coalesce(jsonb_agg(code order by code), '[]'::jsonb) from public.promo_codes
                     where valid_until >= current_date and used_count < max_uses and code <> coalesce(pr.code, ''))
  );
end;
$$;

create function public.admin_plan_change_preview(p_user uuid, p_plan public.plan_type, p_promo text default null, p_when text default 'immediately')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return analytics_private.plan_change_quote(p_user, p_plan, p_promo, p_when);
end;
$$;

create function public.admin_change_plan(
  p_user uuid,
  p_plan public.plan_type,
  p_promo text,
  p_when text,
  p_refund_as text,
  p_reason text,
  p_ticket text,
  p_notify boolean default true
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  u public.app_users;
  q jsonb;
  v_reason text;
  v_old_price integer;
  v_new_price integer;
  v_delta integer;
  v_period integer;
  v_refund integer;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  v_reason := analytics_private.require_reason(p_reason);

  select * into u from public.app_users where id = p_user for update;
  q := analytics_private.plan_change_quote(p_user, p_plan, p_promo, p_when);
  if q ->> 'promo_error' is not null then
    raise exception '%', q ->> 'promo_error' using errcode = '22023';
  end if;
  if p_plan = u.plan then
    raise exception 'user is already on this plan' using errcode = '22023';
  end if;

  v_refund := (q ->> 'refund')::int;
  if v_refund > 500000 and analytics_private.console_role() not in ('super_admin', 'admin') then
    raise exception 'refunds above Rp 500.000 need an Admin' using errcode = '42501';
  end if;

  if p_when = 'immediately' then
    select monthly_idr into v_old_price from public.plan_prices where plan = u.plan;
    select monthly_idr into v_new_price from public.plan_prices where plan = p_plan;
    select period_months into v_period from public.plan_catalog where plan = p_plan;
    v_delta := coalesce(v_new_price, 0) - coalesce(v_old_price, 0);

    update public.app_users set
      plan = p_plan,
      pending_plan = null, pending_plan_at = null,
      paid_at = case when p_plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored') then coalesce(paid_at, now()) else paid_at end,
      trial_started_at = case when p_plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored') then coalesce(trial_started_at, now()) else trial_started_at end,
      plan_renews_at = case when p_plan = 'free' then null else now() + make_interval(months => v_period) end,
      payment_method = case when p_plan = 'clinic_sponsored' then 'Clinic-sponsored' else payment_method end
    where id = p_user;

    if v_delta <> 0 then
      insert into public.subscription_events (user_id, event_type, mrr_delta_idr, cancel_reason, occurred_at)
      values (
        p_user,
        case when u.plan = 'free' or u.plan = 'trial' then 'new'
             when p_plan = 'free' then 'churn'
             when v_delta > 0 then 'upgrade' else 'downgrade' end::public.subscription_event_type,
        v_delta,
        case when p_plan = 'free' then 'other' end::public.cancel_reason,
        now());
    end if;
  else
    update public.app_users set pending_plan = p_plan, pending_plan_at = plan_renews_at where id = p_user;
  end if;

  if nullif(trim(coalesce(p_promo, '')), '') is not null and q -> 'promo' is not null then
    update public.promo_codes set used_count = used_count + 1 where code = upper(trim(p_promo));
  end if;

  insert into public.plan_changes (user_id, from_plan, to_plan, promo_code, apply_when, refund_idr, refund_method, reason, ticket_ref, changed_by)
  values (p_user, u.plan, p_plan, case when q -> 'promo' is not null then upper(trim(p_promo)) end, p_when, v_refund, p_refund_as,
    v_reason, nullif(trim(coalesce(p_ticket, '')), ''), (select auth.uid()));

  perform analytics_private.write_audit('user.change_plan', analytics_private.user_ref(p_user), jsonb_build_object(
    'from', u.plan, 'to', p_plan, 'when', p_when, 'refund_idr', v_refund, 'refund_as', p_refund_as,
    'promo', p_promo, 'ticket', p_ticket, 'notify_user', p_notify, 'reason', v_reason));

  return q;
end;
$$;

create function public.admin_grant_plus(p_user_ids uuid[], p_reason text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text;
  v_count integer := 0;
  r record;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin', 'support_agent']::public.admin_role[]);
  v_reason := analytics_private.require_reason(p_reason);

  for r in select id, plan from public.app_users where id = any (p_user_ids) and plan in ('free', 'trial') loop
    update public.app_users set
      plan = 'plus_monthly', paid_at = coalesce(paid_at, now()),
      trial_started_at = coalesce(trial_started_at, now()),
      plan_renews_at = now() + interval '1 month', payment_method = 'Granted by admin'
    where id = r.id;
    insert into public.subscription_events (user_id, event_type, mrr_delta_idr, occurred_at)
    values (r.id, 'new', 49000, now());
    insert into public.plan_changes (user_id, from_plan, to_plan, apply_when, reason, changed_by)
    values (r.id, r.plan, 'plus_monthly', 'immediately', v_reason, (select auth.uid()));
    v_count := v_count + 1;
  end loop;

  perform analytics_private.write_audit('users.grant_plus', 'users:' || v_count, jsonb_build_object('reason', v_reason, 'count', v_count));
  return v_count;
end;
$$;
