import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  className?: string
  compact?: boolean
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  compact = false,
}: StatCardProps) {
  return (
    <Card className={cn('bg-card', className)}>
      <CardContent className={cn(compact ? 'p-4' : 'p-6')}>
        <div className="flex items-start justify-between gap-4">
          <div className={cn(compact ? 'space-y-1' : 'space-y-2')}>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                'font-bold tracking-tight',
                compact ? 'text-2xl' : 'text-3xl',
              )}
            >
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn('rounded-lg bg-primary/10', compact ? 'p-2' : 'p-3')}>
            <Icon
              className={cn('text-primary', compact ? 'h-4 w-4' : 'h-5 w-5')}
              aria-hidden="true"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
