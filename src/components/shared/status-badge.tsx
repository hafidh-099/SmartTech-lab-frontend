import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  inactive: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
  unpaid: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  paid: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  waived: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
  approved: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  completed: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  cancelled: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
  expired: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
  locked: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
  revoked: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  safe: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  low: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  critical: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  operational: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  maintenance: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  broken: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  retired: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('capitalize', STATUS_STYLES[status] ?? '')}
    >
      {status}
    </Badge>
  )
}
