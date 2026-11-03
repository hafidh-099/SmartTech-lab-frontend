import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { isApiError } from '@/types/api'

export type EquipmentStatus =
  | 'operational'
  | 'maintenance'
  | 'broken'
  | 'retired'

export interface Equipment {
  id: string
  name: string
  serialNumber: string | null
  category: string | null
  lastServiceDate: string | null
  nextServiceDate: string | null
  status: EquipmentStatus
  createdAt: string
  updatedAt: string
}

export interface EquipmentServiceLog {
  id: string
  action: string
  reason: string | null
  notes?: string | null
  createdAt: string
  user?: { id: string; fullName: string } | null
}

export interface EquipmentDetail extends Equipment {
  serviceLogs: EquipmentServiceLog[]
}

export interface EquipmentPage {
  data: Equipment[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface EquipmentQueryParams {
  search?: string
  status?: EquipmentStatus
  page?: number
  limit?: number
}

export interface CreateEquipmentBody {
  name: string
  serialNumber?: string
  category?: string
  lastServiceDate?: string
  nextServiceDate?: string
}

export interface UpdateEquipmentBody {
  name?: string
  serialNumber?: string | null
  category?: string | null
  lastServiceDate?: string | null
  nextServiceDate?: string | null
  status?: EquipmentStatus
}

export interface ServiceEquipmentBody {
  servicedAt: string
  notes?: string
  nextServiceDate?: string
}

function showMutationError(error: unknown, fallback: string) {
  toast.error(isApiError(error) ? error.message : fallback)
}

export function useEquipment(params: EquipmentQueryParams) {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: async () => {
      const response = await api.get<EquipmentPage>('/equipment', { params })
      return response.data
    },
  })
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const response = await api.get<EquipmentDetail>(`/equipment/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useCreateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateEquipmentBody) => {
      const response = await api.post<Equipment>('/equipment', body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Equipment created')
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not create equipment'),
  })
}

export function useUpdateEquipment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateEquipmentBody) => {
      const response = await api.patch<Equipment>(`/equipment/${id}`, body)
      return response.data
    },
    onSuccess: () => {
      toast.success('Equipment updated')
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not update equipment'),
  })
}

export function useServiceEquipment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: ServiceEquipmentBody) => {
      const response = await api.post<Equipment>(
        `/equipment/${id}/service`,
        body,
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Service recorded')
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    },
    onError: (error: unknown) =>
      showMutationError(error, 'Could not record equipment service'),
  })
}
