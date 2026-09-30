-- Dev admin: profile details and a bit of security history.

update public.admin_profiles
   set display_name = 'Tommy', phone = '+62 812 3456 7788', job_title = 'Head of Product', department = 'Product & Engineering',
       password_changed_at = now() - interval '41 days'
 where id = '11111111-1111-1111-1111-111111111111';

insert into public.audit_log (actor_id, actor_email, action, resource, metadata, created_at)
select '11111111-1111-1111-1111-111111111111', 'admin@srikandipromil.id', a.action, a.resource, '{}', now() - a.ago
from (values
  ('auth.sign_in', 'console', interval '3 hours'),
  ('auth.password_change', 'admin_profiles', interval '41 days'),
  ('account.profile_update', 'admin_profiles', interval '12 days')
) as a(action, resource, ago);
