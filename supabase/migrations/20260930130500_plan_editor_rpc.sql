-- Subscriptions › edit plans (price changes need approval).

create function public.admin_plan_editor()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return jsonb_build_object(
    'my_role', analytics_private.console_role(),
    'plans', (
      select jsonb_agg(jsonb_build_object(
        'plan', c.plan, 'label', c.label, 'plan_id', c.plan_id, 'billing_label', c.billing_label,
        'trial_days', c.trial_days, 'grace_days', c.grace_days, 'price_idr', c.price_idr,
        'price_google_idr', c.price_google_idr, 'price_apple_idr', c.price_apple_idr,
        'google_tier', c.google_tier, 'apple_tier', c.apple_tier, 'period_months', c.period_months,
        'badge_label', c.badge_label, 'savings_label', c.savings_label, 'features', c.features,
        'subscribers', (select count(*) from public.app_users u where u.plan = c.plan),
        'updated_at', to_char(c.updated_at at time zone 'Asia/Jakarta', 'DD Mon YYYY'),
        'pending_request', (select jsonb_build_object('id', r.id, 'payload', r.payload, 'migrate', r.migrate_existing)
                            from public.plan_change_requests r where r.plan = c.plan and r.status = 'pending' order by r.id desc limit 1),
        'approver', (select full_name from public.admin_profiles where role = 'super_admin' and is_active order by created_at limit 1)
      ) order by c.sort_order)
      from public.plan_catalog c where c.plan in ('plus_monthly', 'plus_yearly', 'clinic_sponsored')
    )
  );
end;
$$;

create function public.admin_save_plan(p_plan public.plan_type, p_payload jsonb, p_migrate boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c public.plan_catalog;
  v_price_changed boolean;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);

  select * into c from public.plan_catalog where plan = p_plan;
  if c.plan is null then
    raise exception 'unknown plan' using errcode = '22023';
  end if;
  if coalesce(trim(p_payload ->> 'label'), '') = '' then
    raise exception 'Display name is required' using errcode = '22023';
  end if;

  v_price_changed :=
    coalesce((p_payload ->> 'price_idr')::int, c.price_idr) <> c.price_idr
    or coalesce((p_payload ->> 'price_google_idr')::int, c.price_google_idr) is distinct from c.price_google_idr
    or coalesce((p_payload ->> 'price_apple_idr')::int, c.price_apple_idr) is distinct from c.price_apple_idr;

  -- Non-price fields go live immediately.
  update public.plan_catalog set
    label = trim(p_payload ->> 'label'),
    billing_label = coalesce(p_payload ->> 'billing_label', billing_label),
    trial_days = coalesce((p_payload ->> 'trial_days')::int, trial_days),
    grace_days = coalesce((p_payload ->> 'grace_days')::int, grace_days),
    badge_label = nullif(p_payload ->> 'badge_label', ''),
    savings_label = nullif(p_payload ->> 'savings_label', ''),
    features = coalesce(p_payload -> 'features', features),
    updated_at = now()
  where plan = p_plan;

  if v_price_changed then
    insert into public.plan_change_requests (plan, payload, migrate_existing, requested_by)
    values (p_plan, p_payload, p_migrate, (select auth.uid()));
    perform analytics_private.write_audit('plan.price_request', p_plan::text, jsonb_build_object('migrate_existing', p_migrate));
    return jsonb_build_object('status', 'pending');
  end if;

  perform analytics_private.write_audit('plan.update', p_plan::text);
  return jsonb_build_object('status', 'applied');
end;
$$;

create function public.admin_review_plan_request(p_id bigint, p_approve boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.plan_change_requests;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin']::public.admin_role[]);

  select * into r from public.plan_change_requests where id = p_id and status = 'pending' for update;
  if r.id is null then
    raise exception 'request not found or already reviewed' using errcode = 'P0002';
  end if;

  if p_approve then
    update public.plan_catalog set
      price_idr = coalesce((r.payload ->> 'price_idr')::int, price_idr),
      price_google_idr = coalesce((r.payload ->> 'price_google_idr')::int, price_google_idr),
      price_apple_idr = coalesce((r.payload ->> 'price_apple_idr')::int, price_apple_idr),
      google_tier = coalesce(r.payload ->> 'google_tier', google_tier),
      apple_tier = coalesce(r.payload ->> 'apple_tier', apple_tier),
      updated_at = now()
    where plan = r.plan;
  end if;

  update public.plan_change_requests set
    status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_id;

  perform analytics_private.write_audit(case when p_approve then 'plan.price_approved' else 'plan.price_rejected' end, r.plan::text);
end;
$$;
