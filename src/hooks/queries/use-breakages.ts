import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { isApiError } from '@/types/api'

export type BreakageItemType = 'glassware' | 'equipment' | 'chemical'
export type BreakageStatus = 'unpaid' | 'paid' | 'waived'

export interface Breakage {
  id: string
  itemType: BreakageItemType
  itemName: string
  studentName: string
  studentClass: string
  quantity: number
  penaltyAmount: string
  penaltyPaidAmount: string
  status: BreakageStatus
  notes: string | null
  waiverReason: string | null
  createdAt: string
  loggedBy: { id: string; fullName: string }
  chemical?: { id: string; name: string } | null
  equipment?: { id: string; name: string } | null
}

export interface BreakagePage {
  data: Breakage[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface BreakageSummary {
  totalPenalties: number
  totalPaid: number
  totalUnpaid: number
  totalWaived: number
  countByStatus: Record<BreakageStatus, number>
  topStudents: {
    studentName: string
    studentClass: string
    totalOwed: number
    count: number
  }[]
}

export interface BreakageQueryParams {
  status?: BreakageStatus
  studentName?: string
  studentClass?: string
  itemType?: BreakageItemType
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface CreateBreakageBody {
  itemType: BreakageItemType
  itemName: string
  chemicalId?: string
  equipmentId?: string
  studentName: string
  studentClass: string
  quantity: number
  penaltyAmount: number
  notes?: string
}

export interface StudentBreakages {
  breakages: Breakage[]
  summary: { totalOwed: number; totalPaid: number; count: number }
}

function showMutationError(error: unknown, fallback: string) {
  toast.error(isApiError(error) ? error.message : fallback)
}

export function useBreakages(params: BreakageQueryParams) {
  return useQuery({
    queryKey: ['breakages', params],
    queryFn: async () => {
      const response = await api.get<BreakagePage>('/breakages', { params })
      return response.data
    },
  })
}

export function useBreakage(id: string) {
  return useQuery({
    queryKey: ['breakages', id],
    queryFn: async () => {
      const response = await api.get<Breakage>(`/breakages/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useBreakageSummary(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ['breakages', 'summary', params],
    queryFn: async () => {
      const response = await api.get<BreakageSummary>('/breakages/summary', {
        params,
      })
      return response.data
    },
  })
}

export function useStudentBreakages(studentName: string, studentClass?: string) {
  return useQuery({
    queryKey: ['breakages', 'student', studentName, studentClass],
    queryFn: async () => {
      const response = await api.get<StudentBreakages>(
        `/breakages/student/${encodeURIComponent(studentName)}`,
        { params: { studentClass } },
      )
      return response.data
    },
    enabled: Boolean(studentName),
  })
}

export function useLogBreakage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateBreakageBody) => {
      const response = await api.post<Breakage>('/breakages', body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Breakage logged')
      void queryClient.invalidateQueries({ queryKey: ['breakages'] })
      void queryClient.invalidateQueries({ queryKey: ['chemicals'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not log breakage'),
  })
}

export function usePayBreakage(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { amount: number; note?: string }) => {
      const response = await api.patch<Breakage>(`/breakages/${id}/pay`, body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Payment recorded')
      void queryClient.invalidateQueries({ queryKey: ['breakages'] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not record payment'),
  })
}

export function useWaiveBreakage(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reason: string) => {
      const response = await api.patch<Breakage>(`/breakages/${id}/waive`, {
        reason,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Penalty waived')
      void queryClient.invalidateQueries({ queryKey: ['breakages'] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not waive penalty'),
  })
}
