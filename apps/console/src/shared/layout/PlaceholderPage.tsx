import { useLocation } from 'react-router-dom'
import { PageState } from '../ui'
import { NAV_ITEMS } from './nav.config'

/** Stand-in for console sections that have not been built yet. */
export function PlaceholderPage() {
  const { pathname } = useLocation()
  const label = NAV_ITEMS.find((item) => item.path === pathname)?.label ?? 'This page'
  return <PageState title={label} description="This section is not built yet." />
}
