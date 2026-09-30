-- Subscriptions: promo helpers + promo-aware plan change quote.

create function analytics_private.promo_status(
  p_status text, p_starts timestamptz, p_ends timestamptz, p_used integer, p_max integer
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_status = 'draft' then 'draft'
    when p_status = 'paused' then 'paused'
    when p_ends is not null and p_ends < now() then 'expired'
    when p_starts is not null and p_starts > now() then 'scheduled'
    when p_max is not null and p_used >= p_max then 'limit_reached'
    else 'active'
  end
$$;

create function analytics_private.promo_offer(
  p_type text, p_pct integer, p_fixed integer, p_duration_kind text, p_months integer, p_trial_extend integer
)
returns text
language sql
stable
set search_path = ''
as $$
  select case p_type
    when 'percentage' then p_pct || '% off' || case p_duration_kind when 'first_billing' then ' first billing' when 'months' then ' · ' || p_months || ' months' else ' · every renewal' end
    when 'fixed' then 'Rp ' || replace(to_char(coalesce(p_fixed, 0), 'FM999G999G999'), ',', '.') || ' off'
    when 'extend_trial' then 'Trial 7 → ' || (7 + coalesce(p_trial_extend, 0)) || ' days'
    else '100% · ' || p_months || ' months'
  end
$$;

create function analytics_private.promo_valid_label(p_starts timestamptz, p_ends timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_ends is null or p_ends > now() + interval '20 years' then 'Always on'
    when p_starts is null then 'Until ' || to_char(p_ends at time zone 'Asia/Jakarta', 'FMDD Mon')
    else to_char(p_starts at time zone 'Asia/Jakarta', 'FMDD Mon') || ' – ' || to_char(p_ends at time zone 'Asia/Jakarta', 'FMDD Mon')
  end
$$;

-- Same quote as before, but promo validity now follows status / schedule / limits and the plans list.
create or replace function analytics_private.plan_change_quote(p_user uuid, p_plan public.plan_type, p_promo text, p_when text)
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

  v_list := case when tgt.plan = 'clinic_sponsored' then (select price_idr from public.plan_catalog where plan = 'plus_yearly') else tgt.price_idr end;

  if nullif(trim(coalesce(p_promo, '')), '') is not null then
    select * into pr from public.promo_codes where code = upper(trim(p_promo));
    if pr.code is null then
      v_promo_error := 'Unknown promo code';
    elsif analytics_private.promo_status(pr.status, pr.starts_at, pr.ends_at, pr.used_count, pr.max_uses) <> 'active' then
      v_promo_error := 'Promo code is not active';
    elsif not (tgt.plan = any (pr.plans) or tgt.plan = pr.sponsor_plan) then
      v_promo_error := 'Promo code does not apply to this plan';
    else
      v_discount := case pr.discount_type
        when 'fixed' then least(v_list, coalesce(pr.fixed_amount_idr, 0))
        when 'extend_trial' then 0
        else least(round(v_list * pr.discount_pct / 100.0)::int, coalesce(pr.max_discount_idr, 2147483647)) end;
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
      'code', pr.code, 'description', pr.description, 'audience', pr.audience, 'used', pr.used_count, 'max', coalesce(pr.max_uses, 0),
      'valid_until', to_char(coalesce(pr.ends_at, now()), 'DD Mon YYYY')) end,
    'promo_error', v_promo_error,
    'lines', v_lines,
    'apply_when', p_when,
    'due_now', greatest(v_total, 0),
    'refund', greatest(-v_total, 0),
    'needs_approval', greatest(-v_total, 0) > 500000,
    'valid_promos', (select coalesce(jsonb_agg(code order by code), '[]'::jsonb) from public.promo_codes c
                     where analytics_private.promo_status(c.status, c.starts_at, c.ends_at, c.used_count, c.max_uses) = 'active'
                       and c.code <> coalesce(pr.code, '') and (p_plan = any (c.plans) or p_plan = c.sponsor_plan))
  );
end;
$$;
