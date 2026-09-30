-- Subscriptions › promo codes.

create function public.admin_promos_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with p as (
    select analytics_private.promo_status(status, starts_at, ends_at, used_count, max_uses) as st from public.promo_codes
  ),
  r as (
    select
      count(*) filter (where outcome = 'applied' and redeemed_at >= now() - interval '30 days') as cur,
      count(*) filter (where outcome = 'applied' and redeemed_at >= now() - interval '60 days' and redeemed_at < now() - interval '30 days') as prev,
      coalesce(sum(discount_idr) filter (where outcome = 'applied' and redeemed_at >= now() - interval '30 days'), 0) as discount,
      count(*) filter (where flagged and redeemed_at >= now() - interval '30 days') as flagged
    from public.promo_redemptions
  ),
  rev as (
    select coalesce(sum(amount_idr), 0) as amount from public.transactions
    where promo_code is not null and created_at >= now() - interval '30 days' and status in ('paid', 'refunded', 'refund_requested')
  )
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'all', (select count(*) from p),
      'active', (select count(*) from p where st in ('active', 'limit_reached')),
      'scheduled', (select count(*) from p where st = 'scheduled'),
      'paused', (select count(*) from p where st = 'paused'),
      'expired', (select count(*) from p where st = 'expired')),
    'redemptions_30d', r.cur,
    'redemptions_delta_pct', analytics_private.pct(r.cur - r.prev, r.prev, 0),
    'discount_30d', r.discount,
    'revenue_promo_users_30d', rev.amount,
    'roi', round(rev.amount::numeric / nullif(r.discount, 0), 1),
    'flagged', r.flagged
  ) into v_result
  from r, rev;

  return v_result;
end;
$$;

create function public.admin_promos_list(p_tab text default 'all')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'code', code, 'offer', offer, 'sub', sub, 'used', used_count, 'max', max_uses,
      'valid', valid, 'status', st
    ) order by array_position(array['active', 'limit_reached', 'scheduled', 'paused', 'expired', 'draft'], st), code), '[]'::jsonb)
    from (
      select c.*, analytics_private.promo_status(c.status, c.starts_at, c.ends_at, c.used_count, c.max_uses) as st,
        analytics_private.promo_offer(c.discount_type, c.discount_pct, c.fixed_amount_idr, c.duration_kind, c.duration_months, c.trial_extend_days) as offer,
        coalesce(c.audience, c.eligibility) as sub,
        analytics_private.promo_valid_label(c.starts_at, c.ends_at) as valid
      from public.promo_codes c
    ) x
    where p_tab = 'all'
       or (p_tab = 'active' and st in ('active', 'limit_reached'))
       or (p_tab = st)
  );
end;
$$;

create function public.admin_promo_detail(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.promo_codes;
  v_status text;
begin
  perform public.assert_console_admin();
  select * into c from public.promo_codes where code = upper(p_code);
  if c.code is null then
    raise exception 'promo code not found' using errcode = 'P0002';
  end if;
  v_status := analytics_private.promo_status(c.status, c.starts_at, c.ends_at, c.used_count, c.max_uses);

  return jsonb_build_object(
    'code', c.code, 'status', v_status, 'stored_status', c.status,
    'offer', analytics_private.promo_offer(c.discount_type, c.discount_pct, c.fixed_amount_idr, c.duration_kind, c.duration_months, c.trial_extend_days),
    'description', c.description, 'internal_note', c.internal_note, 'audience', c.audience,
    'discount_type', c.discount_type, 'discount_pct', c.discount_pct, 'fixed_amount_idr', c.fixed_amount_idr,
    'trial_extend_days', c.trial_extend_days, 'duration_kind', c.duration_kind, 'duration_months', c.duration_months,
    'max_discount_idr', c.max_discount_idr, 'plans', c.plans, 'channels', c.channels, 'eligibility', c.eligibility,
    'max_uses', c.max_uses, 'used_count', c.used_count, 'per_user_limit', c.per_user_limit,
    'starts_at', c.starts_at, 'ends_at', c.ends_at, 'combinable', c.combinable,
    'days_left', case when c.ends_at is not null and c.ends_at > now() and c.ends_at < now() + interval '20 years'
                      then ceil(extract(epoch from (c.ends_at - now())) / 86400) end,
    'created', to_char(c.created_at at time zone 'Asia/Jakarta', 'DD Mon'),
    'created_by', (select full_name from public.admin_profiles where id = c.created_by),
    'locked', c.used_count > 0,
    'per_day', (
      select jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'count', (
        select count(*) from public.promo_redemptions r
        where r.code = c.code and r.outcome = 'applied'
          and (r.redeemed_at at time zone 'Asia/Jakarta')::date = d)) order by d)
      from generate_series(((now() at time zone 'Asia/Jakarta')::date - 29), (now() at time zone 'Asia/Jakarta')::date, interval '1 day') g(d)
    ),
    'performance', jsonb_build_object(
      'redemptions', (select count(*) from public.promo_redemptions where code = c.code and outcome = 'applied'),
      'revenue_idr', (select coalesce(sum(amount_idr), 0) from public.transactions where promo_code = c.code and status in ('paid', 'refunded', 'refund_requested')),
      'discount_idr', (select coalesce(sum(discount_idr), 0) from public.promo_redemptions where code = c.code and outcome = 'applied'),
      'flagged', (select count(*) from public.promo_redemptions where code = c.code and flagged)
    ),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('at', to_char(at at time zone 'Asia/Jakarta', 'DD Mon'), 'actor', actor, 'text', text) order by at desc), '[]'::jsonb)
                from (select * from public.promo_history where code = c.code order by at desc limit 6) h),
    'example', (select jsonb_build_object('plan', pc.plan, 'label', pc.label, 'price_idr', pc.price_idr)
                from public.plan_catalog pc where pc.plan = coalesce(c.plans[1], c.applies_to))
  );
