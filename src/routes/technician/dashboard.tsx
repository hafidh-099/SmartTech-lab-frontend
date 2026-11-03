import {
  CalendarDays,
  Clock,
  FlaskConical,
  Wrench,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { EmptyChart } from '@/components/dashboard/empty-chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { AlertsBanner } from '@/components/chemicals/alerts-banner'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTechnicianDashboard } from '@/hooks/queries/use-dashboard'
import { useTheme } from '@/hooks/use-theme'

function getDaysUntilExpiry(expiryDate: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000),
  )
}

export default function TechnicianDashboard() {
  const { data, isLoading, isError, refetch } = useTechnicianDashboard()
  const { resolvedTheme } = useTheme()
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#475569'
  const gridColor = resolvedTheme === 'dark' ? '#334155' : '#e2e8f0'

  if (isLoading) return <DashboardSkeleton sections={2} />
  if (isError || !data) return <DashboardError onRetry={() => void refetch()} />

  const pendingToday = data.todayBookings.filter(
    (booking) => booking.status === 'pending',
  )
  const alertChart = [
    {
      name: 'Low',
      value: data.alerts.filter((chemical) => chemical.status === 'low').length,
    },
    {
      name: 'Critical',
      value: data.alerts.filter((chemical) => chemical.status === 'critical')
        .length,
    },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technician Dashboard"
        description="Your lab today at a glance"
      />

      <AlertsBanner
        stockAlerts={data.alertTotal}
        expiring={data.expiringTotal}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Bookings"
          value={data.todayBookings.length}
          icon={CalendarDays}
          description={`${pendingToday.length} pending`}
        />
        <StatCard
          title="Stock Alerts"
          value={data.alertTotal}
          icon={FlaskConical}
          description="Low or critical"
        />
        <StatCard
          title="Equipment Maintenance"
          value={data.maintenanceTotal}
          icon={Wrench}
          description="Needs attention"
        />
        <StatCard
          title="Expiring Soon"
          value={data.expiringTotal}
          icon={Clock}
          description="Within 30 days"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Today's Bookings"
          description="Today's lab sessions"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/technician/bookings">View all</Link>
            </Button>
          }
        >
          {data.todayBookings.length === 0 ? (
            <EmptyChart
              icon={CalendarDays}
              message="No bookings scheduled for today"
            />
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto">
              {data.todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {booking.topic || booking.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {format(new Date(booking.startTime), 'p')} –{' '}
                      {format(new Date(booking.endTime), 'p')} ·{' '}
                      {booking.lab?.name ?? 'Lab not set'} · {booking.className}
                    </p>
                  </div>
                  <Badge
                    variant={
                      booking.status === 'pending'
                        ? 'secondary'
                        : booking.status === 'rejected' ||
                            booking.status === 'cancelled'
                          ? 'destructive'
                          : 'default'
                    }
                    className="shrink-0"
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Chemical Alerts"
          description={`Low and critical stock · showing ${data.alerts.length} of ${data.alertTotal}`}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/technician/chemicals">View all</Link>
            </Button>
          }
        >
          {alertChart.length === 0 ? (
            <EmptyChart icon={FlaskConical} message="No stock alerts" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={alertChart}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  opacity={0.7}
                />
                <XAxis dataKey="name" stroke={axisColor} />
                <YAxis allowDecimals={false} stroke={axisColor} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Equipment in Maintenance"
          description="Items currently being repaired"
        >
          {data.maintenanceEquipment.length === 0 ? (
            <EmptyChart
              icon={Wrench}
              message="No equipment in maintenance"
            />
          ) : (
            <div className="space-y-2">
              {data.maintenanceEquipment.map((equipment) => (
                <div
                  key={equipment.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{equipment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Next service:{' '}
                      {equipment.nextServiceDate
                        ? format(new Date(equipment.nextServiceDate), 'PP')
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <Badge variant="outline">{equipment.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Chemicals Expiring Within 30 Days"
          description="Plan usage or reorder"
        >
          {data.expiringChemicals.length === 0 ? (
            <EmptyChart icon={Clock} message="No expiring chemicals" />
          ) : (
            <div className="space-y-2">
              {data.expiringChemicals.map((chemical) => (
                <div
                  key={chemical.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{chemical.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires{' '}
                      {chemical.expiryDate
                        ? format(new Date(chemical.expiryDate), 'PP')
                        : 'on an unknown date'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {chemical.expiryDate
                      ? `${getDaysUntilExpiry(chemical.expiryDate)}d`
                      : 'Expiring'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
