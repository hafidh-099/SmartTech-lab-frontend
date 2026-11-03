import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import type { ApiError } from '@/types/api'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = useAuthStore
      .getState()
      .refreshTokens()
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function normalizeError(error: AxiosError): ApiError {
  const responseBody = error.response?.data
  const body =
    typeof responseBody === 'object' && responseBody !== null
      ? (responseBody as {
          error?: { code?: string; message?: string }
          message?: string
        })
      : undefined

  return {
    code: body?.error?.code ?? 'UNKNOWN',
    message:
      body?.error?.message ??
      body?.message ??
      error.message ??
      'Something went wrong',
    status: error.response?.status,
  }
}

api.interceptors.response.use(
  (response) => {
    const body: unknown = response.data
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      'data' in body
    ) {
      response.data = body.data
    }
    return response
  },
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (
      original &&
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }

    return Promise.reject(normalizeError(error))
  },
)
