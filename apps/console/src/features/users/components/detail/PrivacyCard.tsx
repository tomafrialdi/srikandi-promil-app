import { Badge, Button, Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

const consent = (on: boolean, yes = 'Consented', no = 'Opted out') => (
  <Badge tone={on ? 'success' : 'neutral'}>{on ? yes : no}</Badge>
)

export function PrivacyCard({ data, onUnmask }: { data: UserDetail['privacy']; onUnmask: () => void }) {
  return (
    <Card>
      <CardHeader title="Privacy & consent" subtitle="UU PDP No. 27/2022" />
      <dl className={styles.kv}>
        <div className={styles.kvRow}>
          <dt className={styles.kvLabel}>Health data processing</dt>
          <dd style={{ margin: 0 }}>{consent(data.health)}</dd>
        </div>
        <div className={styles.kvRow}>
          <dt className={styles.kvLabel}>Research (anonymised)</dt>
          <dd style={{ margin: 0 }}>{consent(data.research)}</dd>
        </div>
        <div className={styles.kvRow}>
          <dt className={styles.kvLabel}>Marketing emails</dt>
          <dd style={{ margin: 0 }}>{consent(data.marketing)}</dd>
        </div>
        <div className={styles.kvRow}>
          <dt className={styles.kvLabel}>Discreet mode</dt>
          <dd className={styles.kvValue} style={{ margin: 0 }}>{data.discreet ? 'On' : 'Off'}</dd>
        </div>
      </dl>
      <div className={styles.privacyActions}>
        <Button variant="outline" disabled title="Data export requests are not built yet">
          Export data
        </Button>
        <Button variant="outline" onClick={onUnmask}>
          Unmask (logged)
        </Button>
      </div>
    </Card>
  )
}
