-- Reference data for Roles & access: matrix, default security policy, alert rules.

update public.admin_role_catalog c set short_summary = s.text
from (values
  ('super_admin', 'Everything incl. roles'),
  ('admin', 'Ops without billing config'),
  ('medical_reviewer', 'Approves content & engine'),
  ('engine_engineer', 'Rules, simulator, canary'),
  ('content_editor', 'Articles & in-app cards'),
  ('moderator', 'Community queue'),
  ('support_agent', 'Tickets, masked profiles'),
  ('analyst', 'Read-only dashboards')
) as s(role, text)
where c.role = s.role::public.admin_role;

insert into public.admin_access_matrix (role, area, area_label, area_order, level)
select r.role::public.admin_role, a.area, a.label, a.ord, a.levels[r.ord]
from (values
  ('super_admin', 1), ('admin', 2), ('medical_reviewer', 3), ('engine_engineer', 4),
  ('content_editor', 5), ('moderator', 6), ('support_agent', 7), ('analyst', 8)
) as r(role, ord)
cross join (values
  ('users', 'Users', 1, array['full', 'full', 'none', 'none', 'none', 'view', 'view', 'view']),
  ('health', 'Health data', 2, array['full', 'masked', 'view', 'masked', 'none', 'none', 'masked', 'none']),
  ('content', 'Content', 3, array['full', 'full', 'full', 'none', 'full', 'none', 'none', 'view']),
  ('notifications', 'Notifications', 4, array['full', 'full', 'none', 'none', 'view', 'none', 'none', 'view']),
  ('community', 'Community', 5, array['full', 'full', 'none', 'none', 'none', 'full', 'view', 'view']),
  ('engine', 'Engine', 6, array['full', 'full', 'full', 'full', 'none', 'none', 'none', 'view']),
  ('billing', 'Billing', 7, array['full', 'view', 'none', 'none', 'none', 'none', 'view', 'view']),
  ('clinics', 'Clinics', 8, array['full', 'full', 'view', 'none', 'none', 'none', 'none', 'view'])
) as a(area, label, ord, levels);

insert into public.admin_security_policy (policy) values ($json$
{
  "authentication": {
    "sso": true, "require_2fa": true, "passkeys": true, "sms_fallback": false,
    "min_length": 14, "rotation_days": 90, "history": 5, "block_breached": true
  },
  "sessions": {
    "idle_minutes": 30, "absolute_hours": 12, "max_concurrent": 3,
    "signout_on_role_change": true, "trust_device": true, "managed_export_only": true, "block_mobile_browsers": false
  },
  "network": {
    "ip_restricted": true, "indonesia_only": true, "failed_logins": 5, "lock_minutes": 15, "autoblock_per_hour": 20
  },
  "data": {
    "mask_default": true, "pseudonymise_exports": true, "watermark_exports": true, "export_approval": true, "export_approval_rows": 10000,
    "deleted_purge_days": 30, "audit_years": 5, "attachments_days": 180, "dpo_name": "Siti Nurhaliza"
  },
  "alerts": {
    "auto_lock_high": false, "reauth_medium": true,
    "channels": { "slack": "#security-alerts", "oncall": "PagerDuty · High only" }
  }
}
$json$::jsonb);

insert into public.admin_alert_rules (key, label, description, severity, enabled, sort_order) values
  ('unusual_unmask', 'Unusual unmask volume', '> 5 unmasks in 30 min by one member', 'high', true, 1),
  ('new_country', 'Login from new country', 'Any country outside Indonesia', 'medium', true, 2),
  ('failed_2fa', 'Failed 2FA burst', '≥ 3 wrong codes in 10 min', 'high', true, 3),
  ('role_escalation', 'Role escalation', 'Anyone granted Admin or Super admin', 'high', true, 4),
  ('large_export', 'Large export', '> 10,000 rows or health categories', 'medium', true, 5),
  ('after_hours_engine', 'After-hours engine change', 'Rules edited 22:00–06:00', 'low', false, 6);

insert into public.admin_ip_allowlist (cidr, label) values
  ('103.12.44.0/24', 'Jakarta office'),
  ('10.0.0.0/16', 'Company VPN (WireGuard)'),
  ('36.84.10.0/24', 'Bandung office');
