import { useAuthStore } from '@/stores/auth.store'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

export function Topbar() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <p className="font-medium">{user?.fullName ?? '—'}</p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
