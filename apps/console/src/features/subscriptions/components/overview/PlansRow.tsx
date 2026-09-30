import { Badge, Card } from '../../../../shared/ui'
import { formatIdr, formatNumber } from '../../../../shared/lib/format'
import type { SubscriptionsOverview } from '../../types'
import { cn } from '../../../../shared/lib/cn'

type Plan = SubscriptionsOverview['plans'][number]

function per(plan: Plan): string {
  if (plan.plan === 'clinic_sponsored') return 'paid by partner clinic'
  const unit = plan.period_months >= 12 ? 'year' : 'month'
  return `/ ${unit}${plan.savings ? ` · ${plan.savings.toLowerCase()}` : ''}`
}

export function PlansRow({ plans, onEdit }: { plans: Plan[]; onEdit: (plan: string) => void }) {
  return (
    <div className="grid gap-4 min-[1101px]:grid-cols-3">
      {plans.map((plan) => {
        const popular = plan.badge === 'Most popular'
        return (
          <button
            key={plan.plan}
            type="button"
            className={cn('flex cursor-pointer flex-col gap-2.5 rounded-card border bg-card p-5 text-left hover:border-ink-faint', popular ? 'border-primary shadow-[inset_0_0_0_1px_var(--primary)]' : 'border-border')}
            onClick={() => onEdit(plan.plan)}
            aria-label={`Edit ${plan.label}`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-15 font-bold">{plan.label}</span>
              {plan.badge && (
                <Badge tone={popular ? 'primary' : plan.plan === 'clinic_sponsored' ? 'info' : 'success'}>
                  {plan.plan === 'clinic_sponsored' && plan.clinics ? `${plan.badge} · ${plan.clinics} clinics` : plan.badge}
                </Badge>
              )}
            </span>
            <span className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-24 font-extrabold">{formatIdr(plan.price_idr)}</span>
              <span className="text-12 text-ink-muted">{per(plan)}</span>
            </span>
            <span className="text-12 text-ink-muted">{formatNumber(plan.subscribers)} subs</span>
          </button>
        )
      })}
    </div>
  )
}

export function PlanCardSkeleton() {
  return <Card>Loading…</Card>
}
