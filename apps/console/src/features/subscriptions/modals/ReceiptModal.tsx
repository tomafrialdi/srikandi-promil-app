import { FlowerLotus, Printer, Receipt as ReceiptIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Modal, ModalFooter, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { formatIdr } from '../../../shared/lib/format'
import { CHANNEL_LABEL, TX_STATUS } from '../config/labels'
import { fetchReceipt, issueRefund } from '../services/subscriptions.service'
import type { Receipt } from '../types'

interface ReceiptModalProps {
  invoice: string | null
  onClose: () => void
  onChanged: () => void
}

/** Invoice / receipt with the admin-only settlement panel. Print or save as PDF via the browser. */
export function ReceiptModal({ invoice, onClose, onChanged }: ReceiptModalProps) {
  const toast = useToast()
  const refund = useDisclosure()
  const [loaded, setLoaded] = useState<{ invoice: string; data?: Receipt; error?: string }>()

  useEffect(() => {
    if (!invoice) return
    let cancelled = false
    fetchReceipt(invoice)
      .then((data) => !cancelled && setLoaded({ invoice, data }))
      .catch((err: unknown) => !cancelled && setLoaded({ invoice, error: err instanceof Error ? err.message : 'Could not load the invoice.' }))
    return () => {
      cancelled = true
    }
  }, [invoice])

  const current = loaded?.invoice === invoice ? loaded : undefined
  const data = current?.data

  const print = () => {
    document.body.classList.add('print-modal')
    const done = () => {
      document.body.classList.remove('print-modal')
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    window.print()
  }

  const status = data ? TX_STATUS[data.status] : null

  return (
    <>
      <Modal
        open={invoice !== null}
        onClose={onClose}
        size="lg"
        icon={<ReceiptIcon size={20} />}
        title={`Invoice ${invoice ?? ''}`}
        subtitle={data ? `Midtrans order ${data.order_id} · ${CHANNEL_LABEL[data.channel]}` : undefined}
        headerActions={
          <>
            <Button variant="outline" onClick={print} leadingIcon={<Printer size={15} />} disabled={!data}>Print</Button>
            <Button onClick={print} disabled={!data}>Download PDF</Button>
          </>
        }
        footer={
          <ModalFooter info={current?.error}>
            <Button variant="danger" onClick={refund.onOpen} disabled={!data || !['paid', 'refund_requested'].includes(data.status)}>
              Issue refund
            </Button>
            <Button variant="outline" disabled title="Receipt emails are sent by the payment gateway">Resend to email</Button>
            {data && (
              <Link to={`/users/${data.user.id}`} onClick={onClose}>
                <Button variant="outline">View user</Button>
              </Link>
            )}
          </ModalFooter>
        }
      >
        {!data && !current?.error && <p className="py-10 text-center text-13 text-ink-muted">Loading…</p>}
        {data && (
          <>
            <article className="flex flex-col gap-4.5 rounded-xl border border-border bg-white p-6" data-print-area>
              <header className="flex flex-wrap justify-between gap-4">
                <div className="flex gap-2.5 text-11 text-ink-muted [&_strong]:block [&_strong]:text-13 [&_strong]:text-ink [&_p]:m-0">
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-primary-soft"><FlowerLotus size={20} weight="fill" color="var(--primary)" /></span>
                  <div>
                    <strong>PT Srikandi Sehat Indonesia</strong>
                    <p>Jl. Kemang Raya No. 18, Jakarta Selatan 12730</p>
                    <p>NPWP 01.234.567.8-015.000</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-22 font-extrabold">INVOICE</span>
                  <span className="block text-11 text-ink-muted">{data.invoice}</span>
                  {status && <Badge tone={status.tone}>{status.label.toUpperCase()}</Badge>}
                </div>
              </header>

              <div className="flex flex-wrap justify-between gap-6 text-12 [&_p]:m-0 [&_p]:text-ink-muted [&_strong]:text-14">
                <div>
                  <span className="mb-1 block text-10 font-bold text-ink-faint">BILLED TO</span>
                  <strong>{data.user.name}</strong>
                  <p>{data.user.email}</p>
                  <p>User ID {data.user.ref}</p>
                </div>
                <dl className="m-0 flex flex-col gap-1 [&_div]:flex [&_div]:justify-between [&_div]:gap-6 [&_dt]:text-ink-muted [&_dd]:m-0 [&_dd]:font-bold">
                  <div><dt>Invoice date</dt><dd>{data.invoice_date}</dd></div>
                  <div><dt>Paid on</dt><dd>{data.paid_on ?? '—'}</dd></div>
                  <div><dt>Payment method</dt><dd>{data.payment_method}</dd></div>
                </dl>
              </div>

              <table className="w-full border-collapse text-13 [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:text-left [&_th]:text-10 [&_th]:font-bold [&_th]:text-ink-faint [&_td]:border-b [&_td]:border-border [&_td]:py-3 [&_td]:align-top [&_td_strong]:block">
                <thead>
                  <tr><th>DESCRIPTION</th><th>QTY</th><th className="text-right!">AMOUNT</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Srikandi Plus · {data.plan_label.replace('Plus ', '')}</strong><span className="block text-11 text-ink-muted">Period {data.period}</span></td>
                    <td>1</td>
                    <td className="text-right!">{formatIdr(data.list_amount_idr)}</td>
                  </tr>
                  {data.promo && data.discount_idr > 0 && (
                    <tr className="text-success">
                      <td><strong>Promo {data.promo.code}</strong><span className="block text-11 text-ink-muted">{data.promo.label}</span></td>
                      <td />
                      <td className="text-right!">− {formatIdr(data.discount_idr)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <dl className="m-0 flex w-65 flex-col gap-1.5 self-end text-12 [&_div]:flex [&_div]:justify-between [&_dt]:text-ink-muted [&_dd]:m-0 [&_dd]:font-bold">
                <div><dt>Subtotal</dt><dd>{formatIdr(data.amount_idr)}</dd></div>
                <div><dt>PPN 11% (included)</dt><dd>{formatIdr(data.ppn_idr)}</dd></div>
                <div className="border-t border-border pt-2 text-14 [&_dt]:font-extrabold [&_dt]:text-ink [&_dd]:font-extrabold [&_dd]:text-ink"><dt>Total paid</dt><dd>{formatIdr(data.amount_idr)}</dd></div>
              </dl>
              <p className="text-11 text-ink-faint">Thank you for choosing Srikandi Plus. This is a computer-generated invoice and requires no signature.</p>
            </article>

            <div className="grid gap-3.5 min-[701px]:grid-cols-2" data-no-print>
              <section className="rounded-xl border border-border bg-surface p-3.5">
                <h3 className="mb-2 text-12 font-extrabold">Admin only · settlement</h3>
                <dl className="m-0 flex flex-col gap-1.5 text-12 [&_div]:flex [&_div]:justify-between [&_div]:gap-3 [&_dt]:text-ink-muted [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-bold">
                  <div><dt>Gateway fee{data.fee_pct != null ? ` (${data.fee_pct}%)` : ''}</dt><dd>{formatIdr(data.fee_idr)}</dd></div>
                  <div><dt>Net to merchant</dt><dd>{formatIdr(data.net_idr)}</dd></div>
                  <div><dt>Settlement</dt><dd>{data.settlement}</dd></div>
                  {data.refund_reason && <div><dt>Refund reason</dt><dd>{data.refund_reason}</dd></div>}
                </dl>
              </section>
              <section className="rounded-xl border border-border bg-surface p-3.5">
                <h3 className="mb-2 text-12 font-extrabold">Timeline</h3>
                <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-12">
                  {data.timeline.map((step) => (
                    <li key={`${step.time}-${step.text}`}><span className="inline-block w-11 text-ink-faint">{step.time}</span>{step.text}</li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </Modal>

      <ReasonDialog
        open={refund.open}
        onClose={refund.onClose}
        title={`Refund ${invoice ?? ''}`}
        description={data ? `${formatIdr(data.amount_idr)} will be refunded to the customer. This is logged and cannot be undone.` : undefined}
        confirmLabel="Issue refund"
        tone="danger"
        onConfirm={async (reason) => {
          if (!invoice) return
          await issueRefund(invoice, reason)
          toast({ title: 'Refund issued', description: invoice })
          setLoaded(undefined)
          onChanged()
          onClose()
        }}
      />
    </>
  )
}
