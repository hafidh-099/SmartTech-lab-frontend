import { useMemo, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { BookingCard } from '@/components/bookings/BookingCard'
import { BookingDetailDialog } from '@/components/bookings/BookingDetailDialog'
import {
  BookingFilters,
  type BookingDateFilter,
  type BookingFilterValues,
} from '@/components/bookings/BookingFilters'
import { BookingTable } from '@/components/bookings/BookingTable'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBookings } from '@/hooks/bookings/use-bookings'
import type { Booking } from '@/hooks/queries/use-bookings'

const initialFilters: BookingFilterValues = {
  status: 'all',
  labId: '',
  dateRange: 'all',
  search: '',
}

export default function DeanBookingsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const requestFilters = useMemo(
    () => ({
      ...(filters.status !== 'all' ? { status: filters.status } : {}),
      ...(filters.labId ? { labId: filters.labId } : {}),
      ...dateRangeParams(filters.dateRange),
      page,
      limit: 20,
    }),
    [filters.dateRange, filters.labId, filters.status, page],
  )
  const query = useBookings(requestFilters)
  const bookings = useMemo(
    () => filterSearch(query.data?.data ?? [], filters.search),
    [filters.search, query.data?.data],
  )
  const pageCount = query.data?.meta.totalPages ?? 1

  function updateFilters(value: BookingFilterValues) {
    setFilters(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Lab Bookings"
        description="Overview of all laboratory requisitions"
      />
      <BookingFilters value={filters} onChange={updateFilters} />
      <div className="flex justify-end gap-2">
        <Button
          variant={view === 'table' ? 'secondary' : 'outline'}
          size="sm"
          aria-label="Table view"
          aria-pressed={view === 'table'}
          onClick={() => setView('table')}
        >
          <List className="h-4 w-4" />
          Table
        </Button>
        <Button
          variant={view === 'cards' ? 'secondary' : 'outline'}
          size="sm"
          aria-label="Card view"
          aria-pressed={view === 'cards'}
          onClick={() => setView('cards')}
        >
          <LayoutGrid className="h-4 w-4" />
          Cards
        </Button>
      </div>
      {query.isError ? (
        <ErrorState message={query.error.message} />
      ) : query.isLoading ? (
        <div className="space-y-3">
          {view === 'table' ? (
            <BookingTable bookings={[]} onSelect={() => {}} isLoading />
          ) : (
            Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-44 w-full" />
            ))
          )}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Try adjusting your search or filters."
        />
      ) : view === 'table' ? (
        <>
          <div className="hidden md:block">
            <BookingTable bookings={bookings} onSelect={select} />
          </div>
          <div className="grid gap-4 md:hidden">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onSelect={select}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onSelect={(selected) => select(selected)}
            />
          ))}
        </div>
      )}
      {!query.isError && !query.isLoading && query.data?.meta.totalPages ? (
        <Pagination
          page={page}
          totalPages={pageCount}
          onPageChange={setPage}
        />
      ) : null}
      <BookingDetailDialog
        bookingId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  )

  function select(booking: Booking) {
    setSelectedId(booking.id)
  }
}

function dateRangeParams(range: BookingDateFilter) {
  if (range === 'all') return {}
  const today = eatDateKey(new Date())
  if (range === 'today') return { date: today }
  const until = new Date(`${today}T12:00:00+03:00`)
  until.setDate(until.getDate() + 6)
  const endDate = eatDateKey(until)
  return {
    from: new Date(`${today}T00:00:00+03:00`).toISOString(),
    to: new Date(`${endDate}T23:59:59+03:00`).toISOString(),
  }
}

function eatDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function filterSearch(bookings: Booking[], search: string) {
  const term = search.trim().toLocaleLowerCase()
  if (!term) return bookings
  return bookings.filter(
    (booking) =>
      booking.title.toLocaleLowerCase().includes(term) ||
      booking.teacher?.fullName.toLocaleLowerCase().includes(term),
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
    >
      Could not load bookings: {message}
    </div>
  )
}
