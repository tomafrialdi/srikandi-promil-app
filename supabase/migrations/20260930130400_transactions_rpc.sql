-- Subscriptions › transactions and receipts.

create function public.admin_transactions_summary(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days integer := p_to - p_from + 1;
  v_result jsonb;
begin
  perform public.assert_console_admin();

  with cur as (
    select * from public.transactions
    where created_at >= analytics_private.jkt(p_from) and created_at < analytics_private.jkt(p_to + 1)
  ),
  prev as (
    select * from public.transactions
    where created_at >= analytics_private.jkt(p_from - v_days) and created_at < analytics_private.jkt(p_from)
  )
  select jsonb_build_object(
    'gross', (select coalesce(sum(amount_idr) filter (where status in ('paid', 'refunded', 'refund_requested')), 0) from cur),
    'gross_delta_pct', analytics_private.pct(
      (select coalesce(sum(amount_idr) filter (where status in ('paid', 'refunded', 'refund_requested')), 0) from cur)
      - (select coalesce(sum(amount_idr) filter (where status in ('paid', 'refunded', 'refund_requested')), 0) from prev),
      (select coalesce(sum(amount_idr) filter (where status in ('paid', 'refunded', 'refund_requested')), 0) from prev)),
    'net', (select coalesce(sum(net_idr), 0) from cur),
    'fees', (select coalesce(sum(fee_idr), 0) from cur),
    'refunds_amount', (select coalesce(sum(amount_idr) filter (where status = 'refunded'), 0) from cur),
    'refunds_count', (select count(*) filter (where status = 'refunded') from cur),
    'failed', (select count(*) filter (where status = 'failed') from cur),
    'counts', jsonb_build_object(
      'all', (select count(*) from cur),
      'paid', (select count(*) filter (where status in ('paid', 'sponsored')) from cur),
      'pending', (select count(*) filter (where status = 'pending') from cur),
      'failed', (select count(*) filter (where status = 'failed') from cur),
      'refunded', (select count(*) filter (where status in ('refunded', 'refund_requested')) from cur))
  ) into v_result;

  return v_result;
end;
$$;

create function public.admin_transactions_list(
  p_tab text default 'all',
  p_search text default null,
  p_from date default null,
  p_to date default null,
  p_channel public.payment_channel default null,
  p_plan public.plan_type default null,
  p_promo text default null,
  p_limit integer default 10,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  perform public.assert_console_admin();

  return (
    with filtered as (
      select t.*, u.full_name, u.email
      from public.transactions t
      join public.app_users u on u.id = t.user_id
      where (p_from is null or t.created_at >= analytics_private.jkt(p_from))
        and (p_to is null or t.created_at < analytics_private.jkt(p_to + 1))
        and (p_tab = 'all'
          or (p_tab = 'paid' and t.status in ('paid', 'sponsored'))
          or (p_tab = 'pending' and t.status = 'pending')
          or (p_tab = 'failed' and t.status = 'failed')
          or (p_tab = 'refunded' and t.status in ('refunded', 'refund_requested')))
        and (p_channel is null or t.channel = p_channel)
        and (p_plan is null or t.plan = p_plan)
        and (p_promo is null or (p_promo = 'none' and t.promo_code is null) or (p_promo = 'any' and t.promo_code is not null) or t.promo_code = p_promo)
        and (v_search is null or t.invoice_no ilike '%' || v_search || '%' or u.full_name ilike '%' || v_search || '%'
             or u.email ilike '%' || v_search || '%' or t.order_id ilike '%' || v_search || '%')
    )
    select jsonb_build_object(
      'total', (select count(*) from filtered),
      'rows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'invoice', invoice_no, 'user_id', user_id, 'name', full_name, 'email', email, 'plan', plan, 'channel', channel,
          'promo', promo_code, 'amount_idr', amount_idr, 'net_idr', net_idr, 'status', status, 'retry', retry_count, 'at', created_at
        ) order by created_at desc)
        from (select * from filtered order by created_at desc, id limit greatest(p_limit, 1) offset greatest(p_offset, 0)) page
      ), '[]'::jsonb)
    )
  );
end;
$$;

