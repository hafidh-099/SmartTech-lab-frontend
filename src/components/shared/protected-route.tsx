import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/user'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function roleHome(role: UserRole): string {
  switch (role) {
    case 'dean':
      return '/dean/dashboard'
    case 'technician':
      return '/technician/dashboard'
    case 'teacher':
      return '/teacher/dashboard'
    case 'super_admin':
      return '/super/dashboard'
  }
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, accessToken } = useAuthStore()
  const location = useLocation()

  if (!accessToken || !user) {
    return (
      <Navigate to="/auth/login" state={{ from: location }} replace />
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />
  }

  return <Outlet />
}
