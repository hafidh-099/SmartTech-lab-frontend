import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLabs } from '@/hooks/queries/use-bookings'
import type { BookingStatus } from '@/hooks/queries/use-bookings'

export type BookingStatusFilter = BookingStatus | 'all'
export type BookingDateFilter = 'all' | 'today' | 'week'

export interface BookingFilterValues {
  status: BookingStatusFilter
  labId: string
  dateRange: BookingDateFilter
  search: string
}

interface BookingFiltersProps {
  value: BookingFilterValues
  onChange: (value: BookingFilterValues) => void
}

const statuses: BookingStatusFilter[] = [
  'all',
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled',
]

export function BookingFilters({ value, onChange }: BookingFiltersProps) {
  const labs = useLabs()
  const [labError, setLabError] = useState('')

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="relative">
        <span className="sr-only">Search bookings</span>
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Search title or teacher"
          className="pl-9"
        />
      </label>
      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as BookingStatusFilter })
        }
      >
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status === 'all' ? 'All statuses' : status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.labId || 'all'}
        onValueChange={(labId) =>
          onChange({ ...value, labId: labId === 'all' ? '' : labId })
        }
        onOpenChange={(open) => {
          if (open && labs.isError) setLabError('Could not load labs')
          else setLabError('')
        }}
      >
        <SelectTrigger aria-label="Filter by lab">
          <SelectValue placeholder="All labs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All labs</SelectItem>
          {labs.data?.map((lab) => (
            <SelectItem key={lab.id} value={lab.id}>
              {lab.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.dateRange}
        onValueChange={(dateRange) =>
          onChange({ ...value, dateRange: dateRange as BookingDateFilter })
        }
      >
        <SelectTrigger aria-label="Filter by date">
          <SelectValue placeholder="Any date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any date</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
        </SelectContent>
      </Select>
      {labError && (
        <p className="text-sm text-destructive sm:col-span-2 xl:col-span-4">
          {labError}
        </p>
      )}
      {labs.isError && !labError && (
        <p className="text-sm text-destructive sm:col-span-2 xl:col-span-4">
          Could not load lab filters.
        </p>
      )}
    </div>
  )
}
