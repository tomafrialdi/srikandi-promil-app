import { Warning } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Button, CheckRow, Field, Modal, ModalFooter, ModalSection, Notice, RadioCard, SelectField, Segmented, TextField, useToast } from '../../../shared/ui'
import { formatIdr, formatIdrSigned, formatNumber } from '../../../shared/lib/format'
import { fetchPlanEditor, reviewPlanRequest, savePlan } from '../services/subscriptions.service'
import type { EditablePlan, PlanEditor } from '../types'
import styles from './Forms.module.css'

interface PlanForm {
  label: string
  billing: string
  trial: string
  grace: string
  price: string
  google: string
  apple: string
  badge: string
  savings: string
  features: EditablePlan['features']
  migrate: boolean
}

const BILLING = [{ value: 'Every month', label: 'Every month' }, { value: 'Every 12 months', label: 'Every 12 months' }]
const TRIAL = ['0', '3', '7', '14'].map((d) => ({ value: d, label: d === '0' ? 'No trial' : `${d} days` }))
const GRACE = ['0', '3', '7'].map((d) => ({ value: d, label: d === '0' ? 'None' : `${d} days` }))

const digits = (value: string) => value.replace(/\D/g, '')
const toNumber = (value: string) => (value === '' ? null : Number(value))
const money = (value: string) => (value === '' ? '' : new Intl.NumberFormat('id-ID').format(Number(value)))

function toForm(plan: EditablePlan): PlanForm {
  return {
    label: plan.label,
    billing: plan.billing_label ?? 'Every month',
    trial: String(plan.trial_days),
    grace: String(plan.grace_days),
    price: String(plan.price_idr),
    google: plan.price_google_idr != null ? String(plan.price_google_idr) : '',
    apple: plan.price_apple_idr != null ? String(plan.price_apple_idr) : '',
    badge: plan.badge_label ?? '',
    savings: plan.savings_label ?? '',
    features: plan.features,
    migrate: false,
  }
}

interface EditPlanModalProps {
  open: boolean
  /** Plan to show first. */
  initialPlan: string
  onClose: () => void
  onSaved: () => void
}

