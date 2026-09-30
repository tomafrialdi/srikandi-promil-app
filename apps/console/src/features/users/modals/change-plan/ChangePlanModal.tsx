import { Crown, Warning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Button, Field, Modal, ModalFooter, ModalSection, Notice, RadioCard, SelectField, TextField, ToggleRow } from '../../../../shared/ui'
import { formatIdr } from '../../../../shared/lib/format'
import { changePlan, fetchPlanCatalog, fetchPlanQuote } from '../../services/users.service'
import type { PlanCatalogItem, PlanQuote } from '../../types'
import styles from './ChangePlan.module.css'

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
          info={quote?.needs_approval ? 'This refund is above Rp 500.000 and needs an Admin' : 'Refunds > Rp 500.000 need Admin approval'}
        >
          <Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>{submitting ? 'Saving…' : 'Confirm change'}</Button>
        </ModalFooter>
      }
    >
      {error && (
        <Notice tone="error" icon={<Warning size={16} />}>
          {error}
        </Notice>
      )}

      {current && (
        <div className={styles.current}>
          <div className={styles.currentHead}>
            <strong>Current: {current.label}</strong>
            <Badge tone={current.active ? 'success' : 'warning'}>{current.active ? 'Active' : 'Suspended'}</Badge>
          </div>
          <span className={styles.muted}>
            {current.price_idr > 0
              ? `Paid ${formatIdr(current.price_idr)}${current.payment ? ` via ${current.payment}` : ''} · renews ${current.renews ?? '—'} · ${current.days_left} days left`
              : 'No paid subscription'}
          </span>
        </div>
      )}

      <ModalSection label="New plan">
        <div className={styles.plans}>
          {catalog.map((item) => (
            <RadioCard
              key={item.plan}
              name="new-plan"
              selected={plan === item.plan}
              disabled={item.plan === currentPlan}
              onSelect={() => setPlan(item.plan)}
              title={item.label}
              description={item.plan === 'clinic_sponsored' ? item.tagline : `${priceLabel(item)} · ${item.tagline}`}
              badge={item.plan === currentPlan ? <Badge tone="neutral">Current</Badge> : item.plan === 'clinic_sponsored' ? <Badge tone="info">Recommended</Badge> : undefined}
            />
          ))}
        </div>
      </ModalSection>

      <ModalSection label="Promo code">
        {promoOk && quote?.promo ? (
          <div className={styles.promoApplied}>
            <div className={styles.currentHead}>
              <strong>{quote.promo.code}</strong>
              <button type="button" className={styles.link} onClick={() => { setPromo(''); setPromoInput('') }}>Remove</button>
            </div>
            <span>Code applied · {quote.promo.description}</span>
            <span className={styles.muted}>
              {quote.promo.audience} · {quote.promo.used} / {quote.promo.max} used · valid until {quote.promo.valid_until}
            </span>
          </div>
        ) : (
          <div className={styles.promoRow}>
            <TextField
              id="promo-code"
              label=""
              hideLabel
              placeholder="Enter a promo code"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            />
            <Button variant="outline" onClick={() => setPromo(promoInput.trim())} disabled={!promoInput.trim() || !plan}>Apply</Button>
          </div>
        )}
        {promo && quote?.promo_error && (
          <Notice tone="error" icon={<Warning size={16} />}>{quote.promo_error}</Notice>
        )}
        {quote && quote.valid_promos.length > 0 && !promoOk && (
          <div className={styles.suggestions}>
            <span className={styles.muted}>Valid codes:</span>
            {quote.valid_promos.map((code) => (
              <button key={code} type="button" className={styles.suggestion} onClick={() => { setPromoInput(code); setPromo(code) }}>
                {code}
              </button>
            ))}
          </div>
        )}
      </ModalSection>

      <ModalSection label="When to apply">
        <div className={styles.two}>
          <RadioCard
            name="apply-when"
            selected={when === 'immediately'}
            onSelect={() => setWhen('immediately')}
            title="Immediately"
            description="Unused paid time is credited (prorated)"
          />
          <RadioCard
            name="apply-when"
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
          <div className={styles.breakdown}>
            {quote.lines.map((line) => (
              <div key={line.label} className={styles.line}>
                <span>{line.label}</span>
                <span>{line.amount < 0 ? `− ${formatIdr(-line.amount)}` : formatIdr(line.amount)}</span>
              </div>
            ))}
            <div className={styles.totals}>
              <div>
                <span className={styles.muted}>Due now</span>
                <strong className={styles.total}>{formatIdr(quote.due_now)}</strong>
              </div>
              <div>
                <span className={styles.muted}>Refund to user</span>
                <strong className={styles.total}>{formatIdr(quote.refund)}</strong>
              </div>
            </div>
            {quote.refund > 0 && (
              <div className={styles.two}>
                <RadioCard name="refund-as" selected={refundAs === 'original'} onSelect={() => setRefundAs('original')} title={refundLabel} description="Refund as original payment" />
                <RadioCard name="refund-as" selected={refundAs === 'credit'} onSelect={() => setRefundAs('credit')} title="Account credit" description="Refund as account credit" />
              </div>
            )}
          </div>
        </ModalSection>
      )}

      <ModalSection label="Reason & notification">
        <div className={styles.two}>
          <Field label="Reason" htmlFor="plan-reason">
            <SelectField id="plan-reason" value={reason} options={REASONS} onChange={setReason} />
          </Field>
          <Field label="Ticket / reference" htmlFor="plan-ticket">
            <TextField id="plan-ticket" label="" hideLabel placeholder="e.g. TCK-4833" value={ticket} onChange={(e) => setTicket(e.target.value)} />
          </Field>
        </div>
        <ToggleRow label="Notify user (email + push)" title="Notify user (email + push)" description={message || 'Choose a plan to preview the message'} checked={notify} onChange={setNotify} />
      </ModalSection>
    </Modal>
  )
}
