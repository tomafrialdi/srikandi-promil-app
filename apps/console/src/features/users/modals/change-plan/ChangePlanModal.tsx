import { Buildings, CalendarBlank, CheckCircle, Crown, Scroll, SealCheck, Ticket, User, Warning, Check, type Icon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Button, Field, Modal, ModalFooter, ModalSection, Notice, RadioCard, Segmented, SelectField, TextField, ToggleRow } from '../../../../shared/ui'
import { cn } from '../../../../shared/lib/cn'
import { formatIdr } from '../../../../shared/lib/format'
import { changePlan, fetchPlanCatalog, fetchPlanQuote } from '../../services/users.service'
import type { PlanCatalogItem, PlanQuote } from '../../types'

const REASONS = ['Clinic partnership enrolment', 'Customer request', 'Billing correction', 'Goodwill gesture', 'Fraud / chargeback', 'Other']
  .map((r) => ({ value: r, label: r }))

interface ChangePlanModalProps {
  open: boolean
  onClose: () => void
  userId: string
  userName: string
  userRef: string
  onChanged: () => void
}

const PLAN_ICON: Record<string, Icon> = { free: User, plus_monthly: CalendarBlank, plus_yearly: Crown, clinic_sponsored: Buildings }
const FIELD = 'h-[34px] rounded-lg'

function priceLabel(plan: PlanCatalogItem): string {
  if (plan.plan === 'clinic_sponsored') return 'Rp 0 · 12 months'
  if (plan.price_idr === 0) return 'Rp 0'
  return `${formatIdr(plan.price_idr)} / ${plan.period_months >= 12 ? 'yr' : 'mo'}`
}

