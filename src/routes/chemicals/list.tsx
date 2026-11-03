import { useState } from 'react'
import {
  ArrowUpRight,
  FlaskConical,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertsBanner } from '@/components/chemicals/alerts-banner'
import { ChemicalFormDialog } from '@/components/chemicals/chemical-form-dialog'
import { RestockDialog } from '@/components/chemicals/restock-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useChemicalAlerts,
  useChemicals,
  useDeactivateChemical,
  useExpiringChemicals,
  type Chemical,
  type ChemicalStatus,
} from '@/hooks/queries/use-chemicals'
import { useDebounce } from '@/hooks/use-debounce'

interface ChemicalListProps {
  role: 'dean' | 'technician'
}

const statusValues: ChemicalStatus[] = ['safe', 'low', 'critical', 'expired']

function ChemicalActions({
  chemical,
  basePath,
}: {
  chemical: Chemical
  basePath: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const mutation = useDeactivateChemical(chemical.id)

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${chemical.name}`}
          asChild
        >
          <Link to={`${basePath}/${chemical.id}`}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
        {chemical.isActive && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Restock ${chemical.name}`}
              onClick={() => setRestockOpen(true)}
            >
              <PackagePlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${chemical.name}`}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Deactivate ${chemical.name}`}
              onClick={() => setDeactivateOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
      <ChemicalFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        chemical={chemical}
      />
      {chemical.isActive && (
        <RestockDialog
          open={restockOpen}
          onOpenChange={setRestockOpen}
          chemical={chemical}
        />
      )}
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate chemical?"
        description={`${chemical.name} will no longer appear in the active chemical inventory.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isPending={mutation.isPending}
        onConfirm={() =>
          mutation.mutate(undefined, {
            onSuccess: () => setDeactivateOpen(false),
          })
        }
      />
    </>
  )
}

export default function ChemicalList({ role }: ChemicalListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState<ChemicalStatus | 'all'>(
    statusValues.includes(searchParams.get('status') as ChemicalStatus)
      ? (searchParams.get('status') as ChemicalStatus)
      : 'all',
  )
  const [includeInactive, setIncludeInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search)
  const basePath = `/${role}/chemicals`
  const query = useChemicals({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    includeInactive,
    page,
    limit: 10,
  })
  const alertsQuery = useChemicalAlerts()
  const expiringQuery = useExpiringChemicals(30)

  function changeStatus(value: string) {
    const next = value === 'all' ? 'all' : (value as ChemicalStatus)
    setStatus(next)
    setPage(1)
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('status')
    else params.set('status', next)
    setSearchParams(params, { replace: true })
  }

  async function copyFormula(formula: string) {
    try {
      await navigator.clipboard.writeText(formula)
      toast.success('Formula copied')
    } catch {
      toast.error('Could not access the clipboard')
    }
  }

  const chemicals = query.data?.data ?? []
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chemicals"
        description="Track chemical stock, expiry dates, and inventory activity."
        action={
          role === 'technician' ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add chemical
            </Button>
          ) : undefined
        }
      />

      <AlertsBanner
        stockAlerts={alertsQuery.data?.meta.total ?? 0}
        expiring={expiringQuery.data?.meta.total ?? 0}
        basePath={basePath}
      />

      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search chemical name…"
            className="pl-9"
            aria-label="Search chemicals"
          />
        </div>
        <Select value={status} onValueChange={changeStatus}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusValues.map((value) => (
              <SelectItem key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm">
          <Switch
            checked={includeInactive}
            onCheckedChange={(checked) => {
              setIncludeInactive(checked)
              setPage(1)
            }}
            aria-label="Show inactive chemicals"
          />
          Include inactive
        </label>
      </div>

      {query.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">Could not load chemicals</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.error.message}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chemical</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={`chemical-skeleton-${index}`}>
                      {Array.from({ length: 6 }, (_, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : chemicals.length > 0 ? (
                  chemicals.map((chemical) => (
                    <TableRow
                      key={chemical.id}
                      className={
                        chemical.status === 'critical'
                          ? 'bg-red-500/5'
                          : chemical.status === 'low'
                            ? 'bg-yellow-500/5'
                            : chemical.status === 'expired'
                              ? 'bg-muted/70'
                              : ''
                      }
                    >
                      <TableCell>
                        <div className="font-medium">{chemical.name}</div>
                        {chemical.formula && (
                          <button
                            type="button"
                            onClick={() => void copyFormula(chemical.formula ?? '')}
                            className="font-mono text-xs text-muted-foreground hover:text-foreground"
                            title="Copy formula"
                          >
                            {chemical.formula}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {Number(chemical.currentQuantity).toLocaleString()} {chemical.unit}
                        <span className="block text-xs text-muted-foreground">
                          min {Number(chemical.minThreshold).toLocaleString()} {chemical.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {chemical.expiryDate
                          ? new Date(`${chemical.expiryDate.slice(0, 10)}T00:00:00`).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={chemical.status} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={chemical.isActive ? 'active' : 'inactive'}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {role === 'technician' ? (
                          <ChemicalActions
                            chemical={chemical}
                            basePath={basePath}
                          />
                        ) : (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`${basePath}/${chemical.id}`}>
                              Details
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No chemicals found"
                        description={
                          search || status !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'No chemicals have been added to this inventory yet.'
                        }
                        icon={FlaskConical}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {query.data?.meta && query.data.meta.totalPages > 1 && (
            <Pagination
              page={query.data.meta.page}
              totalPages={query.data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {role === 'technician' && (
        <ChemicalFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  )
}
