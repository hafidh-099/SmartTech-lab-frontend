import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  return {
    user,
    isAuthenticated: Boolean(user && accessToken),
  }
}
