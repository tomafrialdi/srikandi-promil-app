-- Attention items and sample audit events.

insert into public.attention_items (title, detail, icon, severity) values
  ('Reported posts awaiting review', '12 in community queue', 'flag', 'error'),
  ('Support tickets > 24h', '3 tickets breaching SLA', 'lifebuoy', 'warning'),
  ('Engine anomaly', 'PCOS mode: 2.1% peak mismatch (v3.4)', 'activity', 'info'),
  ('Articles pending medical review', '5 drafts assigned to dr. Sarah', 'file', 'primary');

insert into public.audit_log (actor_id, actor_email, action, resource, metadata) values
  ('11111111-1111-1111-1111-111111111111', 'admin@srikandipromil.id', 'auth.sign_in', 'console', '{"seed":true}'::jsonb);