end;
$$;

create function public.admin_set_promo_status(p_code text, p_status text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  if p_status not in ('active', 'paused') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  update public.promo_codes set status = p_status where code = upper(p_code);
  if not found then
    raise exception 'promo code not found' using errcode = 'P0002';
  end if;
  insert into public.promo_history (code, actor, text)
  values (upper(p_code), coalesce((select full_name from public.admin_profiles where id = (select auth.uid())), 'admin'),
          case when p_status = 'paused' then 'Paused' else 'Resumed' end);
  perform analytics_private.write_audit('promo.' || p_status, upper(p_code));
end;
$$;

-- Create (new code) or update (existing code). Locked fields stay untouched once a code has redemptions.
create function public.admin_save_promo(p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(p_payload ->> 'code', '')));
  v_existing public.promo_codes;
  v_type text := coalesce(p_payload ->> 'discount_type', 'percentage');
  v_pct integer := coalesce((p_payload ->> 'discount_pct')::int, 0);
  v_plans public.plan_type[];
  v_starts timestamptz := nullif(p_payload ->> 'starts_at', '')::timestamptz;
  v_ends timestamptz := nullif(p_payload ->> 'ends_at', '')::timestamptz;
  v_max integer := nullif(p_payload ->> 'max_uses', '')::int;
  v_actor text;
  v_channels text[];
  v_status text := case when coalesce((p_payload ->> 'draft')::boolean, false) then 'draft' else 'active' end;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  v_actor := coalesce((select full_name from public.admin_profiles where id = (select auth.uid())), 'admin');

  if v_code !~ '^[A-Z0-9-]{3,16}$' then
    raise exception 'Code must be 3–16 characters: A–Z, 0–9 or dash' using errcode = '22023';
  end if;
  select * into v_existing from public.promo_codes where code = v_code;

  select coalesce(array_agg(x::public.plan_type), '{}') into v_plans from jsonb_array_elements_text(coalesce(p_payload -> 'plans', '[]')) x;
  select coalesce(array_agg(x), '{}') into v_channels from jsonb_array_elements_text(coalesce(p_payload -> 'channels', '[]')) x;

  if array_length(v_plans, 1) is null then
    raise exception 'Choose at least one plan' using errcode = '22023';
  end if;
  if array_length(v_channels, 1) is null then
    raise exception 'Choose at least one channel' using errcode = '22023';
  end if;
  if v_type = 'percentage' and (v_pct < 1 or v_pct > 100) then
    raise exception 'Discount must be between 1 and 100%%' using errcode = '22023';
  end if;
  if v_type = 'fixed' and coalesce((p_payload ->> 'fixed_amount_idr')::int, 0) <= 0 then
    raise exception 'Enter a fixed discount amount' using errcode = '22023';
  end if;
  if v_ends is not null and v_starts is not null and v_ends <= v_starts then
    raise exception 'End must be after start' using errcode = '22023';
  end if;

  if v_existing.code is null then
    insert into public.promo_codes (
      code, description, audience, discount_pct, applies_to, duration_months, max_uses, used_count, valid_until,
      discount_type, fixed_amount_idr, trial_extend_days, duration_kind, max_discount_idr, plans, channels, eligibility,
      per_user_limit, starts_at, ends_at, internal_note, combinable, status, sponsor_plan, created_by
    ) values (
      v_code,
      coalesce(nullif(p_payload ->> 'internal_note', ''), v_code),
      coalesce(p_payload ->> 'eligibility', 'Public'),
      case when v_type = 'sponsored' then 100 else v_pct end,
      v_plans[1], coalesce((p_payload ->> 'duration_months')::int, 1), v_max, 0,
      coalesce(v_ends::date, '2099-12-31'),
      v_type, nullif(p_payload ->> 'fixed_amount_idr', '')::int, nullif(p_payload ->> 'trial_extend_days', '')::int,
      coalesce(p_payload ->> 'duration_kind', 'first_billing'), nullif(p_payload ->> 'max_discount_idr', '')::int,
      v_plans, v_channels, coalesce(p_payload ->> 'eligibility', 'Public'), coalesce((p_payload ->> 'per_user_limit')::int, 1),
      v_starts, v_ends, nullif(p_payload ->> 'internal_note', ''), coalesce((p_payload ->> 'combinable')::boolean, false),
      v_status, case when v_type = 'sponsored' then 'clinic_sponsored'::public.plan_type end, (select auth.uid())
    );
    insert into public.promo_history (code, actor, text) values (v_code, v_actor, case when v_status = 'draft' then 'Saved as draft' else 'Created code' end);
    perform analytics_private.write_audit('promo.create', v_code);
    return jsonb_build_object('code', v_code, 'created', true);
  end if;

  -- Update: identity fields are locked once the code has been used.
  if v_existing.used_count > 0 and (v_type <> v_existing.discount_type or v_plans <> v_existing.plans
      or (v_type = 'percentage' and v_pct <> v_existing.discount_pct)) then
    raise exception 'This code has redemptions: discount type, value and plans are locked' using errcode = '22023';
  end if;
  if v_max is not null and v_max < v_existing.used_count then
    raise exception 'Total redemptions cannot be below the % already used', v_existing.used_count using errcode = '22023';
  end if;

  update public.promo_codes set
    description = coalesce(nullif(p_payload ->> 'internal_note', ''), description),
    internal_note = nullif(p_payload ->> 'internal_note', ''),
    max_uses = v_max,
    per_user_limit = coalesce((p_payload ->> 'per_user_limit')::int, per_user_limit),
    starts_at = coalesce(v_starts, starts_at), ends_at = v_ends,
    valid_until = coalesce(v_ends::date, '2099-12-31'),
    channels = v_channels, eligibility = coalesce(p_payload ->> 'eligibility', eligibility),
    combinable = coalesce((p_payload ->> 'combinable')::boolean, combinable),
    duration_kind = coalesce(p_payload ->> 'duration_kind', duration_kind),
    max_discount_idr = nullif(p_payload ->> 'max_discount_idr', '')::int,
    discount_type = case when v_existing.used_count > 0 then discount_type else v_type end,
    discount_pct = case when v_existing.used_count > 0 or v_type <> 'percentage' then discount_pct else v_pct end,
    plans = case when v_existing.used_count > 0 then plans else v_plans end,
    applies_to = case when v_existing.used_count > 0 then applies_to else v_plans[1] end,
    status = case when v_existing.status = 'draft' and v_status = 'active' then 'active' else v_existing.status end
  where code = v_code;

  insert into public.promo_history (code, actor, text)
  values (v_code, v_actor, 'Edited' || case when v_max is distinct from v_existing.max_uses then ' · limit ' || coalesce(v_existing.max_uses::text, '∞') || ' → ' || coalesce(v_max::text, '∞') else '' end
                        || case when v_ends is distinct from v_existing.ends_at then ' · end date changed' else '' end);
  perform analytics_private.write_audit('promo.update', v_code);
  return jsonb_build_object('code', v_code, 'created', false);
end;
$$;
