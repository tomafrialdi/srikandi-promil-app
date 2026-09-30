import { AppleLogo, ClockCounterClockwise, Crown, DeviceMobile, Lock, PaperPlaneTilt, FloppyDisk, SealPercent, Wallet, Warning } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Button, CheckRow, Field, Modal, ModalFooter, ModalSection, Notice, RadioCard, SelectField, Segmented, TextField, useToast } from '../../../shared/ui'
import { formatIdr, formatIdrSigned, formatNumber } from '../../../shared/lib/format'
import { fetchPlanEditor, reviewPlanRequest, savePlan } from '../services/subscriptions.service'
import type { EditablePlan, PlanEditor } from '../types'

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
      icon={<Crown size={20} weight="fill" />}
      title="Edit plans"
      subtitle="Changes to pricing need Finance approval before going live."
      tabs={
        editor && (
          <div className="border-b border-border bg-surface px-6 py-3.5">
            <Segmented block label="Plan" value={active} onChange={setActive} options={editor.plans.map((p) => ({ value: p.plan, label: p.label }))} />
          </div>
        )
      }
      footer={
        <ModalFooter
          info={plan ? <span className="inline-flex items-center gap-1.5"><ClockCounterClockwise size={14} className="text-ink-faint" />Last changed {plan.updated_at}</span> : undefined}
        >
          <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving || !plan || !form?.label.trim()}
            leadingIcon={change?.changed ? <PaperPlaneTilt size={16} weight="fill" /> : <FloppyDisk size={16} weight="fill" />}
          >
            {saving ? 'Saving…' : change?.changed ? 'Request approval' : 'Save changes'}
          </Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      {!plan && !error && <p className="py-10 text-center text-13 text-ink-muted">Loading…</p>}

      {plan && form && editor && (
        <>
          {plan.pending_request && (
            <Notice tone="warning" icon={<Warning size={16} />}>
              A price change for this plan is waiting for approval.
              {editor.my_role === 'super_admin' && (
                <span className="ml-3 inline-flex gap-3 [&_button]:font-extrabold [&_button]:underline">
                  <button type="button" onClick={() => review(true)} disabled={saving}>Approve</button>
                  <button type="button" onClick={() => review(false)} disabled={saving}>Reject</button>
                </span>
              )}
            </Notice>
          )}

          <ModalSection label="Plan details">
            <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_220px]">
              <Field label="Display name" htmlFor="plan-name" required>
                <TextField id="plan-name" label="" hideLabel value={form.label} onChange={(e) => patch({ label: e.target.value })} />
              </Field>
              <Field label="Plan ID" htmlFor="plan-id">
                <TextField id="plan-id" label="" hideLabel value={plan.plan_id ?? ''} readOnly disabled icon={null} trailing={<Lock size={15} className="text-ink-muted" />} />
              </Field>
            </div>
            <div className="grid gap-3.5 min-[701px]:grid-cols-3">
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
            <div className="grid items-start gap-3.5 min-[701px]:grid-cols-3">
              <ChannelPrice id="price-midtrans" icon={<Wallet size={15} />} title="Midtrans (GoPay, QRIS, OVO, card)" value={form.price} onChange={(price) => patch({ price })} />
              <ChannelPrice id="price-google" icon={<DeviceMobile size={15} />} title="Google Play" value={form.google} onChange={(google) => patch({ google })} note={plan.google_tier ? `tier: ${plan.google_tier}` : undefined} />
              <ChannelPrice id="price-apple" icon={<AppleLogo size={15} weight="fill" />} title="Apple App Store" value={form.apple} onChange={(apple) => patch({ apple })} note={plan.apple_tier ?? undefined} />
            </div>
            {yearlyNote && (
              <div className="flex items-center gap-2 rounded-[10px] bg-success-soft px-3.5 py-2.5 text-12 font-semibold text-success">
                <SealPercent size={15} weight="fill" className="flex-none" />
                {yearlyNote}
              </div>
            )}
          </ModalSection>

          <ModalSection label="Included features">
            <div className="grid gap-x-5 gap-y-3 min-[701px]:grid-cols-2">
              {[form.features.slice(0, Math.ceil(form.features.length / 2)), form.features.slice(Math.ceil(form.features.length / 2))].map((column, c) => (
                <div key={c} className="flex flex-col gap-3">
                  {column.map((feature) => {
                    const index = form.features.indexOf(feature)
                    return (
                      <CheckRow
                        key={feature.label}
                        title={<span className={feature.included ? 'font-semibold' : 'font-semibold text-ink-muted'}>{feature.label}</span>}
                        checked={feature.included}
                        onChange={(included) => patch({ features: form.features.map((f, i) => (i === index ? { ...f, included } : f)) })}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </ModalSection>

          <ModalSection label="Display">
            <div className="grid gap-3.5 min-[701px]:grid-cols-2">
              <Field label="Badge label" htmlFor="plan-badge">
                <TextField id="plan-badge" label="" hideLabel value={form.badge} onChange={(e) => patch({ badge: e.target.value })} />
              </Field>
              <Field label="Savings label" htmlFor="plan-savings">
                <TextField id="plan-savings" label="" hideLabel value={form.savings} onChange={(e) => patch({ savings: e.target.value })} />
              </Field>
            </div>
          </ModalSection>

          <ModalSection label="When price changes">
            <div className="flex flex-col gap-2.5">
              <RadioCard
                name="price-scope"
                leading
                selected={!form.migrate}
                onSelect={() => patch({ migrate: false })}
                title="New subscribers only"
                description={`Existing ${formatNumber(plan.subscribers)} subscribers keep their current price until they cancel.`}
              />
              <RadioCard
                name="price-scope"
                leading
                selected={form.migrate}
                onSelect={() => patch({ migrate: true })}
                title="Migrate existing subscribers at next renewal"
                description="Users are notified 30 days before (required by app stores). Expect higher churn."
              />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface px-4 py-3.5 min-[701px]:grid-cols-4">
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
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-11 font-semibold text-ink-muted">{label}</span>
      <strong className="text-14 font-extrabold">{value}</strong>
    </div>
  )
}

/** One sales channel: tinted card with the channel icon, a Rp-prefixed price input and an optional store tier note. */
function ChannelPrice({ id, icon, title, value, onChange, note }: { id: string; icon: ReactNode; title: string; value: string; onChange: (value: string) => void; note?: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-surface p-3.5">
      <label htmlFor={id} className="flex items-start gap-2 text-12 leading-snug font-bold">
        <span className="mt-px flex-none text-ink-muted">{icon}</span>
        {title}
      </label>
      <div className="flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-3 focus-within:border-primary">
        <span className="text-13 font-semibold text-ink-faint">Rp</span>
        <input id={id} className="min-w-0 flex-1 border-0 bg-transparent text-13 font-semibold outline-0" inputMode="numeric" value={money(value)} onChange={(e) => onChange(digits(e.target.value))} />
      </div>
      {note && <small className="text-11 font-medium text-ink-faint">{note}</small>}
    </div>
  )
}
