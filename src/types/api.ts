export interface ApiEnvelope<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  status?: number
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
}
