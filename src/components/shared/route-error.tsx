import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteError() {
  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center"
      role="alert"
    >
      <AlertTriangle
        className="h-10 w-10 text-destructive"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">This page couldn’t be loaded</h1>
        <p className="text-sm text-muted-foreground">
          Check your connection and reload the page to try again.
        </p>
      </div>
      <Button onClick={() => window.location.reload()}>Reload page</Button>
    </main>
  )
}
