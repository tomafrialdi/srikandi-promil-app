# Push notifications (Expo Push)

How notifications work in Srikandi Promil and what is left to build. **Status: the console and the campaign data model are done; delivery (tokens, sender, receipts) is not built yet.**

## Overview

```
Console (campaign editor)  ──save/schedule──▶  notification_campaigns   (status: scheduled | active)
                                                        │
                                   pg_cron (every minute) → Edge Function `notifications-send`
                                                        │  picks due campaigns, resolves audience, applies guards
                                                        ▼
                                           Expo Push Service  ──▶  FCM (Android) / APNs (iOS)  ──▶  device
                                                        │
                            pg_cron (every 5 min) → Edge Function `notifications-receipts`
                                                        │  reads receipts ~15 min later
                                                        ▼
                     notification_deliveries · push_tokens (prune) · notification_failures · campaign counters
```

Why Expo Push: the mobile app is Expo, so one HTTP API covers FCM and APNs. It is free, and tokens look like `ExponentPushToken[...]`.

## What exists today

| Piece | Where |
|---|---|
| Campaign list (KPIs, tabs, opens by hour, failures) | Console `/notifications` → `features/notifications/` |
| Campaign editor (audience, message, delivery, preview) | Console `/notifications/new`, `/notifications/:id` |
| Tables `notification_campaigns`, `notification_hourly_opens`, `notification_failures` | `supabase/migrations/20260930150000_notifications.sql` |
| RPCs `admin_notifications_*`, `admin_notification_get/save/reach/action` | `…150000_notifications.sql`, `…150100_notification_editor.sql` |
| Seed: 42 campaigns, hourly opens, failures | `supabase/seeds/15_notifications.sql` |

Campaign statuses: `draft → scheduled | active → sending → sent`, plus `paused` (triggers) and `failed`.
`admin_notification_action(id, 'schedule')` only **queues** a campaign: it validates the message and sets the status. Nothing is sent yet.
"Send test to me" is disabled in the console until the sender exists.

## Prerequisites (accounts & credentials)

You need to provide these; they cannot be created from the repo.

| Item | Used for | How |
|---|---|---|
| Apple Developer Program | APNs key (iOS) | `eas credentials` → let EAS create a Push Key |
| Firebase project | FCM V1 (Android) | Register `com.gridlova.srikandipromil`, download `google-services.json`, create a service-account key, upload it with `eas credentials` |
| Expo access token | Authenticates the server calls | expo.dev → Access Tokens; enable **Enhanced Push Security**; `supabase secrets set EXPO_ACCESS_TOKEN=...` |
| A physical device | Testing | Push does not work in the iOS simulator |

Already in place: EAS `projectId` (`app.json → extra.eas.projectId`), iOS bundle id `com.gridlova.srikandi-promil`, Android package `com.gridlova.srikandipromil`.

## Mobile app (`apps/mobile`)

1. Install `expo-notifications`; add the plugin to `app.json` and `googleServicesFile` for Android. This is a native change: **rebuild the dev client** (`eas build --profile development`).
2. On sign-in (and on app start): ask permission, then `Notifications.getExpoPushTokenAsync({ projectId })`.
3. Upsert the token into `push_tokens` (below) with the platform and the user's *discreet mode* flag. Delete it on sign-out.
4. Create the Android notification channel (default importance, brand colour).
5. Handle taps: read `data.deepLink` from the notification response and route it (`srikandipromil://…` scheme is already configured).
6. Settings screen: opt-out, quiet hours and discreet mode write to the user's preferences.

## Supabase (to build)

### Tables

| Table | Columns (planned) |
|---|---|
| `push_tokens` | `id`, `user_id → app_users`, `token` (unique), `platform` (`ios`/`android`), `discreet`, `last_seen_at`, `created_at` |
| `notification_preferences` | `user_id`, `push_enabled`, `quiet_hours` (bool), `discreet_mode`, `language` |
| `notification_deliveries` | `id`, `campaign_id`, `user_id`, `token_id`, `status` (`queued`/`sent`/`delivered`/`failed`), `expo_ticket_id`, `error`, `sent_at`, `opened_at` |

