import { supabase } from '../../../lib/supabase'
import type { DateRange } from '../config/date-range'
import type {
  AcquisitionData,
  EngagementData,
  HealthData,
  OverviewData,
  RetentionData,
  RevenueData,
} from '../types'

type RpcName =
  | 'analytics_overview'
  | 'analytics_retention'
  | 'analytics_engagement'
  | 'analytics_acquisition'
  | 'analytics_health'
  | 'analytics_revenue'

async function call<T>(name: RpcName, range: DateRange): Promise<T> {
  const { data, error } = await supabase.rpc(name, { p_from: range.from, p_to: range.to })
  if (error) throw error
  return data as T
}

export const fetchOverview = (range: DateRange) => call<OverviewData>('analytics_overview', range)
export const fetchRetention = (range: DateRange) => call<RetentionData>('analytics_retention', range)
export const fetchEngagement = (range: DateRange) => call<EngagementData>('analytics_engagement', range)
export const fetchAcquisition = (range: DateRange) => call<AcquisitionData>('analytics_acquisition', range)
export const fetchHealth = (range: DateRange) => call<HealthData>('analytics_health', range)
export const fetchRevenue = (range: DateRange) => call<RevenueData>('analytics_revenue', range)
