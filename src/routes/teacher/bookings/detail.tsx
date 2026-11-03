import { useState } from 'react'
import { ArrowLeft, CalendarDays, FlaskConical, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CancelDialog } from '@/components/bookings/cancel-dialog'
import { RescheduleDialog } from '@/components/bookings/reschedule-dialog'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useBooking,
  useCancelBooking,
  useRequestReschedule,
} from '@/hooks/queries/use-bookings'
import { formatDateTime, formatTimeRange } from '@/lib/date'

export default function TeacherBookingDetail() {
  const { id = '' } = useParams()
  const query = useBooking(id)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const cancelMutation = useCancelBooking(id)
  const rescheduleMutation = useRequestReschedule(id)

  if (query.isLoading) return <DashboardSkeleton sections={2} />
  if (query.isError || !query.data) {
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-card p-6"
        role="alert"
      >
        <p className="text-sm text-destructive">
          {query.error?.message ?? 'Could not load booking details'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  const booking = query.data
  const canCancel =
    booking.status === 'pending' || booking.status === 'approved'
  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.title}
        description="Booking request details and status."
        action={
          <Button variant="outline" asChild>
            <Link to="/teacher/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My bookings
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={booking.status} />
        {booking.priority === 'urgent' && (
          <Badge variant="destructive">Urgent</Badge>
        )}
      </div>
      {booking.status === 'rejected' && booking.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">Rejection reason</p>
          <p className="mt-1">{booking.rejectionReason}</p>
        </div>
      )}
      {booking.proposedStartTime && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">Reschedule requested — pending</p>
          <p className="mt-1">
            {formatDateTime(booking.proposedStartTime)}
            {booking.proposedEndTime
              ? ` · ${formatTimeRange(booking.proposedStartTime, booking.proposedEndTime)}`
              : ''}
          </p>
          {booking.rescheduleNote && (
            <p className="mt-1">{booking.rescheduleNote}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session information</CardTitle>
            <CardDescription>Class, lab, and requested lesson.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Topic</dt>
                <dd className="mt-1 font-medium">{booking.topic}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Class</dt>
                <dd className="mt-1 font-medium">{booking.className}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Students</dt>
                <dd className="mt-1 inline-flex items-center gap-1 font-medium">
                  <Users className="h-4 w-4" />
                  {booking.studentCount}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lab</dt>
                <dd className="mt-1 font-medium">
                  {booking.lab?.name ?? 'Lab not available'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Teacher</dt>
                <dd className="mt-1 font-medium">
                  {booking.teacher?.fullName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="mt-1 font-medium">
                  {formatDateTime(booking.createdAt)}
                </dd>
              </div>
            </dl>
            {booking.description && (
              <div className="border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {booking.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>
              All times are displayed in East Africa Time (EAT).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border p-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Start</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(booking.startTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">End</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(booking.endTime)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Duration: {formatTimeRange(booking.startTime, booking.endTime)}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-primary" />
              Requested items
            </CardTitle>
            <CardDescription>
              Items specified to help the technician prepare.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {booking.items.length === 0 ? (
              <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
                No items were specified for this booking.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Item</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 text-right font-medium">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.items.map((item, index) => {
                      const name =
                        item.chemical?.name ??
                        item.equipment?.name ??
                        'Unavailable item'
                      const type = item.chemicalId
                        ? 'Chemical'
                        : item.equipmentId
                          ? 'Equipment'
                          : 'Item'
                      return (
                        <tr
                          key={item.id ?? `${item.chemicalId ?? item.equipmentId}-${index}`}
                          className="border-b last:border-0"
                        >
                          <td className="p-3 font-medium">{name}</td>
                          <td className="p-3">{type}</td>
                          <td className="p-3 text-right">
                            {Number(item.quantity).toLocaleString()} {item.unit}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {canCancel && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
              >
                Cancel booking
              </Button>
              {booking.status === 'approved' && (
                <Button
                  variant="outline"
                  onClick={() => setRescheduleOpen(true)}
                >
                  Request reschedule
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
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
    </div>
  )
}
