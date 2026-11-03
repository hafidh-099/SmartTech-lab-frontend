import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/user'
import type { ApiEnvelope } from '@/types/api'
import type { RefreshedTokens } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (data: {
    user: AuthUser
    accessToken: string
    refreshToken: string
  }) => void
  clear: () => void
  refreshTokens: () => Promise<string | null>
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
      refreshTokens: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken) return null

        try {
          const response = await axios.post<
            ApiEnvelope<RefreshedTokens> | RefreshedTokens
          >(`${apiBaseUrl}/auth/refresh`, { refreshToken })
          const tokens =
            'data' in response.data ? response.data.data : response.data

          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          })
          return tokens.accessToken
        } catch {
          set({ user: null, accessToken: null, refreshToken: null })
          return null
        }
      },
    }),
    {
      name: 'smarttech-auth',
      // TODO: Replace persisted refresh tokens with an httpOnly cookie before production.
      partialize: ({ user, accessToken, refreshToken }) => ({
        user,
        accessToken,
        refreshToken,
      }),
    },
  ),
)
