import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type {
  Booking,
  BookingPage,
  BookingStatus,
} from '@/hooks/queries/use-bookings'

export interface BookingFilters {
  status?: BookingStatus
  labId?: string
  date?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export function useBookings(
  filters: BookingFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['bookings', 'list', filters],
    queryFn: async () => {
      const response = await api.get<BookingPage>('/lab-bookings', {
        params: filters,
      })
      return response.data
    },
    enabled,
  })
}

export function useTodayBookings(enabled = true) {
  return useQuery({
    queryKey: ['bookings', 'today'],
    queryFn: async () => {
      const response = await api.get<Booking[]>('/lab-bookings/today')
      return response.data
    },
    enabled,
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', 'detail', id],
    queryFn: async () => {
      const response = await api.get<Booking>(`/lab-bookings/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

function useBookingAction<TBody>(action: string, successMessage: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: TBody & { id: string }) => {
      const response = await api.patch<Booking>(
        `/lab-bookings/${id}/${action}`,
        body,
      )
      return response.data
    },
    onSuccess: (_booking, variables) => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({
        queryKey: ['bookings', 'detail', variables.id],
      })
      void queryClient.invalidateQueries({
        queryKey: ['booking', variables.id],
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useApproveBooking() {
  return useBookingAction<{ note?: string }>(
    'approve',
    'Booking approved',
  )
}

export function useRejectBooking() {
  return useBookingAction<{ reason: string }>(
    'reject',
    'Booking rejected',
  )
}

export function useCompleteBooking() {
  return useBookingAction<{ deductInventory: boolean; note?: string }>(
    'complete',
    'Booking completed',
  )
}
