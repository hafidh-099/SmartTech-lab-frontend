import { useState } from 'react'
import { ArrowUpRight, MoreHorizontal, Plus, Search, UserRoundSearch } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { LogBreakageDialog } from '@/components/breakages/log-breakage-dialog'
import { PayDialog } from '@/components/breakages/pay-dialog'
import { WaiveDialog } from '@/components/breakages/waive-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  type Breakage,
  type BreakageItemType,
  type BreakageStatus,
} from '@/hooks/queries/use-breakages'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDate } from '@/lib/date'
import { formatTzs } from '@/lib/breakages'

interface BreakagesListProps {
  canManage: boolean
}

const itemTypes: BreakageItemType[] = ['glassware', 'equipment', 'chemical']
const breakageStatuses: BreakageStatus[] = ['unpaid', 'paid', 'waived']

function BreakageDetailsDialog({
  breakage,
  onOpenChange,
}: {
  breakage: Breakage | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog
      open={Boolean(breakage)}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      {breakage && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Breakage details</DialogTitle>
            <DialogDescription>
              {breakage.studentName} · {breakage.studentClass}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Item</dt>
            <dd>{breakage.itemName} ({breakage.itemType})</dd>
            <dt className="text-muted-foreground">Quantity</dt>
            <dd>{breakage.quantity}</dd>
            <dt className="text-muted-foreground">Penalty</dt>
            <dd>{formatTzs(breakage.penaltyAmount)}</dd>
            <dt className="text-muted-foreground">Paid</dt>
            <dd>{formatTzs(breakage.penaltyPaidAmount)}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd><StatusBadge status={breakage.status} /></dd>
            <dt className="text-muted-foreground">Logged by</dt>
            <dd>{breakage.loggedBy?.fullName ?? '—'}</dd>
            <dt className="text-muted-foreground">Date</dt>
            <dd>{formatDate(breakage.createdAt)}</dd>
            {breakage.notes && (
              <>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{breakage.notes}</dd>
              </>
            )}
            {breakage.waiverReason && (
              <>
                <dt className="text-muted-foreground">Waiver reason</dt>
                <dd className="whitespace-pre-wrap">{breakage.waiverReason}</dd>
              </>
            )}
          </dl>
        </DialogContent>
      )}
    </Dialog>
  )
}

