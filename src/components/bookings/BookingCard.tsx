import type { ReactNode } from 'react'
import { CalendarDays, Users } from 'lucide-react'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Booking } from '@/hooks/queries/use-bookings'
import { formatDate, formatTimeRange } from '@/lib/date'

interface BookingCardProps {
  booking: Booking
  onSelect?: (booking: Booking) => void
  children?: ReactNode
}

export function BookingCard({
  booking,
  onSelect,
  children,
}: BookingCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-base">{booking.title}</CardTitle>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-muted-foreground">{booking.topic}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {booking.lab?.name ?? 'Lab unavailable'}
        </p>
        <p className="text-muted-foreground">
          {formatDate(booking.startTime)} ·{' '}
          {formatTimeRange(booking.startTime, booking.endTime)}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>{booking.teacher?.fullName ?? 'Teacher unavailable'}</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {booking.studentCount} students
          </span>
        </div>
      </CardContent>
      {(children || onSelect) && (
        <CardFooter className="flex flex-wrap justify-end gap-2">
          {onSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(booking)}
            >
              View details
            </Button>
          )}
          {children}
        </CardFooter>
      )}
    </Card>
  )
}
