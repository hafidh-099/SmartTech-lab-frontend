import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface PageMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Page<T> {
  data: T[]
  meta: PageMeta
}

interface UserRecord {
  id: string
  fullName: string
  status: string
}

interface InvitationRecord {
  id: string
  status: string
}

interface ChemicalRecord {
  id: string
  name: string
  status: 'safe' | 'low' | 'critical' | 'expired'
  currentQuantity: number | string
  minThreshold: number | string
  unit: string
  expiryDate: string | null
}

interface EquipmentRecord {
  id: string
  name: string
  status: string
  nextServiceDate: string | null
}

interface BookingRecord {
  id: string
  title: string
  topic: string
  className: string
  studentCount: number
  startTime: string
  endTime: string
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'
  lab?: { name: string } | null
  createdAt: string
}

interface BreakageSummary {
  totalPenalties: number | string
  totalPaid: number | string
  totalUnpaid: number | string
  totalWaived: number | string
}

export interface LabUtilization {
  period: { from: string; to: string }
  totalBookings: number
  utilizationRate: number
  byLab: {
    labId: string
    labName: string
    bookingCount: number
  }[]
  byStatus: {
    status: BookingRecord['status']
    count: number
  }[]
  dailyTrend: {
    date: string
    count: number
  }[]
  mostActiveLab: LabUtilization['byLab'][number] | null
  leastActiveLab: LabUtilization['byLab'][number] | null
}

interface DeanDashboardData {
  userCount: number
  invitationCount: number
  alerts: ChemicalRecord[]
  alertTotal: number
  pendingBookings: BookingRecord[]
  pendingBookingCount: number
  breakageSummary: BreakageSummary
  utilization: LabUtilization
}

interface TechnicianDashboardData {
  todayBookings: BookingRecord[]
  alerts: ChemicalRecord[]
  alertTotal: number
  maintenanceEquipment: EquipmentRecord[]
  maintenanceTotal: number
  expiringChemicals: ChemicalRecord[]
  expiringTotal: number
}

interface TeacherDashboardData {
  upcoming: BookingRecord[]
  upcomingCount: number
  pending: BookingRecord[]
  pendingCount: number
  completedCount: number
  recent: BookingRecord[]
}

export function useDeanDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'dean'],
    queryFn: async (): Promise<DeanDashboardData> => {
      const [usersResponse, invitationsResponse] = await Promise.all([
        api.get<Page<UserRecord>>('/users', {
          params: { limit: 1, status: 'active' },
        }),
        api.get<Page<InvitationRecord>>('/invitations', {
          params: { limit: 1, status: 'active' },
        }),
      ])
      const [alertsResponse, bookingsResponse] = await Promise.all([
        api.get<Page<ChemicalRecord>>('/chemicals/alerts', {
          params: { limit: 100 },
        }),
        api.get<Page<BookingRecord>>('/lab-bookings', {
          params: { status: 'pending', limit: 5 },
        }),
      ])
      const [breakageResponse, utilizationResponse] = await Promise.all([
        api.get<BreakageSummary>('/breakages/summary'),
        api.get<LabUtilization>('/lab-bookings/utilization', {
          params: { days: 30 },
        }),
      ])

      return {
        userCount: usersResponse.data.meta.total,
        invitationCount: invitationsResponse.data.meta.total,
        alerts: alertsResponse.data.data,
        alertTotal: alertsResponse.data.meta.total,
        pendingBookings: bookingsResponse.data.data,
        pendingBookingCount: bookingsResponse.data.meta.total,
        breakageSummary: breakageResponse.data,
        utilization: utilizationResponse.data,
      }
    },
  })
}

export function useLabUtilization(days = 30) {
  return useQuery({
    queryKey: ['dashboard', 'utilization', days],
    queryFn: async () => {
      const response = await api.get<LabUtilization>(
        '/lab-bookings/utilization',
        { params: { days } },
      )
      return response.data
    },
  })
}

export function useTechnicianDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'technician'],
    queryFn: async (): Promise<TechnicianDashboardData> => {
      const [todayResponse, alertsResponse] = await Promise.all([
        api.get<BookingRecord[]>('/lab-bookings/today'),
        api.get<Page<ChemicalRecord>>('/chemicals/alerts', {
          params: { limit: 100 },
        }),
      ])
      const [equipmentResponse, expiringResponse] = await Promise.all([
        api.get<Page<EquipmentRecord>>('/equipment', {
          params: { status: 'maintenance', limit: 100 },
        }),
        api.get<Page<ChemicalRecord>>('/chemicals/expiring', {
          params: { days: 30, limit: 100 },
        }),
      ])

      return {
        todayBookings: todayResponse.data,
        alerts: alertsResponse.data.data,
        alertTotal: alertsResponse.data.meta.total,
        maintenanceEquipment: equipmentResponse.data.data,
        maintenanceTotal: equipmentResponse.data.meta.total,
        expiringChemicals: expiringResponse.data.data,
        expiringTotal: expiringResponse.data.meta.total,
      }
    },
    refetchInterval: 60_000,
  })
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: async (): Promise<TeacherDashboardData> => {
      const now = new Date()
      const ninetyDaysAgo = new Date(now)
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const [upcomingResponse, pendingResponse] = await Promise.all([
        api.get<Page<BookingRecord>>('/lab-bookings', {
          params: {
            status: 'approved',
            from: now.toISOString(),
            limit: 5,
          },
        }),
        api.get<Page<BookingRecord>>('/lab-bookings', {
          params: { status: 'pending', limit: 1 },
        }),
      ])
      const [completedResponse, recentResponse] = await Promise.all([
        api.get<Page<BookingRecord>>('/lab-bookings', {
          params: { status: 'completed', limit: 1 },
        }),
        api.get<Page<BookingRecord>>('/lab-bookings', {
          params: {
            from: ninetyDaysAgo.toISOString(),
            to: now.toISOString(),
            limit: 100,
          },
        }),
      ])

      return {
        upcoming: upcomingResponse.data.data,
        upcomingCount: upcomingResponse.data.meta.total,
        pending: pendingResponse.data.data,
        pendingCount: pendingResponse.data.meta.total,
        completedCount: completedResponse.data.meta.total,
        recent: [...recentResponse.data.data]
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          )
          .slice(0, 5),
      }
    },
  })
}
