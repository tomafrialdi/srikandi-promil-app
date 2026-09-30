import { Warning } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import {
  Button, Field, Modal, ModalFooter, ModalSection, Notice, RadioCard, SelectField, Segmented, TextAreaField, TextField, ToggleRow, useToast,
} from '../../../shared/ui'
import { formatIdr, formatIdrCompact, formatNumber } from '../../../shared/lib/format'
import { fetchPlanEditor, fetchPromoDetail, savePromo, setPromoStatus } from '../services/subscriptions.service'
import type { DiscountType, PromoDetail } from '../types'
import styles from './Forms.module.css'

interface PromoForm {
  code: string
  note: string
  type: DiscountType
  pct: string
  fixed: string
  trialDays: string
  duration: string
  maxDiscount: string
  plans: string[]
  channels: string[]
  eligibility: string
  maxUses: string
  perUser: string
  starts: string
  ends: string
  combinable: boolean
}

const DURATIONS = [
  { value: 'first_billing', label: 'First billing only' },
  { value: 'months:3', label: '3 months' },
  { value: 'months:12', label: '12 months' },
  { value: 'always', label: 'Every renewal' },
]
const TYPES: Array<{ value: DiscountType; label: string }> = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed amount' },
  { value: 'extend_trial', label: 'Extend trial' },
  { value: 'sponsored', label: '100% sponsored' },
]
const PLANS = [{ value: 'plus_yearly', label: 'Plus Yearly' }, { value: 'plus_monthly', label: 'Plus Monthly' }]
const CHANNELS = [{ value: 'midtrans', label: 'Midtrans (web & in-app)' }, { value: 'google_play', label: 'Google Play offer' }, { value: 'apple', label: 'Apple offer code' }]
const ELIGIBILITY = ['Public', 'New users', 'Free users', 'Lapsed subscribers (> 30d)', 'Custom segment…'].map((v) => ({ value: v, label: v }))

const digits = (v: string) => v.replace(/\D/g, '')
const iso = (local: string) => (local ? `${local}:00+07:00` : '')
const wib = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
const toLocal = (value: string | null) => (value ? wib.format(new Date(value)).replace(' ', 'T') : '')

const EMPTY: PromoForm = {
  code: '', note: '', type: 'percentage', pct: '25', fixed: '', trialDays: '7', duration: 'first_billing', maxDiscount: '',
  plans: ['plus_yearly'], channels: ['midtrans'], eligibility: 'Public', maxUses: '', perUser: '1', starts: '', ends: '', combinable: false,
}

function fromDetail(d: PromoDetail): PromoForm {
  return {
    code: d.code,
    note: d.internal_note ?? '',
    type: d.discount_type,
    pct: String(d.discount_pct),
    fixed: d.fixed_amount_idr != null ? String(d.fixed_amount_idr) : '',
    trialDays: String(d.trial_extend_days ?? 7),
    duration: d.duration_kind === 'months' ? `months:${d.duration_months}` : d.duration_kind,
    maxDiscount: d.max_discount_idr != null ? String(d.max_discount_idr) : '',
    plans: d.plans,
    channels: d.channels,
    eligibility: d.eligibility,
    maxUses: d.max_uses != null ? String(d.max_uses) : '',
    perUser: String(d.per_user_limit),
    starts: toLocal(d.starts_at),
    ends: d.ends_at && new Date(d.ends_at).getFullYear() < 2090 ? toLocal(d.ends_at) : '',
    combinable: d.combinable,
  }
}

interface PromoFormModalProps {
  open: boolean
  /** Existing code to edit; null creates a new one. */
  code: string | null
  onClose: () => void
  onSaved: (code: string) => void
  /** Switch to "create" prefilled from the code being edited. */
  onDuplicate?: (detail: PromoDetail) => void
  /** Settings to start from when creating ("Duplicate"). */
  prefill?: PromoDetail | null
}

