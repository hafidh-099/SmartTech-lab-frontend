import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <PageHeader
        title="Page not found"
        description="The page you requested does not exist."
      />
      <Link to="/" className="text-primary hover:underline">
        Return to SmartTech Lab
      </Link>
    </main>
  )
}
