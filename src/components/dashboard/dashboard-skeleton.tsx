import { Skeleton } from '@/components/ui/skeleton'

interface DashboardSkeletonProps {
  stats?: number
  sections?: number
}

export function DashboardSkeleton({
  stats = 4,
  sections = 2,
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: stats }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: sections }, (_, index) => (
          <Skeleton key={index} className="h-80" />
        ))}
      </div>
    </div>
  )
}
