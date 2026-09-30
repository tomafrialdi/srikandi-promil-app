# Console (`apps/console`)

Admin dashboard: React 19 + Vite + TypeScript, CSS Modules, Phosphor icons, React Router, `@supabase/supabase-js`.

## Run

```bash
supabase start                # from repo root
cd apps/console && npm run dev
```

`.env.local` (see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (from `supabase status`).
Dev login: `admin@srikandipromil.id` / `Admin#12345`, then enroll 2FA (TOTP) on first sign-in.

## Structure

```
src/
  app/        router.tsx, providers/AppProviders
  config/     env.ts, app.ts
  lib/        supabase.ts (client)
  styles/     tokens.css (colors/fonts from Pencil), base.css
  shared/     ui/  charts/  layout/  lib/format.ts
  features/   auth/  dashboard/  analytics/
```

Rule: **a feature owns its pages, components, services, hooks and config.** Shared code goes in `shared/`.

## Feature folder

| Folder | What goes in it |
|---|---|
| `pages/` | Route-level screens (compose components) |
| `components/` | UI for this feature, one card = one file (+ `.module.css`) |
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

## Shared

| `shared/ui` | `Avatar` `Badge` `Button` `Card`/`CardHeader` `DataTable` `DonutChart` `IconTile` `Notice` `PageState` `ProgressBar` `TextField` |
|---|---|
| **`shared/charts`** | `BarRow` `CohortTable` `Columns` `HeatGrid` `Legend` `LineChart` `Sparkline` `StackedColumns` |
| **`shared/layout`** | `AdminShell` (Sidebar + sticky Topbar + page), `nav.config.ts` (menu + placeholder routes), `PlaceholderPage` |
| **`shared/lib`** | `format.ts`: number, percent, Rp, duration, time-ago helpers |

## Add a new page

1. Design frame in Pencil → `features/<name>/`.
2. Migration + RPC in `supabase/` (see `documentations/supabase`).
3. `services/` (call RPC) → `hooks/` → `components/` → `pages/`.
4. Add a route in `app/router.tsx` (menu item lives in `shared/layout/nav.config.ts`).
5. Reuse `shared/ui` and `shared/charts`; add colors to `styles/tokens.css`, never hardcode.