create function public.admin_transaction_receipt(p_invoice text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.transactions;
  u public.app_users;
  c public.plan_catalog;
  v_period_end timestamptz;
begin
  perform public.assert_console_admin();
  select * into t from public.transactions where invoice_no = p_invoice;
  if t.id is null then
    raise exception 'invoice not found' using errcode = 'P0002';
  end if;
  select * into u from public.app_users where id = t.user_id;
  select * into c from public.plan_catalog where plan = t.plan;
  v_period_end := t.created_at + make_interval(months => c.period_months) - interval '1 day';

  perform analytics_private.write_audit('invoice.view', p_invoice);

  return jsonb_build_object(
    'invoice', t.invoice_no, 'status', t.status, 'order_id', t.order_id, 'channel', t.channel,
    'user', jsonb_build_object('id', u.id, 'ref', analytics_private.user_ref(u.id), 'name', u.full_name, 'email', u.email),
    'invoice_date', to_char(t.created_at at time zone 'Asia/Jakarta', 'DD Mon YYYY'),
    'paid_on', case when t.paid_at is not null then to_char(t.paid_at at time zone 'Asia/Jakarta', 'DD Mon YYYY, HH24:MI') || ' WIB' end,
    'payment_method', case when t.channel in ('gopay', 'ovo_dana', 'card') then coalesce(u.payment_method, t.channel::text) else t.channel::text end,
    'plan_label', c.label,
    'period', to_char(t.created_at at time zone 'Asia/Jakarta', 'DD Mon YYYY') || ' – ' || to_char(v_period_end at time zone 'Asia/Jakarta', 'DD Mon YYYY'),
    'list_amount_idr', t.list_amount_idr, 'discount_idr', t.discount_idr, 'amount_idr', t.amount_idr,
    'promo', (select jsonb_build_object('code', p.code, 'label', analytics_private.promo_offer(p.discount_type, p.discount_pct, p.fixed_amount_idr, p.duration_kind, p.duration_months, p.trial_extend_days))
              from public.promo_codes p where p.code = t.promo_code),
    'ppn_idr', round(t.amount_idr - t.amount_idr / 1.11),
    'fee_idr', t.fee_idr, 'net_idr', t.net_idr,
    'fee_pct', case when t.amount_idr > 0 then round(100.0 * t.fee_idr / t.amount_idr, 1) end,
    'settlement', to_char(t.settlement_on, 'DD Mon YYYY') || ' · BCA',
    'retry', t.retry_count, 'refund_reason', t.refund_reason,
    'timeline', jsonb_build_array(
      jsonb_build_object('time', to_char((t.created_at - interval '1 minute') at time zone 'Asia/Jakarta', 'HH24:MI'), 'text', 'Checkout created'),
      jsonb_build_object('time', to_char(coalesce(t.paid_at, t.created_at) at time zone 'Asia/Jakarta', 'HH24:MI'),
        'text', case t.status when 'failed' then 'Payment failed · retry ' || t.retry_count || '/3' when 'pending' then 'Awaiting payment' else 'Payment captured' end)
    ) || case when t.status in ('paid', 'refunded', 'refund_requested', 'sponsored') then jsonb_build_array(
      jsonb_build_object('time', to_char((t.paid_at + interval '1 minute') at time zone 'Asia/Jakarta', 'HH24:MI'), 'text', 'Receipt emailed'),
      jsonb_build_object('time', to_char((t.paid_at + interval '2 minutes') at time zone 'Asia/Jakarta', 'HH24:MI'), 'text', 'Plus activated')
    ) else '[]'::jsonb end || case when t.refunded_at is not null then jsonb_build_array(
      jsonb_build_object('time', to_char(t.refunded_at at time zone 'Asia/Jakarta', 'HH24:MI'), 'text', 'Refunded · ' || coalesce(t.refund_reason, ''))
    ) else '[]'::jsonb end
  );
end;
$$;

create function public.admin_issue_refund(p_invoice text, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reason text;
  t public.transactions;
begin
  perform public.assert_console_admin();
  perform analytics_private.require_role(array['super_admin', 'admin']::public.admin_role[]);
  v_reason := analytics_private.require_reason(p_reason);

  select * into t from public.transactions where invoice_no = p_invoice for update;
  if t.id is null then
    raise exception 'invoice not found' using errcode = 'P0002';
  end if;
  if t.status not in ('paid', 'refund_requested') then
    raise exception 'Only paid invoices can be refunded' using errcode = '22023';
  end if;

  update public.transactions set status = 'refunded', refund_reason = v_reason, refunded_at = now() where id = t.id;
  insert into public.other_revenue (source, amount_idr, occurred_on) values ('refund', -t.amount_idr, current_date);
  perform analytics_private.write_audit('invoice.refund', p_invoice, jsonb_build_object('reason', v_reason, 'amount_idr', t.amount_idr));
end;
$$;
