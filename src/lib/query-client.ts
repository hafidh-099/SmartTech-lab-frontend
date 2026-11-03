import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/types/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, error: unknown) => {
        if (
          isApiError(error) &&
          [401, 403, 404].includes(error.status ?? 0)
        ) {
          return false
        }
        return count < 2
      },
    },
  },
})
