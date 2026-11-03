import { useState } from 'react'
import { ArrowLeft, PackagePlus, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { ChemicalFormDialog } from '@/components/chemicals/chemical-form-dialog'
import { RestockDialog } from '@/components/chemicals/restock-dialog'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useChemical } from '@/hooks/queries/use-chemicals'

export default function ChemicalDetail({
  role,
}: {
  role: 'dean' | 'technician'
}) {
  const { id = '' } = useParams()
  const query = useChemical(id)
  const [editOpen, setEditOpen] = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)
  const basePath = `/${role}/chemicals`

  if (query.isLoading) return <DashboardSkeleton sections={1} />
  if (query.isError || !query.data) {
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-card p-6"
        role="alert"
      >
        <p className="text-sm text-destructive">
          {query.error?.message ?? 'Could not load chemical details'}
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

  const chemical = query.data
  return (
    <div className="space-y-6">
      <PageHeader
        title={chemical.name}
        description="Chemical inventory details and recent activity."
        action={
          <Button variant="outline" asChild>
            <Link to={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to chemicals
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={chemical.status} />
              <StatusBadge
                status={chemical.isActive ? 'active' : 'inactive'}
              />
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Current quantity</dt>
                <dd className="mt-1 font-medium">
                  {Number(chemical.currentQuantity).toLocaleString()} {chemical.unit}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Minimum threshold</dt>
                <dd className="mt-1 font-medium">
                  {Number(chemical.minThreshold).toLocaleString()} {chemical.unit}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Formula</dt>
                <dd className="mt-1 font-mono">{chemical.formula || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expiry date</dt>
                <dd className="mt-1 font-medium">
                  {chemical.expiryDate
                    ? format(new Date(`${chemical.expiryDate.slice(0, 10)}T00:00:00`), 'PPP')
                    : 'No expiry date'}
                </dd>
              </div>
            </dl>
            {role === 'technician' && chemical.isActive && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit details
                </Button>
                <Button onClick={() => setRestockOpen(true)}>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Restock
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory history</CardTitle>
          </CardHeader>
          <CardContent>
            {chemical.inventoryLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stock activity recorded.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chemical.inventoryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.createdAt), 'PP p')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.action.replaceAll('_', ' ').toLowerCase()}
                        {log.reason && (
                          <span className="block max-w-48 truncate text-xs text-muted-foreground">
                            {log.reason}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {Number(log.quantity).toLocaleString()} {chemical.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {role === 'technician' && (
        <>
          <ChemicalFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            chemical={chemical}
          />
          <RestockDialog
            open={restockOpen}
            onOpenChange={setRestockOpen}
            chemical={chemical}
          />
        </>
      )}
    </div>
  )
}
