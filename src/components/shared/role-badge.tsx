import { Badge } from '@/components/ui/badge'

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  dean: 'default',
  technician: 'secondary',
  teacher: 'outline',
  super_admin: 'default',
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={ROLE_VARIANT[role] ?? 'outline'} className="capitalize">
      {role.replaceAll('_', ' ')}
    </Badge>
  )
}
