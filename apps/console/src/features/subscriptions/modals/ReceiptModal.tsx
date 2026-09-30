import { FlowerLotus, Printer, Receipt as ReceiptIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Modal, ModalFooter, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { formatIdr } from '../../../shared/lib/format'
import { CHANNEL_LABEL, TX_STATUS } from '../config/labels'
import { fetchReceipt, issueRefund } from '../services/subscriptions.service'
import type { Receipt } from '../types'
import styles from './Receipt.module.css'

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
        {!data && !current?.error && <p className={styles.state}>Loading…</p>}
        {data && (
          <>
            <article className={styles.paper} data-print-area>
              <header className={styles.paperHead}>
                <div className={styles.company}>
                  <span className={styles.logo}><FlowerLotus size={20} weight="fill" color="var(--primary)" /></span>
                  <div>
                    <strong>PT Srikandi Sehat Indonesia</strong>
                    <p>Jl. Kemang Raya No. 18, Jakarta Selatan 12730</p>
                    <p>NPWP 01.234.567.8-015.000</p>
                  </div>
                </div>
                <div className={styles.invoiceTitle}>
                  <span className={styles.big}>INVOICE</span>
                  <span className={styles.muted}>{data.invoice}</span>
                  {status && <Badge tone={status.tone}>{status.label.toUpperCase()}</Badge>}
                </div>
              </header>

              <div className={styles.meta}>
                <div>
                  <span className={styles.label}>BILLED TO</span>
                  <strong>{data.user.name}</strong>
                  <p>{data.user.email}</p>
                  <p>User ID {data.user.ref}</p>
                </div>
                <dl className={styles.dates}>
                  <div><dt>Invoice date</dt><dd>{data.invoice_date}</dd></div>
                  <div><dt>Paid on</dt><dd>{data.paid_on ?? '—'}</dd></div>
                  <div><dt>Payment method</dt><dd>{data.payment_method}</dd></div>
                </dl>
              </div>

              <table className={styles.items}>
                <thead>
                  <tr><th>DESCRIPTION</th><th>QTY</th><th className={styles.right}>AMOUNT</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Srikandi Plus · {data.plan_label.replace('Plus ', '')}</strong><span className={styles.muted}>Period {data.period}</span></td>
                    <td>1</td>
                    <td className={styles.right}>{formatIdr(data.list_amount_idr)}</td>
                  </tr>
                  {data.promo && data.discount_idr > 0 && (
                    <tr className={styles.promoRow}>
                      <td><strong>Promo {data.promo.code}</strong><span className={styles.muted}>{data.promo.label}</span></td>
                      <td />
                      <td className={styles.right}>− {formatIdr(data.discount_idr)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <dl className={styles.totals}>
                <div><dt>Subtotal</dt><dd>{formatIdr(data.amount_idr)}</dd></div>
                <div><dt>PPN 11% (included)</dt><dd>{formatIdr(data.ppn_idr)}</dd></div>
                <div className={styles.grand}><dt>Total paid</dt><dd>{formatIdr(data.amount_idr)}</dd></div>
              </dl>
              <p className={styles.note}>Thank you for choosing Srikandi Plus. This is a computer-generated invoice and requires no signature.</p>
            </article>

            <div className={styles.admin} data-no-print>
              <section className={styles.panel}>
                <h3 className={styles.panelTitle}>Admin only · settlement</h3>
                <dl className={styles.kv}>
                  <div><dt>Gateway fee{data.fee_pct != null ? ` (${data.fee_pct}%)` : ''}</dt><dd>{formatIdr(data.fee_idr)}</dd></div>
                  <div><dt>Net to merchant</dt><dd>{formatIdr(data.net_idr)}</dd></div>
                  <div><dt>Settlement</dt><dd>{data.settlement}</dd></div>
                  {data.refund_reason && <div><dt>Refund reason</dt><dd>{data.refund_reason}</dd></div>}
                </dl>
              </section>
              <section className={styles.panel}>
                <h3 className={styles.panelTitle}>Timeline</h3>
                <ol className={styles.timeline}>
                  {data.timeline.map((step) => (
                    <li key={`${step.time}-${step.text}`}><span className={styles.time}>{step.time}</span>{step.text}</li>
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
