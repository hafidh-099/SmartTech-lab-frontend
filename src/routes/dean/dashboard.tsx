import {
  Activity,
  AlertTriangle,
  FlaskConical,
  Mail,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { EmptyChart } from '@/components/dashboard/empty-chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeanDashboard } from '@/hooks/queries/use-dashboard'
import { useTheme } from '@/hooks/use-theme'

const BREAKAGE_COLORS = ['#3b82f6', '#22c55e', '#eab308']

export default function DeanDashboard() {
  const { data, isLoading, isError, refetch } = useDeanDashboard()
  const { resolvedTheme } = useTheme()
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#475569'
  const gridColor = resolvedTheme === 'dark' ? '#334155' : '#e2e8f0'
  const primaryColor = resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return <DashboardError onRetry={() => void refetch()} />

  const { breakageSummary } = data
  const breakageChart = [
    { name: 'Paid', value: Number(breakageSummary.totalPaid) },
    { name: 'Unpaid', value: Number(breakageSummary.totalUnpaid) },
    { name: 'Waived', value: Number(breakageSummary.totalWaived) },
  ].filter((item) => item.value > 0)
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
        title="Dean Dashboard"
        description="Overview of your school's laboratory operations"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="School Members"
          value={data.userCount}
          icon={Users}
          description="Active staff"
        />
        <StatCard
          title="Active Invitations"
          value={data.invitationCount}
          icon={Mail}
          description="Available for onboarding"
        />
        <StatCard
          title="Pending Bookings"
          value={data.pendingBookingCount}
          icon={AlertTriangle}
          description="Awaiting technician"
        />
        <StatCard
          title="Outstanding Penalties"
          value={`TZS ${Number(breakageSummary.totalUnpaid).toLocaleString()}`}
          icon={Wallet}
          description="Unpaid breakages"
        />
      </div>

      <SectionCard
        title="Lab Utilization"
        description="How actively your labs are being used (last 30 days)"
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Utilization Rate
            </p>
            <p className="mt-1 text-3xl font-bold">
              {data.utilization.utilizationRate}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.utilization.totalBookings} total bookings
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Most Active Lab
            </p>
            <p className="mt-1 truncate text-lg font-semibold">
              {data.utilization.mostActiveLab?.labName ?? '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.utilization.mostActiveLab?.bookingCount ?? 0} bookings
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Least Active Lab
            </p>
            <p className="mt-1 truncate text-lg font-semibold">
              {data.utilization.leastActiveLab?.labName ?? '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.utilization.leastActiveLab?.bookingCount ?? 0} bookings
            </p>
          </div>
        </div>

        {data.utilization.totalBookings === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Activity className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No bookings recorded yet</p>
            <p className="mt-1 text-sm">
              Your labs will appear here once teachers start booking.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-3 text-sm font-medium">Bookings per Lab</p>
                {data.utilization.byLab.length === 0 ? (
                  <EmptyChart icon={Activity} message="No active labs yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={data.utilization.byLab}
                      layout="vertical"
                      margin={{ left: 8, right: 12 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridColor}
                        opacity={0.7}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke={axisColor}
                      />
                      <YAxis
                        dataKey="labName"
                        type="category"
                        width={110}
                        tick={{ fontSize: 12 }}
                        stroke={axisColor}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="bookingCount"
                        name="Bookings"
                        fill={primaryColor}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-3 text-sm font-medium">
                  Bookings Trend (30 days)
                </p>
                {data.utilization.dailyTrend.length === 0 ? (
                  <EmptyChart icon={TrendingUp} message="No activity yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.utilization.dailyTrend}>
                      <defs>
                        <linearGradient
                          id="utilizationTrendFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={primaryColor}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={primaryColor}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridColor}
                        opacity={0.7}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={axisColor}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(date: string) =>
                          format(parseISO(date), 'MMM d')
                        }
                        interval="preserveStartEnd"
                      />
                      <YAxis allowDecimals={false} stroke={axisColor} />
                      <Tooltip
                        labelFormatter={(date) =>
                          format(parseISO(String(date)), 'EEEE, MMM d')
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Bookings"
                        stroke={primaryColor}
                        strokeWidth={2}
                        fill="url(#utilizationTrendFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {data.utilization.byStatus.map((row) => (
                <Badge key={row.status} variant="outline" className="capitalize">
                  {row.status}: {row.count}
                </Badge>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Breakage Financials"
          description="Paid vs unpaid vs waived"
        >
          {breakageChart.length === 0 ? (
            <EmptyChart icon={Wallet} message="No breakage data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={breakageChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {breakageChart.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={BREAKAGE_COLORS[index % BREAKAGE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `TZS ${Number(value).toLocaleString()}`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="Chemical Alerts"
          description={`Low and critical stock · showing ${data.alerts.length} of ${data.alertTotal}`}
        >
          {alertChart.length === 0 ? (
            <EmptyChart icon={FlaskConical} message="All chemicals are safe" />
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

      <SectionCard
        title="Pending Bookings"
        description="Bookings waiting for technician approval"
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/dean/bookings">View all</Link>
          </Button>
        }
      >
        {data.pendingBookings.length === 0 ? (
          <EmptyChart icon={AlertTriangle} message="No pending bookings" />
        ) : (
          <div className="space-y-2">
            {data.pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {booking.topic || booking.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {booking.className} · {booking.lab?.name ?? 'Lab not set'}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {format(new Date(booking.startTime), 'PP')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
