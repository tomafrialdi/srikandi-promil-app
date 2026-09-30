import { useState } from 'react'
import { Button, PageState, useDisclosure } from '../../../shared/ui'
import { CodeUsageCard } from '../components/overview/CodeUsageCard'
import { MrrChartCard } from '../components/overview/MrrChartCard'
import { OverviewKpis } from '../components/overview/OverviewKpis'
import { PaymentMixCard } from '../components/overview/PaymentMixCard'
import { PlansRow } from '../components/overview/PlansRow'
import { PromoCodesCard } from '../components/overview/PromoCodesCard'
import { RecentTransactionsCard } from '../components/overview/RecentTransactionsCard'
import { SubscriptionsHeader } from '../components/overview/SubscriptionsHeader'
import { useOverview } from '../hooks/useSubscriptionsData'
import { EditPlanModal } from '../modals/EditPlanModal'
import { ReceiptModal } from '../modals/ReceiptModal'

export function SubscriptionsPage() {
  const { data, error, loading, reload } = useOverview()
  const editPlans = useDisclosure()
  const [planKey, setPlanKey] = useState('plus_yearly')
  const [invoice, setInvoice] = useState<string | null>(null)

  if (error && !data) {
    return <PageState title="Couldn't load subscriptions" description={error} action={<Button onClick={reload}>Try again</Button>} />
  }
  if (!data) return <PageState title={loading ? 'Loading…' : 'No data'} />

  const edit = (plan: string) => {
    setPlanKey(plan)
    editPlans.onOpen()
  }

  return (
    <>
      <SubscriptionsHeader onEditPlans={() => edit('plus_yearly')} />
      <OverviewKpis data={data.kpis} />
      <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
        <MrrChartCard data={data.mrr_chart} />
        <PaymentMixCard data={data.payment_mix} />
      </div>
      <PlansRow plans={data.plans} onEdit={edit} />
      <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
        <PromoCodesCard data={data.promos} />
        <CodeUsageCard data={data.code_usage} />
      </div>
      <RecentTransactionsCard data={data.recent_transactions} onOpen={setInvoice} />

      <EditPlanModal open={editPlans.open} initialPlan={planKey} onClose={editPlans.onClose} onSaved={reload} />
      <ReceiptModal invoice={invoice} onClose={() => setInvoice(null)} onChanged={reload} />
    </>
  )
}
