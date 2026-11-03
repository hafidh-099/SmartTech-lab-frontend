import { useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStudentBreakages } from '@/hooks/queries/use-breakages'
import { formatTzs } from '@/lib/breakages'
import { formatDate } from '@/lib/date'

export default function StudentLookup() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [studentName, setStudentName] = useState(
    searchParams.get('studentName') ?? '',
  )
  const [studentClass, setStudentClass] = useState(
    searchParams.get('studentClass') ?? '',
  )
  const [submittedName, setSubmittedName] = useState(
    searchParams.get('studentName') ?? '',
  )
  const [submittedClass, setSubmittedClass] = useState(
    searchParams.get('studentClass') ?? '',
  )
  const query = useStudentBreakages(
    submittedName,
    submittedClass || undefined,
  )

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = studentName.trim()
    setSubmittedName(name)
    setSubmittedClass(studentClass.trim())
    const next = new URLSearchParams()
    if (name) next.set('studentName', name)
    if (studentClass.trim()) next.set('studentClass', studentClass.trim())
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student breakage lookup"
        description="Check a student's outstanding balance and breakage history."
      />
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row"
      >
        <Input
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          placeholder="Student name"
          aria-label="Student name"
          required
        />
        <Input
          value={studentClass}
          onChange={(event) => setStudentClass(event.target.value)}
          placeholder="Class (optional)"
          aria-label="Student class"
        />
        <Button type="submit" disabled={!studentName.trim()}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      {query.isError && (
        <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
          Could not load this student's breakages.{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {query.isLoading && submittedName && (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      )}
      {query.data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total owed</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold text-destructive">
                {formatTzs(query.data.summary.totalOwed)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total paid</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">
                {formatTzs(query.data.summary.totalPaid)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Breakages</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">
                {query.data.summary.count.toLocaleString()}
              </CardContent>
            </Card>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.breakages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No breakages found"
                        description="No matching breakage history for this student."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  query.data.breakages.map((breakage) => (
                    <TableRow key={breakage.id}>
                      <TableCell>{formatDate(breakage.createdAt)}</TableCell>
                      <TableCell>
                        {breakage.itemName}
                        <span className="ml-2 text-xs capitalize text-muted-foreground">
                          {breakage.itemType}
                        </span>
                      </TableCell>
                      <TableCell>{breakage.quantity}</TableCell>
                      <TableCell>{formatTzs(breakage.penaltyAmount)}</TableCell>
                      <TableCell>{formatTzs(breakage.penaltyPaidAmount)}</TableCell>
                      <TableCell><StatusBadge status={breakage.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