RLS: users can only write their own token and preferences; deliveries are readable by console admins only.
Add the `push_enabled = true` / `discreet` flags to the audience query.

### Edge Function `notifications-send`

Runs every minute (`pg_cron` + `pg_net`).

1. Select campaigns with `status = 'scheduled' and send_at <= now()`, or `status = 'active'` whose trigger fires (see Triggers).
2. Set the status to `sending` and lock the row so two runs cannot double-send.
3. Resolve the audience from `audience_rules` (tracking mode, plan, last active, and cycle phase once available). Always exclude: after-loss mode, reminders paused, pregnancy mode, opted-out users.
4. Apply guards per user: **quiet hours** (hold until 07:00 local), **max 1 cycle push per day**, **discreet variant** (`discreet_body`, generic title) for users with discreet mode on.
5. Fill variables (`{first_name}`, `{cycle_day}`, `{partner_name}`, `{days_to_test}`).
6. `POST https://exp.host/--/api/v2/push/send` in batches of **100** messages with `Authorization: Bearer $EXPO_ACCESS_TOKEN`; message = `{ to, title, body, data: { deepLink, campaignId }, channelId }`.
7. Store each ticket id in `notification_deliveries`; update `progress_pct` while sending; when done set `status = 'sent'` and `last_run_at`.

### Edge Function `notifications-receipts`

Runs every ~5 minutes. Reads receipts for tickets older than 15 minutes (`/--/api/v2/push/getReceipts`, batches of 1000).

| Receipt | Action |
|---|---|
| `ok` | mark `delivered`; increment `delivered_count` |
| `DeviceNotRegistered` | delete the token; count as *App uninstalled* / *Expired APNs token* |
| `MessageRateExceeded` | retry later; count as *FCM quota / throttled* |
| Other error | record in `notification_failures` |

Opens: the app reports an open (edge function or RPC) when the user taps a notification → `opened_at`, `opened_count`, and a row in `notification_hourly_opens`. Opt-outs increment `optout_count`.

### Triggers (event campaigns)

Trigger campaigns (`kind = 'trigger'`, `trigger_event`) are evaluated by `notifications-send`, for example "Engine status → Fertile window opens": find users whose engine state changed since the last run, at their local `send_time` (default 07:00), and send once per user per cycle.

### Send test to me

Console calls an Edge Function that sends the current draft to the signed-in admin's own tokens only. Enable the button when this exists.

## Console changes when delivery lands

- Enable **Send test to me** in `NotificationEditorPage`.
- The list and cards already read `sent_count`, `delivered_count`, `opened_count`, `optout_count`, `progress_pct`, `notification_hourly_opens`, `notification_failures`; the sender only has to write them.
- Cycle phase in the reach estimate: today `admin_notification_reach` ignores it because phase is not stored per user.

## Testing checklist

1. Fake tokens locally: insert rows into `push_tokens`, run `notifications-send` with `supabase functions serve`, and inspect the Expo response.
2. Real device with a development build: register, send a test, tap the notification, and confirm the deep link opens.
3. Quiet hours: schedule at 22:00 and check the push is held until 07:00.
4. Discreet mode user receives the discreet variant.
5. `DeviceNotRegistered`: uninstall the app, send, and confirm the token is removed and the failure shows in the console.
6. Double-run safety: invoke the sender twice at once; each user gets one message.

## Security notes

- Never expose `EXPO_ACCESS_TOKEN` or any Firebase/Apple key to the console or the app; they live in Supabase secrets and EAS only.
- The sender runs with the service role inside Edge Functions; the console only queues campaigns through `admin_notification_action`, which requires an admin with 2FA.
- Health-related copy needs the approval step (currently shown in the editor summary only): add a real approval flow before the first production send.

## Decisions still open

1. Cycle phase per user: source of truth (engine output vs. computed on send).
2. Email channel provider (Resend / SES) and in-app channel delivery (in-app cards reuse the content library?).
3. Approval workflow for health claims.
