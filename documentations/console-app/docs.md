# Console (`apps/console`)

Admin dashboard: React 19 + Vite + TypeScript, **Tailwind CSS v4**, Phosphor icons, React Router, `@supabase/supabase-js`, Lenis (smooth scroll).

## Run

```bash
supabase start                # from repo root
cd apps/console && npm run dev      # Vite + Edge Functions together
```

`npm run dev` starts both the web app and `supabase functions serve` (needed for image uploads). Use `npm run dev:web` for Vite only.

`.env.local` (see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (from `supabase status`), `VITE_IMAGEKIT_URL_ENDPOINT`, `VITE_IMAGEKIT_PUBLIC_KEY` (ImageKit dashboard → Developer Options). The app fails on load if any is missing.

Uploads need the `imagekit-auth` Edge Function; `npm run dev` runs it for you (it is not part of `supabase start`). See **Images (ImageKit)** below.
Dev login: `admin@srikandipromil.id` / `Admin#12345`, then enroll 2FA (TOTP) on first sign-in.

## Structure

```
src/
  app/        router.tsx, providers/AppProviders
  config/     env.ts, app.ts
  lib/        supabase.ts (client)
  styles/     index.css (Tailwind + @theme), tokens.css (Pencil design tokens)
  shared/     ui/  charts/  layout/  lib/  hooks/  services/imagekit.service.ts
  features/   auth/  dashboard/  analytics/  users/  subscriptions/  content/  notifications/  community/  account/
```

Rule: **a feature owns its pages, components, services, hooks and config.** Shared code goes in `shared/`.

## Feature folder

| Folder | What goes in it |
|---|---|
| `pages/` | Route-level screens (compose components) |
| `components/` | UI for this feature, one card = one file (Tailwind classes) |
| `services/` | Supabase calls only (no React) |
| `hooks/` | Data loading / state (`useXxx`) |
| `config/` | Labels, colors, constants |
| `types.ts` | DTO types matching the RPC JSON |

## Features

**auth** — sign-in → 2FA
- `pages/SignInPage`, `pages/TwoFactorPage` (enroll QR on first time, then code)
- `providers/AuthProvider` + `hooks/useAuth`: status = `loading | signed-out | needs-2fa | no-access | ready`
- `guards/RouteGuards`: `GuestOnly`, `RequirePasswordStep`, `RequireConsoleAccess`
- `services/auth.service` (sign in/out, profile, audit log), `services/mfa.service` (TOTP)

**dashboard** — `/`
- `pages/DashboardPage` loads `dashboard_overview` via `hooks/useDashboardOverview`
- `components/` one file per card: `KpiGrid`, `UserGrowthCard`, `PlanSplitCard`, `JourneyCard`, `LocationCard`, `AgeCard`, `FunnelCard`, `FeatureAdoptionCard`, `OutcomesPanel`, `RecentSignupsCard`, `NeedsAttentionCard`

**analytics** — `/analytics/*`
- `pages/AnalyticsLayout` = header + tabs + `<Outlet>`
- `components/`: `AnalyticsHeader`, `AnalyticsTabs`, `DateRangeMenu`, `MetricCard`/`MetricStrip`, `QueryBoundary`, `trend-badge`
- `hooks/useDateRange` (range in URL `?range=30d`), `hooks/useAnalyticsQuery(fetcher)` (loading / error / retry)
- `services/analytics.service` → one function per RPC
- `tabs/<tab>/`: `<Tab>.tsx` (loads data, lays out cards) + one file per card

| Tab | Route | RPC |
|---|---|---|
| Overview | `/analytics` | `analytics_overview` |
| Retention | `/analytics/retention` | `analytics_retention` |
| Engagement | `/analytics/engagement` | `analytics_engagement` |
| Acquisition | `/analytics/acquisition` | `analytics_acquisition` |
| Health outcomes | `/analytics/health-outcomes` | `analytics_health` |
| Revenue | `/analytics/revenue` | `analytics_revenue` |

**users** — `/users`, `/users/:userId`
- `pages/UsersPage` (list), `pages/UserDetailPage`
- `components/list/`: `UsersHeader` `MiniStats` `UsersTable` `UsersFilterBar` `BulkBar` (filters + page live in the URL: `hooks/useUsersFilters`)
- `components/detail/`: `DetailHeader` `ProfileCard` `TrackingSummaryCard` `EngineStatusCard` `MedicationsCard` `DoctorsCard` `ActivityCard` `SubscriptionCard` `ClinicsCard` `DevicesCard` `PrivacyCard`
- `modals/`: `EngineLogModal` `MedicationModal` `DoctorCareModal` `ClinicJourneyModal`, `change-plan/ChangePlanModal`, `invite-admin/` (4-step wizard: `DetailsStep` `RoleStep` `AccessStep` `ReviewStep`)
- Health data modals (engine log, medication) first ask for a reason via `hooks/useUnmaskGate`; the backend logs it. Other modals load on demand with `hooks/useModalData`.
- `services/users.service` = one function per RPC; `types.ts` mirrors the JSON.

**subscriptions** — `/subscriptions`, `/subscriptions/promo-codes`, `/subscriptions/transactions`
- `pages/SubscriptionsPage` (overview), `PromoCodesPage`, `TransactionsPage`
- `components/overview/`: `OverviewKpis` `MrrChartCard` `PaymentMixCard` `PlansRow` `PromoCodesCard` `CodeUsageCard` `RecentTransactionsCard`
- `components/promos/`: `PromoStats` `PromoTable` `PromoDetailPanel` · `components/transactions/`: `TransactionStats` `TransactionsTable`
- `modals/`: `EditPlanModal` (price changes become an approval request), `PromoFormModal` (create / edit / duplicate; identity fields lock after redemptions), `ReceiptModal` (invoice, settlement, refund, print)
- Transactions reuse the date range from `features/analytics` (`DateRangeMenu`, `useDateRange`). Filters/page live in the URL via `shared/hooks/useUrlFilters`.

**content** — `/articles` (library), `/articles/new`, `/articles/:id` (editor)
- `pages/ContentLibraryPage`, `pages/ContentEditorPage`
- `components/library/`: `ContentHeader` `ContentStats` `ContentTable` `ContentFilterBar` `ContentBulkBar` `ReviewQueueCard` `TopPerformingCard`. Tabs, filters and page live in the URL (`shared/hooks/useUrlFilters`). Bulk actions: send to review, schedule (`modals/ScheduleModal`), archive.
- `components/editor/`: `EditorHeader` `WorkflowSteps` `TypeTabs` `fields.tsx`; `settings/SettingsColumn` (Publish, targeting, medical review, SEO); `forms/ArticleForm` (Markdown body + toolbar, `:::cta Label | deeplink` block), `TipForm`, `CardForm` (A/B variants), `VideoForm` (upload, chapters, thumbnails).
- One flat `ContentForm` covers all four types; `lib/form-mapping.ts` converts it to and from the RPC payload (type-specific fields go into `details`). The type is locked once an item exists.
- Submit = save, then `send_to_review` (needs a reviewer) or, for in-app cards, `schedule` (needs "Run from"). Preview and Import / Calendar view are placeholders (disabled with a Tooltip).

**notifications** — `/notifications` (campaigns), `/notifications/new`, `/notifications/:id` (editor)
- `pages/NotificationsPage`: `components/list/` `NotificationsHeader` `NotificationStats` `CampaignTable` `OpensByHourCard` `FailuresCard`.
- `pages/NotificationEditorPage`: four numbered sections (`CampaignSection`, `AudienceSection` rule builder + reach estimate, `MessageSection`, `DeliverySection`) and `PreviewColumn` (lock-screen preview, summary). Sent campaigns are read-only.
- Saving or scheduling only **queues** a campaign. Sending is not built yet: see `documentations/notifications/docs.md`. "Send test to me" and Templates are disabled.

**community** — `/community`
- `pages/CommunityPage`: `components/` `CommunityHeader` `CommunityStats` `ModerationQueue` (tabs Reported / AI flagged / Appeals, sorted by risk) `PostDetailPanel` (post, author context, wellbeing protocol for self-harm risk, actions, internal notes) `GroupsTable`.
- `modals/`: `GuidelinesModal` (edit the guidelines text), `KeywordRulesModal` (flag / hide keywords), `NewGroupModal`.
- Actions: **Hide + send support** (self-harm only), Hide, Remove (confirm), Escalate, Approve. Each writes to the audit log; opening a post's detail is logged too (`community.view_post`).
- "Open in app" is disabled until posts have deep links. The support message itself is only recorded (`resolution = hide_support`); sending it needs the notification sender.

**account** — `/account-settings` (Profile), `/security`, `/notifications`, `/preferences`, `/api-tokens`
- `pages/AccountLayout` = title + side nav (`Outlet` for the five `tabs/`). All data is the signed-in admin's own (`admin_account_*` RPCs).
- **Profile**: name, display name, phone, job title, department, photo (ImageKit `/avatars`), role & permissions card, "Request deactivation" (asks for a reason, logged).
- **Security**: score banner, change password (`modals/ChangePasswordModal`: checks the current password on a throwaway client so this session keeps its 2FA level, then `updateUser`, then signs out other sessions), TOTP status, backup codes (`modals/BackupCodesModal`: 10 codes shown once, stored hashed), active sessions (revoke one / sign out others), recent security activity. **Passkeys are disabled**: our sign-in service has no passkey support yet.
- **Notifications** and **Preferences** are saved through `shared/preferences` (`PreferencesProvider` in `app/providers`, `usePreferences()`), one jsonb per admin. Applied today: table density (`DataTable`), landing page after sign-in (`app/LandingGate`, once per session), default analytics date range (`useDateRange`). Saved but not applied yet: dark/system theme (disabled in the UI), language, time zone, date format, currency, masking toggle, keyboard shortcuts, and every notification channel (no delivery integration yet).
- **API tokens**: create (name, scopes, expiry, allowed IPs; max 5 active; `health:read` is never available), shown once, revoke, usage chart. Tokens are stored hashed. **Nothing accepts them yet**: the API gateway that verifies them is not built.
- Backup codes are not accepted at sign-in yet either; the 2FA page needs a recovery flow (an Edge Function that verifies a code and removes the TOTP factor so it can be enrolled again).

## Shared

| `shared/ui` | `Avatar` `Badge` `Button` `Card`/`CardHeader` `DataTable` `DonutChart` `IconTile` `Notice` `PageState` `ProgressBar` `TextField` + forms: `Field` `SelectField` `TextAreaField` `ChipInput` `Toggle`/`ToggleRow`/`CheckRow`/`Checkbox` `RadioCard` `ChipToggleGroup` `ImageUpload` + `CountTabs` `Pagination` `StepTabs` `Segmented` `StatCard`/`StatGrid` `Toast` |
|---|---|
| **`shared/charts`** | `BarRow` `CohortTable` `Columns` `HeatGrid` `Legend` `LineChart` `Sparkline` `StackedColumns` |
| **`shared/layout`** | `AdminShell` (Sidebar + sticky Topbar + page), `nav.config.ts` (menu + placeholder routes), `PlaceholderPage` |
| **`shared/lib`** | `cn.ts` (class join + Tailwind conflict merge), `smooth-scroll.ts` (Lenis), `format.ts` (number, %, Rp, duration, time-ago), `labels.ts` (plan/mode labels), `csv.ts` (CSV download) |
| **`shared/hooks`** | `useAsyncData(key, fetcher)` (load + reload), `useUrlFilters(keys)` (filters + page in the URL) |
| **`shared/services`** | `imagekit.service.ts`: `uploadFile` / `uploadImage`, `ikUrl(url, {w, h, q})`, `videoThumbnail(url, seconds)` |

## Add a new page

1. Design frame in Pencil → `features/<name>/`.
2. Migration + RPC in `supabase/` (see `documentations/supabase`).
3. `services/` (call RPC) → `hooks/` → `components/` → `pages/`.
4. Add a route in `app/router.tsx` (menu item lives in `shared/layout/nav.config.ts`).
5. Reuse `shared/ui` and `shared/charts`; add colors to `styles/tokens.css` + `@theme` in `styles/index.css`, never hardcode.

## Modal (reusable)

`shared/ui/Modal` — use it for any dialog.

```tsx
const dialog = useDisclosure()

<Modal open={dialog.open} onClose={dialog.onClose}
       title="Title" subtitle="Optional" icon={<Icon />}
       size="sm|md|lg|xl" tabs={<StepTabs …/>}          // tabs optional
       footer={<ModalFooter info="left text"><Button/>…</ModalFooter>}>
  <ModalSection label="Section">…</ModalSection>
</Modal>
```

| Piece | Use |
|---|---|
| `Modal` | Portal, backdrop, Esc, focus trap, scroll lock, restores focus |
| `ModalSection` / `ModalFooter` | Group body content / sticky footer with info + actions |
| `ConfirmDialog` | Small yes/no; shows pending + error, throw in `onConfirm` to keep it open |
| `ReasonDialog` | `ConfirmDialog` + required reason/ticket text |
| `useDisclosure` | `{ open, onOpen, onClose }` |
| `useToast()` | `toast({ title, description, tone })` after an action |

Printing: put `data-print-area` on the content of a `Modal` and add the class `print-modal` to `<body>` before `window.print()` (see `ReceiptModal`). `Modal` also supports stacked dialogs (only the top one handles Esc/Tab) and a `headerActions` slot.

## Styling (Tailwind v4)

- Design tokens live in `styles/tokens.css` (CSS variables mirroring Pencil) and are mapped in `@theme` (`styles/index.css`): `bg-primary`, `text-ink-muted`, `border-border`, `rounded-card`, `rounded-control`, `text-13` (font sizes 9–38), `shadow-modal`.
- No CSS Modules. Write utilities in JSX; for conditional / overridable classes use `cn()` from `shared/lib/cn` (it is `tailwind-merge` configured for our theme, so `cn('p-5', 'p-4')` → `p-4`).
- Dynamic values (chart heights, grid templates) stay inline via `style`.
- Breakpoints used: `min-[701px]`, `min-[801px]`, `min-[1101px]`, `min-[1281px]` (same as the old media queries).

## Motion & interaction

- **Modal** fades + scales in and out (200 ms, respects `prefers-reduced-motion`); it stays mounted until the exit animation ends.
- **Tooltip / TooltipBody** (`shared/ui/Tooltip`): hover bubble used by `Columns`, `StackedColumns`, `LineChart`, `HeatGrid` and the journey bar. Give chart items `tooltipTitle` / `tooltipValue` (or `formatValue`) for nicer text.
- **Lenis** smooth scrolling starts in `app/providers/SmoothScroll`. Modals pause it while open; any inner scroll area needs `data-lenis-prevent` (the modal body and sidebar nav already have it).

## Images (ImageKit)

All images and videos uploaded from the console are hosted on ImageKit; the database only stores the URL.

- Flow: `ImageUpload` (or the article / video forms) → `uploadFile(file, folder)` asks the Edge Function `imagekit-auth` for a signed `token` / `expire` / `signature`, then uploads straight to ImageKit.
- The function only answers signed-in admins that finished 2FA (it calls `is_console_admin()`). The private key lives in `supabase/functions/.env` (local) or Supabase secrets (hosted), never in the console.
- Show images with `ikUrl(url, { w: 400 })` to get resized `f-auto` versions. Non-ImageKit URLs pass through unchanged.
- `<ImageUpload value onChange folder aspectClassName />` gives a click-to-upload box (10 MB, image types). Videos are limited to 200 MB in `VideoForm`; ImageKit's own plan limit also applies.
- Error "Upload service is unreachable": the function is not running. Start `supabase functions serve --env-file supabase/functions/.env`.
