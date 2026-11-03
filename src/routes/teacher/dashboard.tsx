import { CalendarDays, CheckCircle2, Clock, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { EmptyChart } from '@/components/dashboard/empty-chart'
import { SectionCard } from '@/components/dashboard/section-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTeacherDashboard } from '@/hooks/queries/use-dashboard'
import { formatDate, formatDateTime } from '@/lib/date'

export default function TeacherDashboard() {
  const { data, isLoading, isError, refetch } = useTeacherDashboard()

  if (isLoading) return <DashboardSkeleton stats={3} sections={1} />
  if (isError || !data) return <DashboardError onRetry={() => void refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="Your lab booking overview"
        action={
          <Button asChild>
            <Link to="/teacher/bookings/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Booking
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Upcoming"
          value={data.upcomingCount}
          icon={CalendarDays}
          description="Approved and scheduled"
        />
        <StatCard
          title="Pending"
          value={data.pendingCount}
          icon={Clock}
          description="Awaiting approval"
        />
        <StatCard
          title="Completed"
          value={data.completedCount}
          icon={CheckCircle2}
          description="All time"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Upcoming Bookings"
          description="Your next approved lab sessions"
        >
          {data.upcoming.length === 0 ? (
            <EmptyChart
              icon={CalendarDays}
              message="No upcoming bookings"
            />
          ) : (
            <div className="space-y-2">
              {data.upcoming.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {booking.topic || booking.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(booking.startTime)} ·{' '}
                      {booking.lab?.name ?? 'Lab not set'} · {booking.className}
                    </p>
                  </div>
                  <Badge className="shrink-0">approved</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Bookings"
          description="Your requests from the last 90 days"
        >
          {data.recent.length === 0 ? (
            <EmptyChart icon={Clock} message="No recent bookings" />
          ) : (
            <div className="space-y-2">
              {data.recent.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {booking.topic || booking.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.startTime)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      booking.status === 'approved' ||
                      booking.status === 'completed'
                        ? 'default'
                        : booking.status === 'pending'
                          ? 'secondary'
                          : booking.status === 'rejected' ||
                              booking.status === 'cancelled'
                            ? 'destructive'
                            : 'outline'
                    }
                    className="shrink-0 capitalize"
                  >
                    {booking.status}
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
