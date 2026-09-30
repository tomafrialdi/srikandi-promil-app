import { Card, CardHeader, DataTable, type Column } from '../../../../shared/ui'
import { formatIdr, formatIdrCompact, formatNumber, formatPercent } from '../../../../shared/lib/format'
import { CHANNEL_COLOR, CHANNEL_LABEL } from '../../config/labels'
import type { AcquisitionData } from '../../types'
import styles from './AcquisitionTab.module.css'

type Row = AcquisitionData['channels'][number]

const COLUMNS: Column<Row>[] = [
  {
    key: 'channel',
    header: 'CHANNEL',
    render: (r) => (
      <strong className={styles.channelName}>
        <span className={styles.dot} style={{ background: CHANNEL_COLOR[r.channel] }} />
        {CHANNEL_LABEL[r.channel]}
      </strong>
    ),
  },
  { key: 'installs', header: 'INSTALLS', width: 90, render: (r) => formatNumber(r.installs) },
  { key: 'signup', header: 'SIGN-UP %', width: 90, render: (r) => formatPercent(r.signup_pct, 0) },
  { key: 'trial', header: 'TRIAL %', width: 90, render: (r) => formatPercent(r.trial_pct, 0) },
  { key: 'paid', header: 'PAID %', width: 90, render: (r) => formatPercent(r.paid_pct) },
  { key: 'spend', header: 'SPEND', width: 100, render: (r) => (r.spend_idr ? formatIdrCompact(r.spend_idr) : 'Rp 0') },
  { key: 'cac', header: 'CAC', width: 100, render: (r) => formatIdr(r.cac_idr ?? 0) },
  {
    key: 'ltv',
    header: 'LTV : CAC',
    width: 90,
    render: (r) =>
      r.ltv_cac == null ? (
        '∞'
      ) : (
        <span className={r.ltv_cac >= 3 ? styles.good : styles.warn}>{`${r.ltv_cac}×`}</span>
      ),
  },
]

export function ChannelsTable({ data }: { data: AcquisitionData['channels'] }) {
  return (
    <Card>
      <CardHeader
        title="Channel performance"
        subtitle="Selected range · sign-up / trial / paid are % of signed-up users · CAC = spend per paying user"
      />
      <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.channel} rowHeight={50} />
    </Card>
  )
}
