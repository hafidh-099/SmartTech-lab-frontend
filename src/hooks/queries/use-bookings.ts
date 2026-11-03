import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { isApiError } from '@/types/api'

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'

export interface BookingItem {
  id?: string
  chemicalId?: string | null
  equipmentId?: string | null
  quantity: number | string
  unit: string
  chemical?: {
    id: string
    name: string
    unit: string
    status?: string
    currentQuantity?: string | number
  } | null
  equipment?: { id: string; name: string; status?: string } | null
}

export interface BookingWarning {
  type: string
  name?: string
  message: string
}

export interface Booking {
  id: string
  title: string
  topic: string
  className: string
  studentCount: number
  description: string | null
  startTime: string
  endTime: string
  priority: 'normal' | 'urgent'
  status: BookingStatus
  rejectionReason: string | null
  proposedStartTime: string | null
  proposedEndTime: string | null
  rescheduleNote?: string | null
  rescheduleRequestedAt?: string | null
  lab: { id: string; name: string; location?: string | null }
  teacher: { id: string; fullName: string }
  items: BookingItem[]
  warnings?: BookingWarning[]
  createdAt: string
}

export interface BookingPage {
  data: Booking[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface Lab {
  id: string
  name: string
  location: string | null
  capacity: number | null
  isActive: boolean
}

export interface CreateBookingBody {
  labId: string
  title: string
  topic: string
  className: string
  studentCount: number
  description?: string
  startTime: string
  endTime: string
  priority: 'normal' | 'urgent'
  items: {
    chemicalId?: string
    equipmentId?: string
    quantity: number
    unit: string
  }[]
}

function showMutationError(error: unknown, fallback: string) {
  toast.error(isApiError(error) ? error.message : fallback)
}

export function useMyBookings(params: {
  status?: BookingStatus
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['bookings', 'my', params],
    queryFn: async () => {
      const response = await api.get<BookingPage>('/lab-bookings', { params })
      return response.data
    },
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.get<Booking>(`/lab-bookings/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useLabs() {
  return useQuery({
    queryKey: ['labs'],
    queryFn: async () => {
      const response = await api.get<Lab[]>('/labs')
      return response.data
    },
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateBookingBody) => {
      const response = await api.post<Booking>('/lab-bookings', body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Booking request submitted')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not submit booking request'),
  })
}

export function useCancelBooking(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reason: string) => {
      const response = await api.patch<Booking>(`/lab-bookings/${id}/cancel`, {
        reason,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Booking cancelled')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not cancel booking'),
  })
}

export function useRequestReschedule(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      newStartTime: string
      newEndTime: string
      note?: string
    }) => {
      const response = await api.patch<Booking>(
        `/lab-bookings/${id}/reschedule-request`,
        body,
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Reschedule requested')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not request reschedule'),
  })
}
