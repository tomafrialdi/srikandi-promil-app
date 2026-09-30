-- Feature usage, attention items and sample audit events.

insert into public.feature_usage (user_id, feature, used_at)
select u.id, f.feature, now() - random() * 29 * interval '1 day'
from public.app_users u
cross join (values
  ('LH test scan', 0.62), ('Basal temperature', 0.48), ('Cervical fluid', 0.41),
  ('Two-week wait', 0.31), ('Partner mode', 0.22), ('Community', 0.19), ('Doctor report', 0.09)
) as f(feature, p)
where u.last_active_at >= now() - interval '30 days'
  and (abs(hashtext(u.id::text || f.feature)) % 1000) / 1000.0 < f.p;

insert into public.attention_items (title, detail, icon, severity) values
  ('Reported posts awaiting review', '12 in community queue', 'flag', 'error'),
  ('Support tickets > 24h', '3 tickets breaching SLA', 'lifebuoy', 'warning'),
  ('Engine anomaly', 'PCOS mode: 2.1% peak mismatch (v3.4)', 'activity', 'info'),
  ('Articles pending medical review', '5 drafts assigned to dr. Sarah', 'file', 'primary');

insert into public.audit_log (actor_id, actor_email, action, resource, metadata) values
  ('11111111-1111-1111-1111-111111111111', 'admin@srikandipromil.id', 'auth.sign_in', 'console', '{"seed":true}'::jsonb);
