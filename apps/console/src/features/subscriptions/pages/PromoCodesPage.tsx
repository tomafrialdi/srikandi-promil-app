import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, PageState, useDisclosure, useToast } from '../../../shared/ui'
import { downloadCsv } from '../../../shared/lib/csv'
import { PromoDetailPanel } from '../components/promos/PromoDetailPanel'
import { PromoStats } from '../components/promos/PromoStats'
import { PromoTable } from '../components/promos/PromoTable'
import styles from '../components/promos/promos.module.css'
import { usePromoDetail, usePromos, usePromosSummary } from '../hooks/useSubscriptionsData'
import { PromoFormModal } from '../modals/PromoFormModal'
import { setPromoStatus } from '../services/subscriptions.service'
import type { PromoDetail } from '../types'

export function PromoCodesPage() {
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const summary = usePromosSummary()
  const list = usePromos(tab)
  const [selected, setSelected] = useState<string | null>(null)
  const rows = list.data
  const active = rows && rows.length > 0 ? (rows.some((r) => r.code === selected) ? selected : rows[0]!.code) : null

  const detail = usePromoDetail(active)
  const form = useDisclosure()
  const [editing, setEditing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [prefill, setPrefill] = useState<PromoDetail | null>(null)

  const refresh = () => {
    summary.reload()
    list.reload()
    detail.reload()
  }

  const openCreate = (prefill?: PromoDetail | null) => {
    setEditing(null)
    setPrefill(prefill ?? null)
    setFormKey((k) => k + 1)
    form.onOpen()
  }

  const toggle = async () => {
    if (!detail.data) return
    setBusy(true)
    try {
      await setPromoStatus(detail.data.code, detail.data.stored_status === 'paused' ? 'active' : 'paused')
      toast({ title: detail.data.stored_status === 'paused' ? 'Code resumed' : 'Code paused', description: detail.data.code })
      refresh()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not change the status', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  if (list.error && !rows) {
    return <PageState title="Couldn't load promo codes" description={list.error} action={<Button onClick={list.reload}>Try again</Button>} />
  }

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.h1}>
            <Link to="/subscriptions" className={styles.crumb}>Subscriptions</Link> / Promo codes
          </h1>
          <p className={styles.sub}>Create, schedule and monitor discount codes. App-store purchases use store offer codes.</p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="outline"
            disabled={!rows || rows.length === 0}
            onClick={() =>
              downloadCsv('promo-codes.csv', ['Code', 'Offer', 'Audience', 'Used', 'Max', 'Valid', 'Status'],
                (rows ?? []).map((r) => [r.code, r.offer, r.sub, r.used, r.max, r.valid, r.status]))
            }
          >
            Export usage
          </Button>
          <Button onClick={() => openCreate()}>Create promo code</Button>
        </div>
      </div>

      <PromoStats data={summary.data} />

      <div className={styles.split}>
        <PromoTable counts={summary.data?.counts} rows={rows} loading={list.loading} tab={tab} selected={active} onTab={setTab} onSelect={setSelected} />
        {detail.data && (
          <PromoDetailPanel
            data={detail.data}
            busy={busy}
            onToggle={toggle}
            onDuplicate={() => openCreate(detail.data)}
            onEdit={() => {
              setEditing(detail.data?.code ?? null)
              setPrefill(null)
              setFormKey((k) => k + 1)
              form.onOpen()
            }}
          />
        )}
      </div>

      <PromoFormModal
        key={formKey}
        open={form.open}
        code={editing}
        prefill={prefill}
        onClose={form.onClose}
        onSaved={(code) => {
          setSelected(code)
          refresh()
        }}
        onDuplicate={(d) => {
          form.onClose()
          window.setTimeout(() => openCreate(d), 0)
        }}
      />
    </>
  )
}
