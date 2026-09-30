import { supabase } from '../../../lib/supabase'
import type { DashboardOverview } from '../types'

export async function fetchDashboardOverview(funnelDays = 30): Promise<DashboardOverview> {
  const { data, error } = await supabase.rpc('dashboard_overview', { p_funnel_days: funnelDays })
  if (error) throw error
  return data as DashboardOverview
}
