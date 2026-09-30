import { Link } from 'react-router-dom'
import { Button } from '../../../../shared/ui'

export function SubscriptionsHeader({ onEditPlans }: { onEditPlans: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Subscriptions & revenue</h1>
        <p className="text-14 text-ink-muted">Srikandi Plus plans, payments and promotions.</p>
      </div>
      <div className="flex gap-2.5">
        <Link to="/subscriptions/promo-codes">
          <Button variant="outline">Promo codes</Button>
        </Link>
        <Button onClick={onEditPlans}>Edit plans</Button>
      </div>
    </div>
  )
}
