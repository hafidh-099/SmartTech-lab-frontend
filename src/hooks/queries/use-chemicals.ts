import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { isApiError } from '@/types/api'

export type ChemicalStatus = 'safe' | 'low' | 'critical' | 'expired'
export type ChemicalUnit = 'g' | 'mL' | 'L' | 'mol'

export interface Chemical {
  id: string
  name: string
  formula: string | null
  unit: ChemicalUnit
  currentQuantity: number | string
  minThreshold: number | string
  expiryDate: string | null
  status: ChemicalStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ChemicalInventoryLog {
  id: string
  action: string
  quantity: number | string
  reason: string | null
  referenceType: string | null
  referenceId: string | null
  createdAt: string
  user?: { id: string; fullName: string } | null
}

export interface ChemicalDetail extends Chemical {
  inventoryLogs: ChemicalInventoryLog[]
}

export interface ChemicalPage {
  data: Chemical[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ChemicalQueryParams {
  search?: string
  status?: ChemicalStatus
  page?: number
  limit?: number
  includeInactive?: boolean
}

export interface CreateChemicalBody {
  name: string
  formula?: string
  unit: ChemicalUnit
  currentQuantity: number
  minThreshold: number
  expiryDate?: string
}

export interface UpdateChemicalBody {
  name: string
  formula: string | null
  unit: ChemicalUnit
  minThreshold: number
  expiryDate: string | null
}

export interface RestockChemicalBody {
  quantity: number
  reason: string
}

function showMutationError(error: unknown, fallback: string) {
  toast.error(isApiError(error) ? error.message : fallback)
}

export function useChemicals(params: ChemicalQueryParams) {
  return useQuery({
    queryKey: ['chemicals', params],
    queryFn: async () => {
      const response = await api.get<ChemicalPage>('/chemicals', { params })
      return response.data
    },
  })
}

export function useChemical(id: string) {
  return useQuery({
    queryKey: ['chemical', id],
    queryFn: async () => {
      const response = await api.get<ChemicalDetail>(`/chemicals/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useChemicalAlerts() {
  return useQuery({
    queryKey: ['chemicals', 'alerts'],
    queryFn: async () => {
      const response = await api.get<ChemicalPage>('/chemicals/alerts', {
        params: { page: 1, limit: 100 },
      })
      return response.data
    },
  })
}

export function useExpiringChemicals(days = 30) {
  return useQuery({
    queryKey: ['chemicals', 'expiring', days],
    queryFn: async () => {
      const response = await api.get<ChemicalPage>('/chemicals/expiring', {
        params: { page: 1, limit: 100, days },
      })
      return response.data
    },
  })
}

export function useCreateChemical() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateChemicalBody) => {
      const response = await api.post<Chemical>('/chemicals', body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Chemical created')
      void queryClient.invalidateQueries({ queryKey: ['chemicals'] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not create chemical'),
  })
}

export function useUpdateChemical(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateChemicalBody) => {
      const response = await api.patch<Chemical>(`/chemicals/${id}`, body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Chemical updated')
      void queryClient.invalidateQueries({ queryKey: ['chemicals'] })
      void queryClient.invalidateQueries({ queryKey: ['chemical', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not update chemical'),
  })
}

export function useRestockChemical(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: RestockChemicalBody) => {
      const response = await api.post<Chemical>(
        `/chemicals/${id}/restock`,
        body,
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Stock added')
      void queryClient.invalidateQueries({ queryKey: ['chemicals'] })
      void queryClient.invalidateQueries({ queryKey: ['chemical', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not add chemical stock'),
  })
}

export function useDeactivateChemical(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => api.delete(`/chemicals/${id}`),
    onSuccess: () => {
      toast.success('Chemical deactivated')
      void queryClient.invalidateQueries({ queryKey: ['chemicals'] })
      void queryClient.invalidateQueries({ queryKey: ['chemical', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not deactivate chemical'),
  })
}
