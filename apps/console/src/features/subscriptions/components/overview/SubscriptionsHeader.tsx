import { Link } from 'react-router-dom'
import { Button } from '../../../../shared/ui'
import styles from './overview.module.css'

export function SubscriptionsHeader({ onEditPlans }: { onEditPlans: () => void }) {
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <h1 className={styles.h1}>Subscriptions & revenue</h1>
        <p className={styles.sub}>Srikandi Plus plans, payments and promotions.</p>
      </div>
      <div className={styles.actions}>
        <Link to="/subscriptions/promo-codes">
          <Button variant="outline">Promo codes</Button>
        </Link>
        <Button onClick={onEditPlans}>Edit plans</Button>
      </div>
    </div>
  )
}
