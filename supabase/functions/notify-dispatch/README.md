# notify-dispatch

Runs the notification dispatcher and the push sender. Call it every 5 minutes.

## One-time setup

1. Pick a long random secret and store it as a function secret:
   `supabase secrets set DISPATCH_SECRET=<random string>`
2. Deploy: `supabase functions deploy notify-dispatch --no-verify-jwt`
3. In the Supabase dashboard enable the **pg_cron** and **pg_net** extensions, then create the job
   (SQL editor), replacing `<ref>` and `<secret>`:

```sql
select cron.schedule(
  'notify-dispatch',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://<ref>.supabase.co/functions/v1/notify-dispatch',
       headers := jsonb_build_object('x-dispatch-secret', '<secret>', 'Content-Type', 'application/json'),
       body := '{}'::jsonb
     ) $$
);
```

Check it in the console (Notifications page): the dispatcher status shows when it last ran.
To stop it: `select cron.unschedule('notify-dispatch');`

## Push credentials (optional, for pushes on the lock screen)

The inbox in the app works without them. Pushes need Expo to be able to reach the devices:
- Android: a Firebase project, `google-services.json` in the app, and the FCM v1 service-account key uploaded with `eas credentials`.
- iOS: an APNs key (needs a paid Apple Developer account), uploaded with `eas credentials`.
- Optional: `supabase secrets set EXPO_ACCESS_TOKEN=<token>` if you turn on enhanced push security in Expo.
