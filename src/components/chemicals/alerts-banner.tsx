import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface AlertsBannerProps {
  stockAlerts: number
  expiring: number
  basePath?: string
}

export function AlertsBanner({
  stockAlerts,
  expiring,
  basePath = '/technician/chemicals',
}: AlertsBannerProps) {
  const total = stockAlerts + expiring
  if (total === 0) return null

  const content = [
    stockAlerts > 0 ? `${stockAlerts} low or critical stock alerts` : null,
    expiring > 0 ? `${expiring} expiring soon` : null,
  ].filter(Boolean)

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-yellow-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium">Chemical attention needed</p>
          <p className="text-xs text-muted-foreground">{content.join(' · ')}</p>
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="self-start sm:self-auto"
      >
        <Link to={basePath}>View chemicals</Link>
      </Button>
    </div>
  )
}
