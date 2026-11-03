import type { ReactNode } from 'react'
import { Logo } from '@/components/shared/logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

const features = [
  { label: 'Chemical Inventory', desc: 'Track stock & expiry' },
  { label: 'Lab Bookings', desc: 'Requisition & approval' },
  { label: 'Breakage Tracking', desc: 'Student accountability' },
  { label: 'Scientific Calculator', desc: 'Molarity & dilution' },
]
const currentYear = new Date().getFullYear()

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex">
        <div className="flex items-center gap-3">
          <Logo variant="minor" className="h-10 w-10" />
          <span className="text-xl font-semibold tracking-tight">
            SmartTech Lab
          </span>
        </div>

        <div className="max-w-lg space-y-6">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Manage your science lab,{' '}
            <span className="text-primary">without the paperwork.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Offline-first digital management for school laboratories — chemical
            inventory, bookings, safety, and accountability in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="rounded-lg border border-border bg-background/50 p-4"
              >
                <p className="text-sm font-medium">{feature.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {currentYear} SmartTech Lab · Offline-first by design
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-background px-6 py-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <Logo variant="minor" className="h-9 w-9" />
            <span className="text-lg font-semibold">SmartTech Lab</span>
          </div>

          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </header>

          {children}
        </div>
      </section>
    </div>
  )
}
