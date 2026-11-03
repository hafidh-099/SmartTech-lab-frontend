import { useState } from 'react'
import {
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { EquipmentFormDialog } from '@/components/equipment/equipment-form-dialog'
import { ServiceDialog } from '@/components/equipment/service-dialog'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useEquipment,
  useUpdateEquipment,
  type Equipment,
  type EquipmentStatus,
} from '@/hooks/queries/use-equipment'
import { useDebounce } from '@/hooks/use-debounce'
import {
  formatDateInEAT,
  getServiceDueState,
} from '@/lib/equipment-dates'

const equipmentStatuses: EquipmentStatus[] = [
  'operational',
  'maintenance',
  'broken',
  'retired',
]

interface EquipmentListProps {
  canEdit: boolean
}

function EquipmentRowActions({
  equipment,
  canEdit,
}: {
  equipment: Equipment
  canEdit: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const updateMutation = useUpdateEquipment(equipment.id)
  const basePath = canEdit ? '/technician/equipment' : '/dean/equipment'

  function changeStatus(status: EquipmentStatus) {
    if (status !== equipment.status) {
      updateMutation.mutate({ status })
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${equipment.name}`}
          asChild
        >
          <Link to={`${basePath}/${equipment.id}`}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
        {canEdit && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${equipment.name}`}
              onClick={() => setEditOpen(true)}
            >
              <span className="sr-only">Edit</span>
              <Pencil className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={equipment.status === 'retired' ? 0 : -1}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Record service for ${equipment.name}`}
                    disabled={equipment.status === 'retired'}
                    onClick={() => setServiceOpen(true)}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              {equipment.status === 'retired' && (
                <TooltipContent>Cannot service retired equipment</TooltipContent>
              )}
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Change status for ${equipment.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {equipmentStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    disabled={
                      status === equipment.status || updateMutation.isPending
                    }
                    onSelect={() => changeStatus(status)}
                  >
                    {status[0].toUpperCase() + status.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      {canEdit && (
        <>
          <EquipmentFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            equipment={equipment}
          />
          <ServiceDialog
            open={serviceOpen}
            onOpenChange={setServiceOpen}
            equipment={equipment}
          />
        </>
      )}
    </>
  )
}

export default function EquipmentList({ canEdit }: EquipmentListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState<EquipmentStatus | 'all'>(() => {
    const initialStatus = searchParams.get('status')
    return equipmentStatuses.find((value) => value === initialStatus) ?? 'all'
  })
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search)
  const query = useEquipment({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    limit: 10,
  })
  const operationalCount = useEquipment({
    status: 'operational',
    page: 1,
    limit: 1,
  })
  const maintenanceCount = useEquipment({
    status: 'maintenance',
    page: 1,
    limit: 1,
  })
  const brokenCount = useEquipment({ status: 'broken', page: 1, limit: 1 })
  const retiredCount = useEquipment({ status: 'retired', page: 1, limit: 1 })

  function changeStatus(value: string) {
    const next = equipmentStatuses.find((candidate) => candidate === value)
    setStatus(next ?? 'all')
    setPage(1)
    const params = new URLSearchParams(searchParams)
    if (next) params.set('status', next)
    else params.delete('status')
    setSearchParams(params, { replace: true })
  }

  const statusCounts: [string, number][] = [
    ['Operational', operationalCount.data?.meta.total ?? 0],
    ['Maintenance', maintenanceCount.data?.meta.total ?? 0],
    ['Broken', brokenCount.data?.meta.total ?? 0],
    ['Retired', retiredCount.data?.meta.total ?? 0],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        description="Manage laboratory equipment and service schedules."
        action={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statusCounts.map(([label, count]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {operationalCount.isLoading ||
              maintenanceCount.isLoading ||
              brokenCount.isLoading ||
              retiredCount.isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                count
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search equipment name…"
            className="pl-9"
            aria-label="Search equipment"
          />
        </div>
        <Select value={status} onValueChange={changeStatus}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {equipmentStatuses.map((value) => (
              <SelectItem key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">Could not load equipment</p>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 5 }, (_, row) => (
                    <TableRow key={`equipment-skeleton-${row}`}>
                      {Array.from({ length: 7 }, (_, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : query.data?.data.length ? (
                  query.data.data.map((equipment) => {
                    const dueState = getServiceDueState(
                      equipment.nextServiceDate,
                    )
                    return (
                      <TableRow
                        key={equipment.id}
                        className={
                          equipment.status === 'broken'
                            ? 'bg-red-50 dark:bg-red-950/20'
                            : equipment.status === 'maintenance'
                              ? 'bg-yellow-50 dark:bg-yellow-950/20'
                              : equipment.status === 'retired'
                                ? 'opacity-50'
                                : ''
                        }
                      >
                        <TableCell className="font-medium">
                          {equipment.name}
                        </TableCell>
                        <TableCell>{equipment.serialNumber || '—'}</TableCell>
                        <TableCell>{equipment.category || '—'}</TableCell>
                        <TableCell>
                          {formatDateInEAT(equipment.lastServiceDate)}
                        </TableCell>
                        <TableCell>
                          <div
                            className={
                              dueState === 'overdue'
                                ? 'text-red-600 dark:text-red-400'
                                : dueState === 'due-soon'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : ''
                            }
                          >
                            {formatDateInEAT(equipment.nextServiceDate)}
                          </div>
                          {dueState === 'overdue' && (
                            <Badge
                              variant="outline"
                              className="mt-1 border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                            >
                              Overdue
                            </Badge>
                          )}
                          {dueState === 'due-soon' && (
                            <Badge
                              variant="outline"
                              className="mt-1 border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                            >
                              Due soon
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={equipment.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <EquipmentRowActions
                            equipment={equipment}
                            canEdit={canEdit}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        title="No equipment found"
                        description={
                          search || status !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'No equipment has been added yet.'
                        }
                        icon={Wrench}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {query.data && query.data.meta.totalPages > 1 && (
            <Pagination
              page={query.data.meta.page}
              totalPages={query.data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      {canEdit && (
        <EquipmentFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </div>
  )
}
