import { useAuth } from '../../auth/hooks/useAuth'

/** Who may approve content: Super admins and Medical reviewers. Super admins may also skip review for a draft. */
export function useCanReview() {
  const role = useAuth().profile?.role as string | undefined
  return { canReview: role === 'super_admin' || role === 'medical_reviewer', isSuperAdmin: role === 'super_admin' }
}
