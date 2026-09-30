-- Role catalogue data (separate file: enum values were added in an earlier migration).

insert into public.admin_role_catalog (role, label, summary, approvals_required, sort_order) values
  ('super_admin', 'Super admin', 'Everything incl. roles & billing config', 2, 1),
  ('admin', 'Admin', 'Operations without billing config', 0, 2),
  ('medical_reviewer', 'Medical reviewer', 'Content, meds & engine approvals', 0, 3),
  ('engine_engineer', 'Engine engineer', 'Rules, simulator, canary rollout', 0, 4),
  ('content_editor', 'Content editor', 'Articles & in-app cards', 0, 5),
  ('moderator', 'Moderator', 'Community queue & groups', 0, 6),
  ('support_agent', 'Support agent', 'Tickets & masked user profiles', 0, 7),
  ('analyst', 'Analyst', 'Read-only dashboards & exports', 0, 8);

insert into public.admin_role_permissions (role, area, level, sort_order)
select r.role::public.admin_role, a.area, a.levels[r.ord], a.ord
from (values
  ('super_admin', 1), ('admin', 2), ('medical_reviewer', 3), ('engine_engineer', 4),
  ('content_editor', 5), ('moderator', 6), ('support_agent', 7), ('analyst', 8)
) as r(role, ord)
cross join (values
  ('Users & profiles', 1, array['Full', 'Full', 'View', 'View', 'None', 'View', 'View', 'View']),
  ('Health data', 2, array['Unmask', 'Unmask', 'Unmask', 'Masked', 'None', 'None', 'Masked', 'Aggregated']),
  ('Support tickets', 3, array['Full', 'Full', 'View', 'None', 'None', 'View', 'Full', 'View']),
  ('Community', 4, array['Full', 'Full', 'View', 'None', 'View', 'Full', 'View', 'View']),
  ('Billing & refunds', 5, array['Full', 'Full', 'None', 'None', 'None', 'None', 'View', 'View']),
  ('Content, notifications, engine', 6, array['Full', 'Full', 'Approve', 'Full', 'Full', 'None', 'None', 'View']),
  ('Roles & audit log', 7, array['Full', 'View', 'None', 'None', 'None', 'None', 'None', 'View'])
) as a(area, ord, levels);
