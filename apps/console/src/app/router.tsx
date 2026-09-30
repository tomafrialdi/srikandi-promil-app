import { createBrowserRouter } from 'react-router-dom'
import { GuestOnly, RequireConsoleAccess, RequirePasswordStep } from '../features/auth/guards/RouteGuards'
import { SignInPage } from '../features/auth/pages/SignInPage'
import { TwoFactorPage } from '../features/auth/pages/TwoFactorPage'
import {
  AcquisitionTab,
  AnalyticsLayout,
  EngagementTab,
  HealthTab,
  OverviewTab,
  RetentionTab,
  RevenueTab,
} from '../features/analytics'
import { AccountLayout, ApiTokensTab, NotificationsTab as AccountNotificationsTab, PreferencesTab, ProfileTab, SecurityTab } from '../features/account'
import { CommunityPage } from '../features/community'
import { ContentEditorPage, ContentLibraryPage } from '../features/content'
import { DashboardPage } from '../features/dashboard'
import { NotificationEditorPage, NotificationsPage } from '../features/notifications'
import { MembersPage, RolesPage } from '../features/roles'
import { PromoCodesPage } from '../features/subscriptions/pages/PromoCodesPage'
import { SubscriptionsPage } from '../features/subscriptions/pages/SubscriptionsPage'
import { TransactionsPage } from '../features/subscriptions/pages/TransactionsPage'
import { UserDetailPage } from '../features/users/pages/UserDetailPage'
import { UsersPage } from '../features/users/pages/UsersPage'
import { AdminShell } from '../shared/layout/AdminShell'
import { NAV_ITEMS } from '../shared/layout/nav.config'
import { PlaceholderPage } from '../shared/layout/PlaceholderPage'
import { LandingGate } from './LandingGate'
import { AppProviders } from './providers/AppProviders'

const placeholderRoutes = NAV_ITEMS.filter((item) => item.path !== '/' && item.path !== '/analytics' && item.path !== '/users' && item.path !== '/subscriptions' && item.path !== '/articles' && item.path !== '/notifications' && item.path !== '/community' && item.path !== '/roles' && item.path !== '/account-settings').map((item) => ({
  path: item.path,
  element: <PlaceholderPage />,
}))

export const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      { element: <GuestOnly />, children: [{ path: '/sign-in', element: <SignInPage /> }] },
      { element: <RequirePasswordStep />, children: [{ path: '/sign-in/2fa', element: <TwoFactorPage /> }] },
      {
        element: <RequireConsoleAccess />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: '/', element: <LandingGate><DashboardPage /></LandingGate> },
              {
                path: '/analytics',
                element: <AnalyticsLayout />,
                children: [
                  { index: true, element: <OverviewTab /> },
                  { path: 'retention', element: <RetentionTab /> },
                  { path: 'engagement', element: <EngagementTab /> },
                  { path: 'acquisition', element: <AcquisitionTab /> },
                  { path: 'health-outcomes', element: <HealthTab /> },
                  { path: 'revenue', element: <RevenueTab /> },
                ],
              },
              { path: '/subscriptions', element: <SubscriptionsPage /> },
              { path: '/subscriptions/promo-codes', element: <PromoCodesPage /> },
              { path: '/subscriptions/transactions', element: <TransactionsPage /> },
              { path: '/articles', element: <ContentLibraryPage /> },
              { path: '/articles/new', element: <ContentEditorPage /> },
              { path: '/articles/:id', element: <ContentEditorPage /> },
              { path: '/community', element: <CommunityPage /> },
              { path: '/roles', element: <RolesPage /> },
              { path: '/roles/members', element: <MembersPage /> },
              {
                path: '/account-settings',
                element: <AccountLayout />,
                children: [
                  { index: true, element: <ProfileTab /> },
                  { path: 'security', element: <SecurityTab /> },
                  { path: 'notifications', element: <AccountNotificationsTab /> },
                  { path: 'preferences', element: <PreferencesTab /> },
                  { path: 'api-tokens', element: <ApiTokensTab /> },
                ],
              },
              { path: '/notifications', element: <NotificationsPage /> },
              { path: '/notifications/new', element: <NotificationEditorPage /> },
              { path: '/notifications/:id', element: <NotificationEditorPage /> },
              { path: '/users', element: <UsersPage /> },
              { path: '/users/:userId', element: <UserDetailPage /> },
              ...placeholderRoutes,
            ],
          },
        ],
      },
    ],
  },
])
