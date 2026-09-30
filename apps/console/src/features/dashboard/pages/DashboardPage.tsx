import { useAuth } from '../../auth/hooks/useAuth'
import { Button, PageState } from '../../../shared/ui'
import {
  AgeCard,
  DashboardHeader,
  FeatureAdoptionCard,
  FunnelCard,
  JourneyCard,
  KpiGrid,
  LocationCard,
  NeedsAttentionCard,
  OutcomesPanel,
  PlanSplitCard,
  RecentSignupsCard,
  UserGrowthCard,
} from '../components'
import { useDashboardOverview } from '../hooks/useDashboardOverview'

export function DashboardPage() {
  const { profile } = useAuth()
  const { data, loading, error, reload } = useDashboardOverview()
  const firstName = profile?.full_name.split(' ')[0] ?? ''

  if (loading && !data) return <PageState title="Loading dashboard…" />
  if (error || !data) {
    return (
      <PageState
        title="Couldn't load the dashboard"
        description={error ?? undefined}
        action={<Button onClick={() => void reload()}>Try again</Button>}
      />
    )
  }

  return (
    <>
      <DashboardHeader firstName={firstName} />
      <KpiGrid kpis={data.kpis} />

      <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
        <UserGrowthCard data={data.user_growth} />
        <PlanSplitCard data={data.plan_split} />
      </div>

      <JourneyCard journey={data.journey} outcomes={data.outcomes} />

      <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
        <LocationCard data={data.locations} />
        <AgeCard data={data.age_distribution} />
      </div>

      <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
        <FunnelCard data={data.funnel} />
        <FeatureAdoptionCard data={data.feature_adoption} />
        <OutcomesPanel data={data.outcomes} />
      </div>

      <div className="flex flex-col items-stretch gap-4 min-[1101px]:flex-row">
        <RecentSignupsCard data={data.recent_signups} />
        <NeedsAttentionCard data={data.attention} />
      </div>
    </>
  )
}
