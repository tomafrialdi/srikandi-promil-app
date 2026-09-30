import { Badge, Card } from '../../../../shared/ui'
import { formatIdr, formatNumber } from '../../../../shared/lib/format'
import type { SubscriptionsOverview } from '../../types'
import styles from './overview.module.css'

type Plan = SubscriptionsOverview['plans'][number]

function per(plan: Plan): string {
  if (plan.plan === 'clinic_sponsored') return 'paid by partner clinic'
  const unit = plan.period_months >= 12 ? 'year' : 'month'
  return `/ ${unit}${plan.savings ? ` · ${plan.savings.toLowerCase()}` : ''}`
}

export function PlansRow({ plans, onEdit }: { plans: Plan[]; onEdit: (plan: string) => void }) {
  return (
    <div className={styles.plans}>
      {plans.map((plan) => {
        const popular = plan.badge === 'Most popular'
        return (
          <button
            key={plan.plan}
            type="button"
            className={`${styles.plan} ${popular ? styles.planPopular : ''}`}
            onClick={() => onEdit(plan.plan)}
            aria-label={`Edit ${plan.label}`}
          >
            <span className={styles.planHead}>
              <span className={styles.planName}>{plan.label}</span>
              {plan.badge && (
                <Badge tone={popular ? 'primary' : plan.plan === 'clinic_sponsored' ? 'info' : 'success'}>
                  {plan.plan === 'clinic_sponsored' && plan.clinics ? `${plan.badge} · ${plan.clinics} clinics` : plan.badge}
                </Badge>
              )}
            </span>
            <span className={styles.planPrice}>
              <span className={styles.planAmount}>{formatIdr(plan.price_idr)}</span>
              <span className={styles.planPer}>{per(plan)}</span>
            </span>
            <span className={styles.planSubs}>{formatNumber(plan.subscribers)} subs</span>
          </button>
        )
      })}
    </div>
  )
}

export function PlanCardSkeleton() {
  return <Card>Loading…</Card>
}