/** Change a user's plan: pick plan, apply promo, choose timing, see the price breakdown, confirm. */
export function ChangePlanModal({ open, onClose, userId, userName, userRef, onChanged }: ChangePlanModalProps) {
  const [catalog, setCatalog] = useState<PlanCatalogItem[]>([])
  const [plan, setPlan] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState('')
  const [when, setWhen] = useState<'immediately' | 'next_renewal'>('immediately')
  const [refundAs, setRefundAs] = useState<'original' | 'credit'>('original')
  const [reason, setReason] = useState(REASONS[0]!.value)
  const [ticket, setTicket] = useState('')
  const [notify, setNotify] = useState(true)
  const [quote, setQuote] = useState<PlanQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || catalog.length > 0) return
    let cancelled = false
    fetchPlanCatalog()
      .then((items) => !cancelled && setCatalog(items))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load plans.'))
    return () => {
      cancelled = true
    }
  }, [open, catalog.length])

  // Live price breakdown from the backend whenever the choices change.
  useEffect(() => {
    if (!open || !plan) return
    let cancelled = false
    const id = window.setTimeout(() => {
      fetchPlanQuote(userId, plan, promo, when)
        .then((q) => {
          if (cancelled) return
          setQuote(q)
          setQuoteError(null)
        })
        .catch((err: unknown) => !cancelled && setQuoteError(err instanceof Error ? err.message : 'Could not calculate the price.'))
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [open, userId, plan, promo, when])

  const reset = () => {
    setPlan('')
    setPromo('')
    setPromoInput('')
    setWhen('immediately')
    setTicket('')
    setQuote(null)
    setQuoteError(null)
    setError(null)
  }

  const close = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const current = quote?.current
  const currentPlan = current?.plan
  const promoOk = Boolean(promo) && quote?.promo != null
  const canSubmit = plan !== '' && quote != null && !quote.promo_error && !submitting && plan !== currentPlan

  const refundLabel = current?.payment ?? 'original payment'
  const message =
    quote && plan
      ? `“Your plan is now ${quote.target.label}${quote.refund > 0 ? ` — ${formatIdr(quote.refund)} refunded to ${refundAs === 'credit' ? 'your account credit' : refundLabel}` : ''}.”`
      : ''

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await changePlan({
        userId,
        plan,
        promo,
        when,
        refundAs: refundAs === 'credit' ? 'account_credit' : 'original_payment',
        reason,
        ticket,
        notify,
      })
      reset()
      onClose()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the plan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      icon={<Crown size={20} />}
      title={`Change plan · ${userName}`}
      subtitle={`${userRef} · changes are logged and the user is notified`}
      footer={
        <ModalFooter
          info={<span className="inline-flex items-center gap-1.5"><Scroll size={14} className="text-ink-faint" />{quote?.needs_approval ? 'This refund is above Rp 500.000 and needs an Admin' : 'Refunds > Rp 500.000 need Admin approval'}</span>}
        >
          <Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit} leadingIcon={<Check size={16} weight="bold" color="#fff" />}>{submitting ? 'Saving…' : 'Confirm change'}</Button>
        </ModalFooter>
      }
    >
      {error && (
        <Notice tone="error" icon={<Warning size={16} />}>
          {error}
        </Notice>
      )}

      {current && (
        <div className="flex shrink-0 items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
          <span className="inline-flex size-9 flex-none items-center justify-center rounded-[10px] bg-primary-soft text-primary"><Crown size={16} /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-2 text-13 font-extrabold">
              Current: {current.label}
              <Badge tone={current.active ? 'success' : 'warning'}>{current.active ? 'Active' : 'Suspended'}</Badge>
            </span>
            <span className="text-12 font-medium text-ink-muted">
              {current.price_idr > 0
                ? `Paid ${formatIdr(current.price_idr)}${current.payment ? ` via ${current.payment}` : ''} · renews ${current.renews ?? '—'} · ${current.days_left} days left`
                : 'No paid subscription'}
            </span>
          </div>
        </div>
      )}

      <ModalSection label="New plan">
        <div className="grid gap-2.5 min-[701px]:grid-cols-2">
          {catalog.map((item) => {
            const Glyph = PLAN_ICON[item.plan] ?? Crown
            const selected = plan === item.plan
            const isCurrent = item.plan === currentPlan
            return (
              <label key={item.plan} className={cn('relative flex items-center gap-3 rounded-xl border px-3.5 py-3', selected ? 'border-primary bg-primary-soft' : 'border-border bg-card', isCurrent ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
                <input type="radio" className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0" name="new-plan" checked={selected} disabled={isCurrent} onChange={() => setPlan(item.plan)} />
                <span className={cn('inline-flex size-[34px] flex-none items-center justify-center rounded-[9px]', selected ? 'bg-card text-primary' : 'bg-surface-alt text-ink-muted')}><Glyph size={16} /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-13 font-bold">
                    {item.label}
                    {isCurrent ? <Badge tone="neutral">Current</Badge> : item.plan === 'clinic_sponsored' ? <Badge tone="info">Recommended</Badge> : null}
                  </span>
                  <span className="text-12 font-bold">{priceLabel(item)}</span>
                  <span className="text-11 font-medium text-ink-muted">{isCurrent ? 'Current plan' : item.tagline}</span>
                </span>
                <span className={cn('size-[18px] flex-none rounded-full bg-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary', selected ? 'border-[5px] border-primary' : 'border-[1.5px] border-border')} aria-hidden="true" />
              </label>
            )
          })}
        </div>
      </ModalSection>

      <ModalSection label="Promo code">
        {promoOk && quote?.promo ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex h-[38px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-success bg-card px-3">
                <Ticket size={16} className="flex-none text-success" />
                <span className="min-w-0 flex-1 truncate text-14 font-bold">{quote.promo.code}</span>
                <CheckCircle size={16} weight="fill" className="flex-none text-success" />
              </div>
              <Button variant="outline" className="h-9 !py-0" onClick={() => { setPromo(''); setPromoInput('') }}>Remove</Button>
            </div>
            <div className="flex items-start gap-2.5 rounded-[10px] bg-success-soft px-3.5 py-3 text-success">
              <SealCheck size={16} weight="fill" className="mt-0.5 flex-none" />
              <div className="flex min-w-0 flex-col gap-px">
                <span className="text-12 font-bold">Code applied · {quote.promo.description}</span>
                <span className="text-11 font-medium">{quote.promo.audience} · {quote.promo.used} / {quote.promo.max} used · valid until {quote.promo.valid_until}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-start gap-2.5">
            <TextField compact id="promo-code" label="" hideLabel placeholder="Enter a promo code" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} />
            <Button variant="outline" className="h-10 !py-0" onClick={() => setPromo(promoInput.trim())} disabled={!promoInput.trim() || !plan}>Apply</Button>
          </div>
        )}
        {promo && quote?.promo_error && (
          <Notice tone="error" icon={<Warning size={16} />}>{quote.promo_error}</Notice>
        )}
        {quote && quote.valid_promos.filter((code) => code !== promo).length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-11 font-semibold text-ink-faint">{promoOk ? 'Other valid codes for this user:' : 'Valid codes:'}</span>
            {quote.valid_promos.filter((code) => code !== promo).map((code) => (
              <button key={code} type="button" className="rounded-md bg-surface-alt px-2 py-[3px] text-11 font-bold text-ink-muted" onClick={() => { setPromoInput(code); setPromo(code) }}>
                {code}
              </button>
            ))}
          </div>
        )}
      </ModalSection>

      <ModalSection label="When to apply">
        <div className="grid gap-2.5 min-[701px]:grid-cols-2">
          <RadioCard
            name="apply-when"
            leading
            selected={when === 'immediately'}
            onSelect={() => setWhen('immediately')}
            title="Immediately"
            description="Unused paid time is credited (prorated)"
          />
          <RadioCard
            name="apply-when"
            leading
            selected={when === 'next_renewal'}
            onSelect={() => setWhen('next_renewal')}
            title="At next renewal"
            description={`${current?.renews ?? '—'} · no refund needed`}
          />
        </div>
      </ModalSection>

      {quoteError && <Notice tone="error" icon={<Warning size={16} />}>{quoteError}</Notice>}

      {quote && plan && !quote.promo_error && (
        <ModalSection label="Price breakdown">
          <div className="flex shrink-0 flex-col gap-2.5 rounded-xl bg-surface p-4">
            {quote.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-3 text-12">
                <span className="font-medium text-ink-muted">{line.label}</span>
                <span className={cn('font-bold', line.amount < 0 && 'text-success')}>{line.amount < 0 ? `− ${formatIdr(-line.amount)}` : formatIdr(line.amount)}</span>
              </div>
            ))}
            <div className="border-t border-border" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-13 font-extrabold">Due now</span>
              <span className="text-16 font-extrabold">{formatIdr(quote.due_now)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-13 font-extrabold">Refund to user</span>
              <span className="text-16 font-extrabold text-secondary">{formatIdr(quote.refund)}</span>
            </div>
          </div>
          {quote.refund > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-12 font-bold">Refund as</span>
              <Segmented size="lg" label="Refund method" value={refundAs} options={[{ value: 'original', label: refundLabel }, { value: 'credit', label: 'Account credit' }]} onChange={setRefundAs} />
            </div>
          )}
        </ModalSection>
      )}

      <ModalSection label="Reason & notification">
        <div className="grid gap-2.5 min-[701px]:grid-cols-2">
          <Field label="Reason" htmlFor="plan-reason">
            <SelectField id="plan-reason" triggerClassName={FIELD} value={reason} options={REASONS} onChange={setReason} />
          </Field>
          <Field label="Ticket / reference" htmlFor="plan-ticket">
            <TextField dense id="plan-ticket" label="" hideLabel placeholder="e.g. TCK-4833" value={ticket} onChange={(e) => setTicket(e.target.value)} />
          </Field>
        </div>
        <ToggleRow size="md" label="Notify user (email + push)" title={<span className="font-semibold">Notify user (email + push)</span>} description={message || 'Choose a plan to preview the message'} checked={notify} onChange={setNotify} />
      </ModalSection>
    </Modal>
  )
}
