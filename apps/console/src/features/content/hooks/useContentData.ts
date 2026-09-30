import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { PAGE_SIZE } from '../config/labels'
import { fetchContentHighlights, fetchContentList, fetchContentSummary } from '../services/content.service'
import type { ContentFilters } from '../types'

export const useContentSummary = () => useAsyncData('content-summary', fetchContentSummary)
export const useContentHighlights = () => useAsyncData('content-highlights', fetchContentHighlights)

export function useContentList(filters: ContentFilters, page: number) {
  const fetcher = useCallback(() => fetchContentList(filters, page, PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify([filters, page]), fetcher)
}
