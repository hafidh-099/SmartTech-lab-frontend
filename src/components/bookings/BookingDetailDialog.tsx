import type { ReactNode } from 'react'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useBooking } from '@/hooks/bookings/use-bookings'
import type { Booking } from '@/hooks/queries/use-bookings'
import { formatDateTime } from '@/lib/date'

interface BookingDetailDialogProps {
  bookingId: string | null
  onOpenChange: (open: boolean) => void
  actions?: (booking: Booking) => ReactNode
}

export function BookingDetailDialog({
  bookingId,
  onOpenChange,
  actions,
}: BookingDetailDialogProps) {
  const query = useBooking(bookingId ?? '')
  const booking = query.data

  return (
    <Dialog
      open={Boolean(bookingId)}
      onOpenChange={(open) => onOpenChange(open)}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {query.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : query.isError || !booking ? (
          <EmptyState
            title="Could not load booking"
            description={query.error?.message ?? 'Booking details are unavailable.'}
          />
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-3">
                <DialogTitle>{booking.title}</DialogTitle>
                <BookingStatusBadge status={booking.status} />
              </div>
              <DialogDescription>{booking.topic}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail
                label="Teacher"
                value={
                  booking.teacher?.email
                    ? `${booking.teacher.fullName} · ${booking.teacher.email}`
                    : booking.teacher?.fullName
                }
              />
              <Detail
                label="Lab"
                value={
                  booking.lab?.location
                    ? `${booking.lab.name} · ${booking.lab.location}`
                    : booking.lab?.name
                }
              />
              <Detail label="Class" value={booking.className} />
              <Detail label="Students" value={String(booking.studentCount)} />
              <Detail
                label="Starts"
                value={formatDateTime(booking.startTime)}
              />
              <Detail label="Ends" value={formatDateTime(booking.endTime)} />
              <Detail label="Priority" value={booking.priority} />
              <Detail label="Description" value={booking.description || '—'} />
            </div>
            <section className="space-y-2">
              <h3 className="font-medium">Requested items</h3>
              {booking.items?.length ? (
                <ul className="space-y-2">
                  {booking.items.map((item, index) => (
                    <li
                      key={item.id ?? `${item.chemicalId}-${item.equipmentId}-${index}`}
                      className="flex flex-wrap justify-between gap-2 rounded-md border p-3"
                    >
                      <span>
                        {item.chemical?.name ??
                          item.equipment?.name ??
                          'Item unavailable'}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.chemicalId ? 'Chemical' : 'Equipment'}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No items were requested.
                </p>
              )}
            </section>
            {booking.status === 'approved' && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">Approval</p>
                <p className="mt-1 text-muted-foreground">
                  {booking.approvedBy?.fullName ?? 'Approved'}
                  {booking.approvedAt
                    ? ` · ${formatDateTime(booking.approvedAt)}`
                    : ''}
                </p>
              </div>
            )}
            {booking.status === 'rejected' && booking.rejectionReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Rejection reason</p>
                <p className="mt-1">{booking.rejectionReason}</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              {actions?.(booking)}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || '—'}</p>
    </div>
  )
}