/** Create or edit a promo code. Identity fields lock once a code has redemptions. */
export function PromoFormModal({ open, code, onClose, onSaved, onDuplicate, prefill }: PromoFormModalProps) {
  const toast = useToast()
  const editing = code !== null
  const [form, setForm] = useState<PromoForm>(() => (prefill ? { ...fromDetail(prefill), code: '', starts: '', ends: '' } : EMPTY))
  const [now] = useState(() => Date.now())
  const [detail, setDetail] = useState<PromoDetail>()
  const [prices, setPrices] = useState<Record<string, { label: string; price: number }>>({})
  const [status, setStatus] = useState<'active' | 'paused'>('active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetchPlanEditor().then((e) => {
      if (!cancelled) setPrices(Object.fromEntries(e.plans.map((p) => [p.plan, { label: p.label, price: p.price_idr }])))
    }).catch(() => undefined)
    if (code) {
      fetchPromoDetail(code)
        .then((d) => {
          if (cancelled) return
          setDetail(d)
          setForm(fromDetail(d))
          setStatus(d.stored_status === 'paused' ? 'paused' : 'active')
        })
        .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the code.'))
    }
    return () => {
      cancelled = true
    }
  }, [open, code])

  const locked = detail?.locked ?? false
  const patch = (next: Partial<PromoForm>) => setForm((f) => ({ ...f, ...next }))
  const toggle = (key: 'plans' | 'channels', value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))

  const preview = useMemo(() => {
    const plan = prices[form.plans[0] ?? 'plus_yearly']
    if (!plan) return null
    let price = plan.price
    if (form.type === 'percentage') price = Math.max(0, plan.price - Math.min(Math.round((plan.price * Number(form.pct || 0)) / 100), form.maxDiscount ? Number(form.maxDiscount) : Infinity))
    if (form.type === 'fixed') price = Math.max(0, plan.price - Number(form.fixed || 0))
    if (form.type === 'sponsored') price = 0
    return { plan, price }
  }, [prices, form])

  const scheduled = form.starts && new Date(iso(form.starts)).getTime() > now

  const submit = async (draft: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const [kind, months] = form.duration.split(':')
      const result = await savePromo({
        code: form.code,
        internal_note: form.note,
        discount_type: form.type,
        discount_pct: form.type === 'percentage' ? Number(form.pct || 0) : 0,
        fixed_amount_idr: form.type === 'fixed' ? Number(form.fixed || 0) : null,
        trial_extend_days: form.type === 'extend_trial' ? Number(form.trialDays || 0) : null,
        duration_kind: kind,
        duration_months: months ? Number(months) : form.type === 'sponsored' ? 12 : 1,
        max_discount_idr: form.maxDiscount ? Number(form.maxDiscount) : null,
        plans: form.plans,
        channels: form.channels,
        eligibility: form.eligibility,
        max_uses: form.maxUses ? Number(form.maxUses) : null,
        per_user_limit: Number(form.perUser || 1),
        starts_at: iso(form.starts),
        ends_at: iso(form.ends),
        combinable: form.combinable,
        draft,
      })
      if (editing && detail && status !== (detail.stored_status === 'paused' ? 'paused' : 'active')) {
        await setPromoStatus(result.code, status)
      }
      toast({ title: result.created ? 'Promo code created' : 'Promo code updated', description: result.code })
      onSaved(result.code)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the code.')
    } finally {
      setSaving(false)
    }
  }

  const generate = () => patch({ code: Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('') })

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="md"
      title={editing ? 'Edit promo code' : 'Create promo code'}
      subtitle={
        editing && detail
          ? `${detail.code} · created ${detail.created}${detail.created_by ? ` by ${detail.created_by}` : ''}`
          : 'Codes are case-insensitive. App Store / Google Play require a matching store offer.'
      }
      footer={
        <ModalFooter
          info={
            editing
              ? 'Changes are written to the change history'
              : scheduled
                ? `Will be Scheduled until ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso(form.starts)))}`
                : 'Will go live immediately'
          }
        >
          {editing && detail && onDuplicate && (
            <Button variant="outline" onClick={() => onDuplicate(detail)}>Duplicate</Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          {!editing && <Button variant="outline" onClick={() => submit(true)} disabled={saving || !form.code}>Save draft</Button>}
          <Button onClick={() => submit(false)} disabled={saving || !form.code}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create code'}
          </Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}

      {editing && detail && (
        <div className={styles.row2}>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatNumber(detail.used_count)} / {detail.max_uses ? formatNumber(detail.max_uses) : '∞'} used{detail.days_left != null ? ` · ${detail.days_left} days left` : ''}</span>
          <Segmented label="Status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }]} />
        </div>
      )}
      {locked && (
        <Notice tone="warning" icon={<Warning size={16} />}>
          This code has redemptions. Code, discount type and value are locked to keep past invoices consistent.
        </Notice>
      )}

      <ModalSection label={editing ? 'Code & offer' : 'Code'}>
        <div className={styles.row2}>
          <Field label="Promo code" htmlFor="promo-code" required hint="A–Z, 0–9, dash · max 16">
            <TextField id="promo-code" label="" hideLabel placeholder="e.g. HARIIBU25" maxLength={16} value={form.code} disabled={editing}
              onChange={(e) => patch({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} />
          </Field>
          {!editing && <Button variant="outline" onClick={generate}>Generate</Button>}
        </div>
        <Field label="Internal description" htmlFor="promo-note">
          <TextAreaField id="promo-note" placeholder="e.g. Mother's Day campaign — Instagram & TikTok" value={form.note} onChange={(e) => patch({ note: e.target.value })} />
        </Field>
      </ModalSection>

      <ModalSection label="Offer">
        <Field label="Discount type" required>
          <div className={styles.grid}>
            {TYPES.map((t) => (
              <RadioCard key={t.value} name="promo-type" selected={form.type === t.value} disabled={locked} onSelect={() => patch({ type: t.value })} title={t.label} />
            ))}
          </div>
        </Field>
        <div className={styles.grid}>
          {form.type === 'percentage' && (
            <Field label="Discount" htmlFor="promo-pct" required>
              <div className={styles.money}><span>%</span>
                <input id="promo-pct" inputMode="numeric" disabled={locked} value={form.pct} onChange={(e) => patch({ pct: digits(e.target.value).slice(0, 3) })} />
              </div>
            </Field>
          )}
          {form.type === 'fixed' && (
            <Field label="Discount" htmlFor="promo-fixed" required>
              <div className={styles.money}><span>Rp</span>
                <input id="promo-fixed" inputMode="numeric" disabled={locked} value={form.fixed} onChange={(e) => patch({ fixed: digits(e.target.value) })} />
              </div>
            </Field>
          )}
          {form.type === 'extend_trial' && (
            <Field label="Extra trial days" htmlFor="promo-trial" required>
              <div className={styles.money}><span>days</span>
                <input id="promo-trial" inputMode="numeric" value={form.trialDays} onChange={(e) => patch({ trialDays: digits(e.target.value).slice(0, 2) })} />
              </div>
            </Field>
          )}
          <Field label="Duration" htmlFor="promo-duration">
            <SelectField id="promo-duration" value={form.duration} options={DURATIONS} onChange={(duration) => patch({ duration })} />
          </Field>
          {form.type === 'percentage' && (
            <Field label="Max discount" htmlFor="promo-max-discount" hint="optional">
              <div className={styles.money}><span>Rp</span>
                <input id="promo-max-discount" inputMode="numeric" value={form.maxDiscount} onChange={(e) => patch({ maxDiscount: digits(e.target.value) })} />
              </div>
            </Field>
          )}
        </div>
        <Field label="Applies to plans" required>
          <div className={styles.chips}>
            {PLANS.map((p) => (
              <button key={p.value} type="button" className={styles.chip} aria-pressed={form.plans.includes(p.value)} disabled={locked} onClick={() => toggle('plans', p.value)}>{p.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Channels" required hint="Store offers are created via API">
          <div className={styles.chips}>
            {CHANNELS.map((c) => (
              <button key={c.value} type="button" className={styles.chip} aria-pressed={form.channels.includes(c.value)} onClick={() => toggle('channels', c.value)}>{c.label}</button>
            ))}
          </div>
        </Field>
      </ModalSection>

      <ModalSection label="Eligibility & limits">
        <Field label="Eligible users" htmlFor="promo-eligibility">
          <SelectField id="promo-eligibility" value={form.eligibility} options={ELIGIBILITY} onChange={(eligibility) => patch({ eligibility })} />
        </Field>
        <div className={styles.grid}>
          <Field label="Total redemptions" htmlFor="promo-max" hint="blank = unlimited">
            <TextField id="promo-max" label="" hideLabel inputMode="numeric" placeholder="500" value={form.maxUses} onChange={(e) => patch({ maxUses: digits(e.target.value) })} />
          </Field>
          <Field label="Per user" htmlFor="promo-per-user">
            <TextField id="promo-per-user" label="" hideLabel inputMode="numeric" value={form.perUser} onChange={(e) => patch({ perUser: digits(e.target.value) })} />
          </Field>
          <Field label="Starts (WIB)" htmlFor="promo-starts" required>
            <input id="promo-starts" type="datetime-local" className={styles.dateInput} value={form.starts} onChange={(e) => patch({ starts: e.target.value })} />
          </Field>
          <Field label="Ends (WIB)" htmlFor="promo-ends" hint="blank = always on">
            <input id="promo-ends" type="datetime-local" className={styles.dateInput} value={form.ends} onChange={(e) => patch({ ends: e.target.value })} />
          </Field>
        </div>
        <ToggleRow label="Combinable with other codes" title="Combinable with other codes" description="Off by default to protect margin" checked={form.combinable} onChange={(combinable) => patch({ combinable })} />
      </ModalSection>

      {preview && (
        <ModalSection label="Preview">
          <div className={styles.preview}>
            <strong>{preview.plan.label}</strong>
            {form.code && <span style={{ color: 'var(--success)', fontWeight: 700 }}>{form.code} applied</span>}
            <div className={styles.previewPrice}>
              <span className={styles.previewOld}>{formatIdr(preview.plan.price)}</span>
              <span className={styles.previewNew}>{formatIdr(preview.price)}</span>
            </div>
            <span className={styles.previewBtn}>Subscribe</span>
            <span style={{ color: 'var(--ink-muted)' }}>
              {form.type === 'extend_trial' ? `Trial extended by ${form.trialDays || 0} days.` : `${form.type === 'sponsored' ? '100%' : form.type === 'fixed' ? formatIdrCompact(Number(form.fixed || 0)) : `${form.pct || 0}%`} off ${form.duration === 'first_billing' ? 'the first billing' : 'the selected period'}. Renews at ${formatIdr(preview.plan.price)}.`}
            </span>
          </div>
        </ModalSection>
      )}

      {editing && detail && (
        <>
          <ModalSection label="Performance">
            <div className={styles.tiles}>
              <Tile label="Redemptions" value={formatNumber(detail.performance.redemptions)} />
              <Tile label="Revenue" value={formatIdrCompact(detail.performance.revenue_idr)} />
              <Tile label="Discount given" value={formatIdrCompact(detail.performance.discount_idr)} />
              <Tile label="Flagged" value={formatNumber(detail.performance.flagged)} />
            </div>
          </ModalSection>
          <ModalSection label="Change history">
            <ul className={styles.history}>
              {detail.history.map((h) => (
                <li key={`${h.at}-${h.text}`}>
                  <strong>{h.at} · {h.actor}</strong>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          </ModalSection>
        </>
      )}
    </Modal>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.tile}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