export default function BreakagesList({ canManage }: BreakagesListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [studentName, setStudentName] = useState(
    searchParams.get('studentName') ?? '',
  )
  const [status, setStatus] = useState<BreakageStatus | 'all'>(() => {
    const initial = searchParams.get('status')
    return breakageStatuses.find((value) => value === initial) ?? 'all'
  })
  const [itemType, setItemType] = useState<BreakageItemType | 'all'>(() => {
    const initial = searchParams.get('itemType')
    return itemTypes.find((value) => value === initial) ?? 'all'
  })
  const [page, setPage] = useState(1)
  const [logOpen, setLogOpen] = useState(false)
  const [selected, setSelected] = useState<Breakage | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Breakage | null>(null)
  const [waiverTarget, setWaiverTarget] = useState<Breakage | null>(null)
  const debouncedStudentName = useDebounce(studentName)
  const requestedClass = searchParams.get('studentClass') ?? undefined
  const basePath = canManage ? '/dean/breakages' : '/technician/breakages'
  const query = useBreakages({
    studentName: debouncedStudentName || undefined,
    studentClass: requestedClass,
    status: status === 'all' ? undefined : status,
    itemType: itemType === 'all' ? undefined : itemType,
    page,
    limit: 10,
  })
  const summaryQuery = useBreakageSummary()

  function updateFilters(next: {
    status?: BreakageStatus | 'all'
    itemType?: BreakageItemType | 'all'
  }) {
    setPage(1)
    const params = new URLSearchParams(searchParams)
    if (next.status !== undefined) {
      setStatus(next.status)
      if (next.status === 'all') params.delete('status')
      else params.set('status', next.status)
    }
    if (next.itemType !== undefined) {
      setItemType(next.itemType)
      if (next.itemType === 'all') params.delete('itemType')
      else params.set('itemType', next.itemType)
    }
    setSearchParams(params, { replace: true })
  }

  const totalUnpaidCount =
    summaryQuery.data?.countByStatus.unpaid ?? 0
  const totalPaidCount = summaryQuery.data?.countByStatus.paid ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Breakages"
        description="Track damaged items and student penalties."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`${basePath}/student-lookup`}>
                <UserRoundSearch className="mr-2 h-4 w-4" />
                Student lookup
              </Link>
            </Button>
            {!canManage && (
              <Button onClick={() => setLogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Breakage
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total unpaid</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold text-destructive">
            {summaryQuery.isLoading ? '…' : formatTzs(summaryQuery.data?.totalUnpaid ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total paid</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">
            {summaryQuery.isLoading ? '…' : formatTzs(summaryQuery.data?.totalPaid ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unpaid breakages</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold text-destructive">
            {summaryQuery.isLoading ? '…' : totalUnpaidCount.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Paid breakages</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">
            {summaryQuery.isLoading ? '…' : totalPaidCount.toLocaleString()}
          </CardContent>
        </Card>
      </div>
      {summaryQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not load breakage summary.
          <Button
            variant="link"
            className="h-auto p-0 pl-1"
            onClick={() => void summaryQuery.refetch()}
          >
            Retry
          </Button>
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={studentName}
            onChange={(event) => {
              setStudentName(event.target.value)
              setPage(1)
            }}
            placeholder="Search student name…"
            className="pl-9"
            aria-label="Search student name"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) =>
            updateFilters({ status: value as BreakageStatus | 'all' })
          }
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {breakageStatuses.map((value) => (
              <SelectItem key={value} value={value} className="capitalize">
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={itemType}
          onValueChange={(value) =>
            updateFilters({ itemType: value as BreakageItemType | 'all' })
          }
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter by item type">
            <SelectValue placeholder="All item types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All item types</SelectItem>
            {itemTypes.map((value) => (
              <SelectItem key={value} value={value} className="capitalize">
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Penalty</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Logged by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading &&
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 9 }, (_, cell) => (
                    <TableCell key={cell}><Skeleton className="h-5 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {query.isError && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-destructive">
                  Could not load breakages.{' '}
                  <Button variant="link" onClick={() => void query.refetch()}>
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {!query.isLoading && !query.isError && query.data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState
                    title="No breakages found"
                    description="Try changing the filters or log a new breakage."
                  />
                </TableCell>
              </TableRow>
            )}
            {(query.data?.data ?? []).map((breakage) => {
              const penalty = Number(breakage.penaltyAmount)
              const paid = Number(breakage.penaltyPaidAmount)
              const paidPercent =
                penalty > 0 ? Math.min(100, (paid / penalty) * 100) : 0
              return (
                <TableRow
                  key={breakage.id}
                  className={`cursor-pointer ${breakage.status === 'unpaid' ? 'border-l-4 border-l-red-500' : ''}`}
                  onClick={() => setSelected(breakage)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelected(breakage)
                    }
                  }}
                  tabIndex={0}
                  aria-label={`View breakage for ${breakage.studentName}`}
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDate(breakage.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{breakage.studentName}</div>
                    <div className="text-xs text-muted-foreground">
                      {breakage.studentClass}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{breakage.itemName}</div>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {breakage.itemType}
                    </Badge>
                  </TableCell>
                  <TableCell>{breakage.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatTzs(breakage.penaltyAmount)}
                  </TableCell>
                  <TableCell className="min-w-28">
                    <span>{formatTzs(breakage.penaltyPaidAmount)}</span>
                    {paid > 0 && penalty > paid && (
                      <div
                        className="mt-1 h-1.5 rounded-full bg-muted"
                        aria-label={`${paidPercent.toFixed(0)}% paid`}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={breakage.status} /></TableCell>
                  <TableCell>{breakage.loggedBy?.fullName ?? '—'}</TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${breakage.studentName}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManage && breakage.status === 'unpaid' && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => setPaymentTarget(breakage)}
                            >
                              Record payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setWaiverTarget(breakage)}
                            >
                              Waive penalty
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onSelect={() => setSelected(breakage)}>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {query.data && query.data.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={query.data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <LogBreakageDialog open={logOpen} onOpenChange={setLogOpen} />
      <PayDialog
        open={Boolean(paymentTarget)}
        onOpenChange={(open) => {
          if (!open) setPaymentTarget(null)
        }}
        breakage={paymentTarget}
      />
      <WaiveDialog
        open={Boolean(waiverTarget)}
        onOpenChange={(open) => {
          if (!open) setWaiverTarget(null)
        }}
        breakage={waiverTarget}
      />
      <BreakageDetailsDialog
        breakage={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
