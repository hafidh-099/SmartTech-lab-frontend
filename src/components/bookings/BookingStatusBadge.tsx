import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/hooks/queries/use-bookings'

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:
    'border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  approved:
    'border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-400',
  rejected:
    'border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400',
  completed:
    'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400',
  cancelled:
    'border-gray-500/30 bg-gray-500/15 text-gray-700 dark:text-gray-400',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[status])}>
      {status}
    </Badge>
  )
}
