import { ArrowCounterClockwise, CheckCircle, Clock, Envelope, PencilSimple, ProhibitInset, XCircle, Check } from '@phosphor-icons/react'
import { Badge, Button, Card } from '../../../shared/ui'
import { DOCS, DOC_ORDER, TYPE, statusBadge } from '../config/labels'
import { priceRange } from '../lib/clinic-form'
import type { ClinicFull, DocStatus } from '../types'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

const DOC_LOOK: Record<DocStatus, { icon: typeof CheckCircle; cls: string; text: string }> = {
  verified: { icon: CheckCircle, cls: 'text-success', text: 'verified' },
  review: { icon: Clock, cls: 'text-warning-ink', text: 'review' },
  missing: { icon: XCircle, cls: 'text-error', text: 'missing' },
  rejected: { icon: XCircle, cls: 'text-error', text: 'rejected' },
}

interface ClinicPanelProps {
  clinic: ClinicFull
  canEdit: boolean
  busy: boolean
  onEdit: () => void
  onApprove: () => void
  onRequestDocs: () => void
  onToggleSuspend: () => void
}

export function ClinicPanel({ clinic: c, canEdit, busy, onEdit, onApprove, onRequestDocs, onToggleSuspend }: ClinicPanelProps) {
  const s = statusBadge(c.status, c.tier)
  const Glyph = TYPE[c.type].icon
  const docs: Array<{ key: string; label: string; status: DocStatus }> = []
  const byKind = new Map(c.documents.map((d) => [d.kind, d]))
  for (const kind of DOC_ORDER) {
    const d = byKind.get(kind)
    if (!d) continue
    if ((kind === 'art_licence' || kind === 'kfer_cert') && d.status === 'missing' && c.type !== 'fertility') continue
    docs.push({ key: kind, label: DOCS[kind].label, status: d.status })
    if (kind === 'operating_licence') docs.push({ key: 'str_sip', label: `STR & SIP — ${c.str_sip.doctors} doctor${c.str_sip.doctors === 1 ? '' : 's'}`, status: c.str_sip.status })
  }
  const cost = (re: RegExp) => c.services.find((x) => x.listed && re.test(x.label))
  const costs: Array<[string, ReturnType<typeof cost>]> = [['Consultation', cost(/consult/i)], ['IUI / cycle', cost(/\bIUI\b/i)], ['IVF / cycle', cost(/\bIVF\b/i)]]
  const sub = c.status === 'pending' && c.submitted_at ? `Submitted ${dateFmt.format(new Date(c.submitted_at))} · by ${c.submitted_by ?? 'clinic admin'}` : c.status === 'verified' && c.verified_at ? `Verified ${dateFmt.format(new Date(c.verified_at))}` : c.status === 'suspended' ? c.status_reason ?? 'Suspended' : c.address ?? c.city

  return (
    <Card className="gap-4 min-[1201px]:sticky min-[1201px]:top-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-16 leading-snug font-extrabold">{c.name}</h2>
          <p className="m-0 text-12 text-ink-muted">{sub}</p>
        </div>
        <Badge tone={s.tone}><span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.dot }} />{s.label}</Badge>
      </header>

      {c.photos[0] ? (
        <img src={c.photos[0]} alt="" className="h-36 w-full rounded-xl object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-xl bg-surface-alt text-ink-faint"><Glyph size={40} /></div>
      )}

      <section className="flex flex-col gap-2.5">
        <h3 className="text-13 font-bold">Documents</h3>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {docs.map((d) => {
            const look = DOC_LOOK[d.status]
            const Ico = look.icon
            return (
              <li key={d.key} className="flex items-center gap-2.5 text-12">
                <Ico size={16} className={`flex-none ${look.cls}`} />
                <span className="min-w-0 flex-1 truncate font-medium">{d.label}</span>
                <span className={`text-11 font-semibold ${look.cls}`}>{look.text}</span>
              </li>
            )
          })}
        </ul>
        {c.docs_request && <p className="m-0 rounded-lg bg-secondary-soft px-3 py-2 text-11 font-medium text-secondary">Documents requested {dateFmt.format(new Date(c.docs_request.at))} by {c.docs_request.by}.</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-13 font-bold">Program costs (self-reported)</h3>
        <dl className="m-0 flex flex-col gap-1.5 text-12">
          {costs.map(([label, svc]) => (
            <div key={label} className="flex justify-between gap-3"><dt className="text-ink-muted">{label}</dt><dd className="m-0 font-bold">{svc ? priceRange(svc.price_min, svc.price_max) : '—'}</dd></div>
          ))}
        </dl>
      </section>

      {canEdit && (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {c.status === 'pending' || c.status === 'draft' ? (
              <>
                <Button variant="outline" onClick={onRequestDocs} disabled={busy} leadingIcon={<Envelope size={16} />}>Request docs</Button>
                <Button onClick={onApprove} disabled={busy || c.status === 'draft'} title={c.status === 'draft' ? 'Submit the draft for verification first' : undefined} leadingIcon={<Check size={16} color="#fff" />}>Approve</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onEdit} leadingIcon={<PencilSimple size={16} />}>Edit clinic</Button>
                {c.status === 'suspended' ? (
                  <Button variant="outline" onClick={onToggleSuspend} disabled={busy} leadingIcon={<ArrowCounterClockwise size={16} />}>Reactivate</Button>
                ) : (
                  <Button variant="danger" onClick={onToggleSuspend} disabled={busy} leadingIcon={<ProhibitInset size={16} />}>Suspend</Button>
                )}
              </>
            )}
          </div>
          {(c.status === 'pending' || c.status === 'draft') && <button type="button" className="self-start text-12 font-bold text-primary" onClick={onEdit}>{c.status === 'draft' ? 'Continue editing the draft' : 'Edit details & documents'}</button>}
        </div>
      )}
    </Card>
  )
}