export function EditPlanModal({ open, initialPlan, onClose, onSaved }: EditPlanModalProps) {
  const toast = useToast()
  const [editor, setEditor] = useState<PlanEditor>()
  const [forms, setForms] = useState<Record<string, PlanForm>>({})
  const [active, setActive] = useState(initialPlan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetchPlanEditor()
      .then((data) => {
        if (cancelled) return
        setEditor(data)
        setForms(Object.fromEntries(data.plans.map((p) => [p.plan, toForm(p)])))
        setActive(initialPlan)
      })
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load plans.'))
    return () => {
      cancelled = true
    }
  }, [open, initialPlan])

  const plan = editor?.plans.find((p) => p.plan === active)
  const form = forms[active]
  const monthly = editor?.plans.find((p) => p.plan === 'plus_monthly')

  const change = useMemo(() => {
    if (!plan || !form) return null
    const price = Number(form.price || 0)
    const pct = plan.price_idr > 0 ? ((price - plan.price_idr) / plan.price_idr) * 100 : 0
    const channelChanged = toNumber(form.google) !== plan.price_google_idr || toNumber(form.apple) !== plan.price_apple_idr
    return { changed: price !== plan.price_idr || channelChanged, pct, price }
  }, [plan, form])

  if (!open) return null

  const patch = (next: Partial<PlanForm>) => setForms((all) => ({ ...all, [active]: { ...all[active]!, ...next } }))

  const perMonth = (price: number, months: number) => price / months
  const migrateImpact =
    plan && form && change && form.migrate
      ? plan.subscribers * (perMonth(change.price, plan.period_months) - perMonth(plan.price_idr, plan.period_months))
      : 0

  const close = () => {
    if (saving) return
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (!plan || !form) return
    setSaving(true)
    setError(null)
    try {
      const result = await savePlan(
        plan.plan,
        {
          label: form.label,
          billing_label: form.billing,
          trial_days: Number(form.trial),
          grace_days: Number(form.grace),
          price_idr: Number(form.price || 0),
          price_google_idr: toNumber(form.google),
          price_apple_idr: toNumber(form.apple),
          badge_label: form.badge,
          savings_label: form.savings,
          features: form.features,
        },
        form.migrate,
      )
      toast(
        result.status === 'pending'
          ? { title: 'Approval requested', description: 'The new price goes live after a Super admin approves it.' }
          : { title: 'Plan updated' },
      )
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the plan.')
    } finally {
      setSaving(false)
    }
  }

  const review = async (approve: boolean) => {
    if (!plan?.pending_request) return
    setSaving(true)
    try {
      await reviewPlanRequest(plan.pending_request.id, approve)
      toast({ title: approve ? 'Price change approved' : 'Price change rejected' })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review the request.')
    } finally {
      setSaving(false)
    }
  }

  const yearlyNote =
    plan && form && plan.period_months >= 12 && monthly
      ? `Equivalent to ${formatIdr(Math.round(Number(form.price || 0) / plan.period_months))} / month — ${Math.round(
          (1 - Number(form.price || 0) / plan.period_months / monthly.price_idr) * 100,
        )}% cheaper than ${monthly.label} (${formatIdr(monthly.price_idr)}).`
      : null

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="Edit plans"
      subtitle="Changes to pricing need Finance approval before going live."
      footer={
        <ModalFooter info={plan ? `Last changed ${plan.updated_at}` : undefined}>
          <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !plan || !form?.label.trim()}>
            {saving ? 'Saving…' : change?.changed ? 'Request approval' : 'Save changes'}
          </Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      {!plan && !error && <p className={styles.state}>Loading…</p>}

      {plan && form && editor && (
        <>
          <Segmented
            label="Plan"
            value={active}
            onChange={setActive}
            options={editor.plans.map((p) => ({ value: p.plan, label: p.label }))}
          />

          {plan.pending_request && (
            <Notice tone="warning" icon={<Warning size={16} />}>
              A price change for this plan is waiting for approval.
              {editor.my_role === 'super_admin' && (
                <span className={styles.inlineActions}>
                  <button type="button" onClick={() => review(true)} disabled={saving}>Approve</button>
                  <button type="button" onClick={() => review(false)} disabled={saving}>Reject</button>
                </span>
              )}
            </Notice>
          )}

          <ModalSection label="Plan details">
            <div className={styles.grid}>
              <Field label="Display name" htmlFor="plan-name" required>
                <TextField id="plan-name" label="" hideLabel value={form.label} onChange={(e) => patch({ label: e.target.value })} />
              </Field>
              <Field label="Plan ID" htmlFor="plan-id">
                <TextField id="plan-id" label="" hideLabel value={plan.plan_id ?? ''} readOnly disabled />
              </Field>
              <Field label="Billing period" htmlFor="plan-billing">
                <SelectField id="plan-billing" value={form.billing} options={BILLING} onChange={(billing) => patch({ billing })} />
              </Field>
              <Field label="Free trial" htmlFor="plan-trial">
                <SelectField id="plan-trial" value={form.trial} options={TRIAL} onChange={(trial) => patch({ trial })} />
              </Field>
              <Field label="Grace period" htmlFor="plan-grace">
                <SelectField id="plan-grace" value={form.grace} options={GRACE} onChange={(grace) => patch({ grace })} />
              </Field>
            </div>
          </ModalSection>

          <ModalSection label="Pricing by channel">
            <div className={styles.grid3}>
              <Field label="Midtrans (GoPay, QRIS, OVO, card)" htmlFor="price-midtrans">
                <div className={styles.money}><span>Rp</span>
                  <input id="price-midtrans" inputMode="numeric" value={money(form.price)} onChange={(e) => patch({ price: digits(e.target.value) })} />
                </div>
              </Field>
              <Field label="Google Play" htmlFor="price-google">
                <div className={styles.money}><span>Rp</span>
                  <input id="price-google" inputMode="numeric" value={money(form.google)} onChange={(e) => patch({ google: digits(e.target.value) })} />
                </div>
                {plan.google_tier && <small className={styles.hint}>tier: {plan.google_tier}</small>}
              </Field>
              <Field label="Apple App Store" htmlFor="price-apple">
                <div className={styles.money}><span>Rp</span>
                  <input id="price-apple" inputMode="numeric" value={money(form.apple)} onChange={(e) => patch({ apple: digits(e.target.value) })} />
                </div>
                {plan.apple_tier && <small className={styles.hint}>{plan.apple_tier}</small>}
              </Field>
            </div>
            {yearlyNote && <div className={styles.success}>{yearlyNote}</div>}
          </ModalSection>

          <ModalSection label="Included features">
            <div className={styles.features}>
              {form.features.map((feature, index) => (
                <CheckRow
                  key={feature.label}
                  title={feature.label}
                  checked={feature.included}
                  onChange={(included) => patch({ features: form.features.map((f, i) => (i === index ? { ...f, included } : f)) })}
                />
              ))}
            </div>
          </ModalSection>

          <ModalSection label="Display">
            <div className={styles.grid}>
              <Field label="Badge label" htmlFor="plan-badge">
                <TextField id="plan-badge" label="" hideLabel value={form.badge} onChange={(e) => patch({ badge: e.target.value })} />
              </Field>
              <Field label="Savings label" htmlFor="plan-savings">
                <TextField id="plan-savings" label="" hideLabel value={form.savings} onChange={(e) => patch({ savings: e.target.value })} />
              </Field>
            </div>
          </ModalSection>

          <ModalSection label="When price changes">
            <div className={styles.stack}>
              <RadioCard
                name="price-scope"
                selected={!form.migrate}
                onSelect={() => patch({ migrate: false })}
                title="New subscribers only"
                description={`Existing ${formatNumber(plan.subscribers)} subscribers keep their current price until they cancel.`}
              />
              <RadioCard
                name="price-scope"
                selected={form.migrate}
                onSelect={() => patch({ migrate: true })}
                title="Migrate existing subscribers at next renewal"
                description="Users are notified 30 days before (required by app stores). Expect higher churn."
              />
            </div>
            <div className={styles.impact}>
              <Impact label="Active subscribers" value={formatNumber(plan.subscribers)} />
              <Impact label="Price change" value={change?.changed && change.pct !== 0 ? `${change.pct > 0 ? '+' : ''}${change.pct.toFixed(1)}%` : 'none'} />
              <Impact label="Projected MRR impact" value={migrateImpact === 0 ? 'Rp 0' : formatIdrSigned(Math.round(migrateImpact))} />
              <Impact label="Approval" value={change?.changed ? `Finance · ${plan.approver ?? 'Super admin'}` : 'Not required'} />
            </div>
          </ModalSection>
        </>
      )}
    </Modal>
  )
}

function Impact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.impactItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
