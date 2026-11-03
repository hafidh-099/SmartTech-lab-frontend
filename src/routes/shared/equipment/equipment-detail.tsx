import { useState } from 'react'
import { ArrowLeft, MoreHorizontal, Wrench } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EquipmentFormDialog } from '@/components/equipment/equipment-form-dialog'
import { ServiceDialog } from '@/components/equipment/service-dialog'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useEquipmentItem,
  useUpdateEquipment,
  type EquipmentStatus,
} from '@/hooks/queries/use-equipment'
import {
  formatDateInEAT,
  getDaysUntilService,
  getServiceDueState,
} from '@/lib/equipment-dates'

const statuses: EquipmentStatus[] = [
  'operational',
  'maintenance',
  'broken',
  'retired',
]

function formatTimestampInEAT(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-TZ', {
    timeZone: 'Africa/Dar_es_Salaam',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

interface EquipmentDetailProps {
  canEdit: boolean
}

export default function EquipmentDetail({ canEdit }: EquipmentDetailProps) {
  const { id = '' } = useParams()
  const query = useEquipmentItem(id)
  const [editOpen, setEditOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const mutation = useUpdateEquipment(id)
  const basePath = canEdit ? '/technician/equipment' : '/dean/equipment'

  if (query.isLoading) return <DashboardSkeleton sections={2} />
  if (query.isError || !query.data) {
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-card p-6"
        role="alert"
      >
        <p className="text-sm text-destructive">
          {query.error?.message ?? 'Could not load equipment details'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  const equipment = query.data
  const dueState = getServiceDueState(equipment.nextServiceDate)
  const daysUntilService = getDaysUntilService(equipment.nextServiceDate)

  return (
    <div className="space-y-6">
      <PageHeader
        title={equipment.name}
        description="Equipment details and recent service history."
        action={
          <Button variant="outline" asChild>
            <Link to={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to equipment
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment</CardTitle>
            <CardDescription>
              Identification and current operational status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={equipment.status} />
              {dueState === 'overdue' && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                >
                  Service overdue
                </Badge>
              )}
              {dueState === 'due-soon' && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                >
                  Service due soon
                </Badge>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Serial number</dt>
                <dd className="mt-1 font-medium">
                  {equipment.serialNumber || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="mt-1 font-medium">
                  {equipment.category || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last service</dt>
                <dd className="mt-1 font-medium">
                  {formatDateInEAT(equipment.lastServiceDate) === '—'
                    ? 'Never'
                    : formatDateInEAT(equipment.lastServiceDate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Next service</dt>
                <dd className="mt-1 font-medium">
                  {formatDateInEAT(equipment.nextServiceDate) === '—'
                    ? 'Not scheduled'
                    : formatDateInEAT(equipment.nextServiceDate)}
                </dd>
                {daysUntilService !== null && (
                  <dd
                    className={`mt-1 text-xs ${
                      daysUntilService < 0
                        ? 'text-red-600 dark:text-red-400'
                        : daysUntilService <= 14
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {daysUntilService < 0
                      ? `Overdue by ${Math.abs(daysUntilService)} days`
                      : daysUntilService === 0
                        ? 'Due today'
                        : `${daysUntilService} days remaining`}
                  </dd>
                )}
              </div>
            </dl>
            {canEdit && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  Edit equipment
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={equipment.status === 'retired' ? 0 : -1}>
                      <Button
                        disabled={equipment.status === 'retired'}
                        onClick={() => setServiceOpen(true)}
                      >
                        <Wrench className="mr-2 h-4 w-4" />
                        Record service
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {equipment.status === 'retired' && (
                    <TooltipContent>
                      Cannot service retired equipment
                    </TooltipContent>
                  )}
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={mutation.isPending}>
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      Change status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {statuses.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        disabled={
                          status === equipment.status || mutation.isPending
                        }
                        onSelect={() => mutation.mutate({ status })}
                      >
                        {status[0].toUpperCase() + status.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent service activity</CardTitle>
            <CardDescription>Latest recorded services.</CardDescription>
          </CardHeader>
          <CardContent>
            {equipment.serviceLogs.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center">
                <Wrench className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No service activity recorded.
                </p>
              </div>
            ) : (
              <ol className="space-y-4">
                {equipment.serviceLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex gap-3 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Service recorded
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestampInEAT(log.createdAt)}
                        {log.user?.fullName
                          ? ` · ${log.user.fullName}`
                          : ''}
                      </p>
                      {(log.notes || (log.reason && log.reason !== 'service')) && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {log.notes || log.reason}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
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
    </div>
  )
}
