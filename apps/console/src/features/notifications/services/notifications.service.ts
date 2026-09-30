import { supabase } from '../../../lib/supabase'
import type { CampaignList, CampaignRecord, FailureSummary, HourlyOpens, NotificationStatus, NotificationsSummary } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchNotificationsSummary = () => rpc<NotificationsSummary>('admin_notifications_summary')
export const fetchCampaigns = (tab: string, page: number, pageSize: number) =>
  rpc<CampaignList>('admin_notifications_list', { p_tab: tab || 'all', p_limit: pageSize, p_offset: (page - 1) * pageSize })
export const fetchHourlyOpens = () => rpc<HourlyOpens>('admin_notifications_hourly')
export const fetchFailures = () => rpc<FailureSummary>('admin_notifications_failures')

export const fetchCampaign = (id: string) => rpc<CampaignRecord>('admin_notification_get', { p_id: id })
export const saveCampaign = (id: string | null, payload: Record<string, unknown>) =>
  rpc<{ id: string; status: NotificationStatus }>('admin_notification_save', { p_id: id, p_payload: payload })
export const fetchReach = (rules: unknown) => rpc<number>('admin_notification_reach', { p_rules: rules })
export const campaignAction = (id: string, action: 'pause' | 'resume' | 'schedule' | 'resend') =>
  rpc<NotificationStatus>('admin_notification_action', { p_id: id, p_action: action })
