import type { LucideIcon } from 'lucide-react'

interface EmptyChartProps {
  icon: LucideIcon
  message: string
}

export function EmptyChart({ icon: Icon, message }: EmptyChartProps) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-50" aria-hidden="true" />
      <p className="text-center text-sm">{message}</p>
    </div>
  )
}
