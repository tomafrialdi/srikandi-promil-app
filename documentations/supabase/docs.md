# Supabase (`supabase/`)

Local backend for the console (Postgres + Auth + PostgREST). Screens read data through **RPC functions**, not raw tables.

## Run

```bash
supabase start          # start local stack
supabase db reset       # re-apply all migrations + seeds (wipes local data)
supabase status         # URLs and keys
```

Changed `config.toml` (auth)? → `supabase stop && supabase start`.
Studio: http://127.0.0.1:54323

## Layout

```
supabase/
  config.toml          MFA TOTP on, seeds = ./seeds/*.sql
  migrations/          one file per module, applied in filename order
  seeds/               dev data, applied in filename order
```

## Migrations

| File | Module |
|---|---|
| `100000_enums` | Shared enum types, `set_updated_at()` |
| `100100_admin_access` | `admin_profiles`, `is_console_admin()`, `assert_console_admin()` |
| `100200_app_users` | `app_users` (mobile-app users), `plan_prices` |
| `100300_engagement` | `feature_usage`, `attention_items` |
| `100400_audit_log` | Immutable `audit_log`, `log_console_event()` |
| `100500`–`100800` | Dashboard RPCs (`dashboard_*`) |
| `110000_analytics_attributes` | Extra enums + `app_users` columns; private helper schema |
| `110100_activity` | `app_sessions`, `push_deliveries`, `feature_catalog`, `articles`, `article_reads` |
| `110200_acquisition` | `app_installs`, `channel_spend` |
| `110300_revenue` | `subscription_events` (MRR), `other_revenue` |
| `110400_care_events` | `care_events` |
| `110500_dashboard_kpis_v2` | Dashboard KPIs read sessions + MRR events |
| `110600`–`111100` | Analytics RPCs: overview, retention, engagement, acquisition, health, revenue |
| `119900_lock_down_rpc` | Revoke `anon` on all console RPCs |
| `120000`–`120100` | Users module: `user_status`, new plan/roles enum values, account columns, `plan_catalog` |
| `120200_user_care_domain` | `user_cycles`, `engine_runs`, `user_medications`, `doctors`, `clinics`, `user_care_team`, `user_clinics`, `user_integrations` |
| `120300`–`120400` | `admin_role_catalog`, `admin_role_permissions`, `allowed_admin_domains`, `admin_invitations` + role data |
| `120500_promos_plan_changes` | `promo_codes`, `plan_changes` |
| `120600_users_list` | Helpers (`console_role`, `write_audit`, `phase_label`) + `admin_users_summary`, `admin_users_list` |
| `120700_user_detail` | `admin_user_detail` + engine log / medication / doctor / clinic modal RPCs |
| `120800_user_actions` | Suspend, grant Plus, plan-change quote + apply (proration, promo, refunds) |
| `120900_admin_invites` | `admin_role_catalog()`, `admin_invite_admins()` |
| `129900_lock_down_users_rpc` | Revoke `anon` on `admin_*` RPCs |

## Access control

- Every table has RLS on. Policies allow `select` only when `is_console_admin()`.
- `is_console_admin()` = active row in `admin_profiles` **and** session is `aal2` (2FA done).
- Every RPC is `security definer`, calls `assert_console_admin()` first, and is granted to `authenticated` only.
- Helpers live in schema `analytics_private` (not exposed by the API): `jkt()`, `pct()`, `active_users()`, `active_in_week()`, `active_in_days()`, `monthly_churn()`, `resurrected()`, view `paid_users`.

## RPCs

| RPC | Used by |
|---|---|
| `dashboard_overview(p_funnel_days)` | Dashboard (calls the `dashboard_*` functions below) |
| `dashboard_kpis` `_user_growth` `_plan_split` `_journey` `_outcomes` `_locations` `_age_distribution` `_funnel` `_feature_adoption` `_recent_signups` `_attention` | Dashboard cards |
| `analytics_overview(p_from, p_to)` | Analytics › Overview |
| `analytics_retention(p_from, p_to)` | Analytics › Retention |
| `analytics_engagement(p_from, p_to)` | Analytics › Engagement |
| `analytics_acquisition(p_from, p_to)` | Analytics › Acquisition |
| `analytics_health(p_from, p_to)` | Analytics › Health outcomes |
| `analytics_revenue(p_from, p_to)` | Analytics › Revenue |
| `admin_users_summary()` / `admin_users_list(tab, search, plan, mode, city, status, limit, offset)` | Users list |
| `admin_user_detail(user)` | User detail (logs `user.view`) |
| `admin_user_engine_log(user, reason)` / `admin_user_medication(id, reason)` | Health-data modals — reason required, logged as `user.unmask.*` |
| `admin_user_doctor_care(link)` / `admin_user_clinic_journey(user)` | Doctor / clinic modals |
| `admin_set_users_status(ids, status, reason)` / `admin_grant_plus(ids, reason)` | Suspend / reactivate / grant Plus (bulk) |
| `admin_plan_change_preview(...)` / `admin_change_plan(...)` | Change plan (refund > Rp 500.000 needs Admin role) |
| `admin_role_catalog()` / `admin_invite_admins(payload)` | Invite admin wizard (records invitations; email sending is not built) |
| `log_console_event(action, resource, metadata)` | Auth (audit trail) |

`p_from` / `p_to` are inclusive dates in Jakarta time. Previous period = same length right before `p_from` (used for deltas).

## Seeds (dev only)

| File | Data |
|---|---|
| `01_admin` | Admin `admin@srikandipromil.id` / `Admin#12345` (super_admin) |
| `02_app_users` | 3,000 users |
| `03_engagement` | Attention items, audit sample |
| `04_user_attributes` | Platform, tracking depth, exits, former subscribers |
| `05_activity` | Sessions, pushes, feature usage, articles |
| `06_acquisition` | Installs per channel/campaign, spend |
| `07_revenue` | Subscription events, B2B/teleconsult revenue |
| `08_care_events` | Care events |
| `09_user_admin_attributes` | Phone, status, payment, consents, deletion requests |
| `10_user_cycles_engine` | Cycles + latest engine run per user |
| `11_care_team_meds` | Doctors, clinics, medications, integrations, promo codes |

Numbers in Analytics come from this fake data; they are not real metrics.

## Add a new screen's backend

1. New tables → new migration file (timestamp after the last one), enable RLS + admin `select` policy.
2. New RPC → new migration: `security definer`, `set search_path = ''`, start with `perform public.assert_console_admin();`, return `jsonb`.
3. Add it to `119900_lock_down_rpc` pattern (name starts with `dashboard_` / `analytics_`, or extend the list).
4. Add seed data in `seeds/`, then `supabase db reset` to test.
5. Never edit an applied migration on a shared DB; add a new one (`create or replace function ...`).
