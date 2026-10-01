import { Flask, Info, Pulse, Scan, Snowflake, Stethoscope, Syringe, Trash, Plus, type Icon } from '@phosphor-icons/react'
import { ChipToggleGroup, Field, ModalSection, SelectField, TextField, Toggle } from '../../../../shared/ui'
import { INSURERS, PAYMENTS, REPORT_PERIODS } from '../../config/labels'
import type { ServiceItem } from '../../types'
import type { StepProps } from './shared'

const ICON: Record<string, Icon> = { stethoscope: Stethoscope, scan: Scan, syringe: Syringe, flask: Flask, snowflake: Snowflake }
const fmt = (n: number) => (n ? new Intl.NumberFormat('id-ID').format(n) : '')
const digits = (v: string) => Math.min(1_000_000_000, Number(v.replace(/\D/g, '')) || 0)

export function ServicesStep({ form, set }: StepProps) {
  const setSvc = (i: number, patch: Partial<ServiceItem>) => set({ services: form.services.map((s, x) => (x === i ? { ...s, ...patch } : s)) })
  const bpjsOn = form.payments.some((p) => p.startsWith('BPJS'))
  const pct = (key: 'iui_pct' | 'ivf_pct', v: string) => set({ [key]: v.replace(/[^\d.]/g, '').slice(0, 5) } as Partial<typeof form>)

  return (
    <>
      <ModalSection label="Services & price ranges" action={<button type="button" className="inline-flex items-center gap-1 text-12 font-bold text-primary" onClick={() => set({ services: [...form.services, { label: '', icon: 'stethoscope', price_min: 0, price_max: 0, bpjs: false, listed: true }] })}><Plus size={12} weight="bold" /> Add service</button>}>
        <div className="shrink-0 overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_56px_56px_28px] items-center gap-3 bg-surface px-3.5 py-3 text-10 font-extrabold text-ink-faint uppercase">
              <span>Service</span><span>Price range (Rp)</span><span>BPJS</span><span>Listed</span><span />
            </div>
            {form.services.map((s, i) => {
              const Glyph = ICON[s.icon] ?? Pulse
              return (
                <div key={i} className={`grid min-h-[54px] grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_56px_56px_28px] items-center gap-3 border-t border-border px-3.5 py-2.5 ${s.listed ? '' : 'opacity-60'}`}>
                  <span className="flex items-center gap-2.5"><Glyph size={16} className="flex-none text-ink-muted" /><input aria-label="Service name" className="min-w-0 flex-1 border-0 bg-transparent text-13 font-semibold outline-0 placeholder:text-ink-faint" placeholder="Service name" maxLength={80} value={s.label} onChange={(e) => setSvc(i, { label: e.target.value })} /></span>
                  <span className="flex h-[34px] items-center gap-1.5 rounded-[10px] border border-border bg-card px-2.5 text-13 font-semibold focus-within:border-primary">
                    <input aria-label={`${s.label} minimum price`} inputMode="numeric" placeholder="0" className="min-w-0 flex-1 border-0 bg-transparent text-right outline-0" value={fmt(s.price_min)} onChange={(e) => setSvc(i, { price_min: digits(e.target.value) })} />
                    <span className="text-ink-faint">–</span>
                    <input aria-label={`${s.label} maximum price`} inputMode="numeric" placeholder="0" className="min-w-0 flex-1 border-0 bg-transparent text-right outline-0" value={fmt(s.price_max)} onChange={(e) => setSvc(i, { price_max: digits(e.target.value) })} />
                  </span>
                  <Toggle size="md" label={`${s.label} BPJS`} checked={s.bpjs} disabled={!bpjsOn} onChange={(bpjs) => setSvc(i, { bpjs })} />
                  <Toggle size="md" label={`${s.label} listed`} checked={s.listed} onChange={(listed) => setSvc(i, { listed })} />
                  <button type="button" aria-label="Remove service" className="inline-flex size-7 items-center justify-center text-ink-faint hover:text-error" onClick={() => set({ services: form.services.filter((_, x) => x !== i) })}><Trash size={14} /></button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-[10px] bg-warning-soft px-3.5 py-3 text-12 font-semibold text-warning-ink"><Info size={16} className="mt-px flex-none" />Prices are shown to users as estimates with “last updated” date. Clinics must refresh them every 6 months.{!bpjsOn && ' Turn on “BPJS Kesehatan” below to mark services as BPJS-covered.'}</div>
      </ModalSection>

      <ModalSection label="Payment & insurance">
        <Field label="Accepted"><ChipToggleGroup label="Accepted payments" options={PAYMENTS} selected={form.payments} onChange={(payments) => set({ payments })} /></Field>
        <Field label="Insurance partners"><ChipToggleGroup label="Insurance partners" options={INSURERS} selected={form.insurers} onChange={(insurers) => set({ insurers })} /></Field>
      </ModalSection>

      <ModalSection label="Program success rates (optional)">
        <div className="grid gap-3.5 min-[701px]:grid-cols-3">
          <Field label="IUI clinical pregnancy / cycle" hint="self-reported"><TextField compact id="cw-iui" label="" hideLabel inputMode="decimal" placeholder="14" trailing={<span className="text-ink-faint">%</span>} value={form.iui_pct} onChange={(e) => pct('iui_pct', e.target.value)} /></Field>
          <Field label="IVF clinical pregnancy / transfer" hint="self-reported"><TextField compact id="cw-ivf" label="" hideLabel inputMode="decimal" placeholder="41" trailing={<span className="text-ink-faint">%</span>} value={form.ivf_pct} onChange={(e) => pct('ivf_pct', e.target.value)} /></Field>
          <Field label="Reporting period"><SelectField triggerClassName="h-10 rounded-[10px]" aria-label="Reporting period" value={form.period} options={REPORT_PERIODS} onChange={(period) => set({ period })} /></Field>
        </div>
        <p className="m-0 text-11 font-medium text-ink-faint">Shown only after medical team verification. Never used in ads.</p>
      </ModalSection>
    </>
  )
}
