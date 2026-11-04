import type { ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Booking } from '@/hooks/queries/use-bookings'
import { formatDate, formatTimeRange } from '@/lib/date'

interface BookingTableProps {
  bookings: Booking[]
  onSelect: (booking: Booking) => void
  renderActions?: (booking: Booking) => ReactNode
  isLoading?: boolean
}

export function BookingTable({
  bookings,
  onSelect,
  renderActions,
  isLoading = false,
}: BookingTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title / Topic</TableHead>
            <TableHead>Lab</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Date &amp; Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <TableRow key={`booking-skeleton-${index}`}>
                {Array.from({ length: 6 }, (_, cell) => (
                  <TableCell key={cell}>
                    <Skeleton className="h-5 w-full max-w-36" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : bookings.length ? (
            bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="min-w-44">
                  <button
                    className="text-left font-medium hover:underline"
                    onClick={() => onSelect(booking)}
                  >
                    {booking.title}
                  </button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {booking.topic}
                  </p>
                </TableCell>
                <TableCell>{booking.lab?.name ?? 'Lab unavailable'}</TableCell>
                <TableCell>
                  {booking.teacher?.fullName ?? 'Teacher unavailable'}
                </TableCell>
                <TableCell className="min-w-44">
                  <div className="inline-flex items-center gap-1.5">
                    <CalendarDays
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {formatDate(booking.startTime)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTimeRange(booking.startTime, booking.endTime)}
                  </p>
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {renderActions?.(booking)}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="p-4">
                <EmptyState
                  title="No bookings found"
                  description="Try adjusting your search or filters."
                  icon={CalendarDays}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
