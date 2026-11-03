import { Button } from '@/components/ui/button'

interface DashboardErrorProps {
  onRetry: () => void
}

export function DashboardError({ onRetry }: DashboardErrorProps) {
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-card p-6"
      role="alert"
    >
      <p className="text-sm text-destructive">
        Failed to load dashboard data. Check your connection and try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
