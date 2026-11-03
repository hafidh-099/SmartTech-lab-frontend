import { useState } from 'react'
import { CalendarDays, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CancelDialog } from '@/components/bookings/cancel-dialog'
import { RescheduleDialog } from '@/components/bookings/reschedule-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  useCancelBooking,
  useMyBookings,
  useRequestReschedule,
  type Booking,
  type BookingStatus,
} from '@/hooks/queries/use-bookings'
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/date'

const filters: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

function BookingCard({ booking }: { booking: Booking }) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const cancelMutation = useCancelBooking(booking.id)
  const rescheduleMutation = useRequestReschedule(booking.id)
  const proposedStart = booking.proposedStartTime
  const proposedEnd = booking.proposedEndTime

  return (
    <>
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-base">{booking.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              {booking.priority === 'urgent' && (
                <Badge variant="destructive">Urgent</Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.topic} · {booking.className} · {booking.studentCount}{' '}
            students
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {booking.lab?.name ?? 'Lab not available'}
            </span>
            <span>{formatDate(booking.startTime)}</span>
            <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
          </div>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Requested by {booking.teacher?.fullName ?? 'you'}
          </p>
          {booking.status === 'rejected' && booking.rejectionReason && (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              Rejection reason: {booking.rejectionReason}
            </p>
          )}
          {proposedStart && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
              Reschedule requested:{' '}
              {formatDateTime(proposedStart)}
              {proposedEnd ? ` – ${formatTimeRange(proposedStart, proposedEnd)}` : ''}{' '}
              — pending
              {booking.rescheduleNote ? ` · ${booking.rescheduleNote}` : ''}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          {(booking.status === 'pending' || booking.status === 'approved') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              Cancel
            </Button>
          )}
          {booking.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleOpen(true)}
            >
              Request reschedule
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to={`/teacher/bookings/${booking.id}`}>View details</Link>
          </Button>
        </CardFooter>
      </Card>
      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        booking={booking}
        isPending={cancelMutation.isPending}
        onConfirm={(reason) =>
          cancelMutation.mutate(reason, {
            onSuccess: () => setCancelOpen(false),
          })
        }
      />
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        booking={booking}
        isPending={rescheduleMutation.isPending}
        onSubmit={(values) =>
          rescheduleMutation.mutate(
            {
              newStartTime: values.startTime,
              newEndTime: values.endTime,
              note: values.note,
            },
            { onSuccess: () => setRescheduleOpen(false) },
          )
        }
      />
    </>
  )
}

export default function TeacherBookings() {
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const allCount = useMyBookings({ page: 1, limit: 1 })
  const pendingCount = useMyBookings({
    status: 'pending',
    page: 1,
    limit: 1,
  })
  const approvedCount = useMyBookings({
    status: 'approved',
    page: 1,
    limit: 1,
  })
  const rejectedCount = useMyBookings({
    status: 'rejected',
    page: 1,
    limit: 1,
  })
  const completedCount = useMyBookings({
    status: 'completed',
    page: 1,
    limit: 1,
  })
  const cancelledCount = useMyBookings({
    status: 'cancelled',
    page: 1,
    limit: 1,
  })
  const query = useMyBookings({
    status: status === 'all' ? undefined : status,
    page,
    limit: 10,
  })
  const counts: Record<string, number | undefined> = {
    all: allCount.data?.meta.total,
    pending: pendingCount.data?.meta.total,
    approved: approvedCount.data?.meta.total,
    rejected: rejectedCount.data?.meta.total,
    completed: completedCount.data?.meta.total,
    cancelled: cancelledCount.data?.meta.total,
  }
  const countQueries = [
    allCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    completedCount,
    cancelledCount,
  ]
  const countError = countQueries.find((item) => item.isError)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        description="View and manage your lab session requests."
        action={
          <Button asChild>
            <Link to="/teacher/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
        }
      />
      {countError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          Could not load booking counts: {countError.error.message}
        </p>
      )}
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value === 'all' ? 'all' : (value as BookingStatus))
          setPage(1)
        }}
      >
        <div className="overflow-x-auto">
          <TabsList className="h-auto min-w-max">
            {filters.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label} ({counts[filter.value] ?? '—'})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      {query.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">Could not load bookings</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.error.message}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : query.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={`booking-skeleton-${index}`}>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.data?.data.length ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {query.data.data.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
          {query.data.meta.totalPages > 1 && (
            <Pagination
              page={query.data.meta.page}
              totalPages={query.data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="No bookings yet"
          description="Create your first lab booking request."
          icon={CalendarDays}
          action={
            <Button asChild>
              <Link to="/teacher/bookings/new">Create a booking</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
