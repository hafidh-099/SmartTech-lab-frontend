import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { DashboardError } from '@/components/dashboard/dashboard-error'
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
import {
  useBreakageSummary,
  useBreakages,
  type BreakageStatus,
} from '@/hooks/queries/use-breakages'
import { dateInputToEATRange, formatTzs } from '@/lib/breakages'
import { formatDate } from '@/lib/date'

const STATUS_COLORS: Record<BreakageStatus, string> = {
  paid: '#22c55e',
  unpaid: '#ef4444',
  waived: '#94a3b8',
}

export default function BreakageSummaryPage() {
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [applied, setApplied] = useState<{ from?: string; to?: string }>({})
  const summaryQuery = useBreakageSummary(applied)
  const recentQuery = useBreakages({
    from: applied.from,
    to: applied.to,
    page: 1,
    limit: 10,
  })

  function applyDateRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({
      from: dateInputToEATRange(fromInput),
      to: dateInputToEATRange(toInput, true),
    })
  }

  if (summaryQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Breakage Financials" description="Review penalties and student balances." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <DashboardError onRetry={() => void summaryQuery.refetch()} />
    )
  }

  const summary = summaryQuery.data
  const statusChart = (
    ['paid', 'unpaid', 'waived'] as BreakageStatus[]
  ).map((status) => ({
    name: status[0].toUpperCase() + status.slice(1),
    value: status === 'paid'
      ? summary.totalPaid
      : status === 'unpaid'
        ? summary.totalUnpaid
        : summary.totalWaived,
    status,
  })).filter((entry) => entry.value > 0)

  function studentListPath(studentName: string, studentClass: string) {
    const params = new URLSearchParams({
      studentName,
      studentClass,
    })
    return `/dean/breakages?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Breakage Financials"
        description="Review school penalties, payments, waivers, and outstanding balances."
      />
      <form
        onSubmit={applyDateRange}
        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <label htmlFor="breakages-from" className="text-sm font-medium">From</label>
          <Input
            id="breakages-from"
            type="date"
            value={fromInput}
            max={toInput || undefined}
            onChange={(event) => setFromInput(event.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2">
          <label htmlFor="breakages-to" className="text-sm font-medium">To</label>
          <Input
            id="breakages-to"
            type="date"
            value={toInput}
            min={fromInput || undefined}
            onChange={(event) => setToInput(event.target.value)}
          />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">Total penalties</CardTitle></CardHeader>
          <CardContent className="text-xl font-semibold text-foreground">{formatTzs(summary.totalPenalties)}</CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">Total paid</CardTitle></CardHeader>
          <CardContent className="text-xl font-semibold text-green-700 dark:text-green-400">{formatTzs(summary.totalPaid)}</CardContent>
        </Card>
        <Card className={`border-border bg-card shadow-sm ${summary.totalUnpaid > 0 ? 'border-destructive/50' : ''}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">Total unpaid</CardTitle></CardHeader>
          <CardContent className={`text-xl font-semibold ${summary.totalUnpaid > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
            {formatTzs(summary.totalUnpaid)}
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">Total waived</CardTitle></CardHeader>
          <CardContent className="text-xl font-semibold text-foreground">{formatTzs(summary.totalWaived)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader><CardTitle className="text-foreground">Financial breakdown</CardTitle></CardHeader>
          <CardContent>
            {statusChart.length === 0 ? (
              <EmptyState title="No financial data" description="No penalties are recorded for this date range." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={3}
                    label={{ fill: 'hsl(var(--muted-foreground))' }}
                  >
                    {statusChart.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatTzs(Number(value))}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader><CardTitle className="text-foreground">Top students by unpaid balance</CardTitle></CardHeader>
          <CardContent>
            {summary.topStudents.length === 0 ? (
              <EmptyState title="No outstanding balances" description="There are no unpaid penalties in this date range." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={summary.topStudents}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value: number) => value.toLocaleString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="studentName"
                    width={110}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => formatTzs(Number(value))}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="totalOwed" name="Owed (TZS)" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle className="text-foreground">Top students</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total owed</TableHead>
                  <TableHead>Breakages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>No student balances to show.</TableCell>
                  </TableRow>
                ) : (
                  summary.topStudents.map((student) => (
                    <TableRow key={`${student.studentName}-${student.studentClass}`}>
                      <TableCell>
                        <Link className="font-medium text-primary hover:underline" to={studentListPath(student.studentName, student.studentClass)}>
                          {student.studentName}
                        </Link>
                      </TableCell>
                      <TableCell>{student.studentClass}</TableCell>
                      <TableCell>{formatTzs(student.totalOwed)}</TableCell>
                      <TableCell>{student.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dean/breakages">View all breakages</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle className="text-foreground">Recent breakages</CardTitle></CardHeader>
        <CardContent>
          {recentQuery.isLoading ? (
            <Skeleton className="h-28" />
          ) : recentQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">
              Could not load recent breakages.{' '}
              <Button variant="link" className="h-auto p-0" onClick={() => void recentQuery.refetch()}>
                Retry
              </Button>
            </p>
          ) : (recentQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyState title="No recent breakages" description="No breakages were found in this date range." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Penalty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentQuery.data?.data ?? []).map((breakage) => (
                    <TableRow key={breakage.id}>
                      <TableCell>{formatDate(breakage.createdAt)}</TableCell>
                      <TableCell>
                        {breakage.studentName}
                        <span className="block text-xs text-muted-foreground">{breakage.studentClass}</span>
                      </TableCell>
                      <TableCell>{breakage.itemName}</TableCell>
                      <TableCell>{formatTzs(breakage.penaltyAmount)}</TableCell>
                      <TableCell><StatusBadge status={breakage.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
