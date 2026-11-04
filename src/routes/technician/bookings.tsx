import { useMemo, useState } from 'react'
import { BookingCard } from '@/components/bookings/BookingCard'
import { BookingDetailDialog } from '@/components/bookings/BookingDetailDialog'
import {
  BookingFilters,
  type BookingDateFilter,
  type BookingFilterValues,
} from '@/components/bookings/BookingFilters'
import { BookingTable } from '@/components/bookings/BookingTable'
import { TechnicianBookingActions } from '@/components/bookings/TechnicianBookingActions'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useBookings,
  useTodayBookings,
} from '@/hooks/bookings/use-bookings'
import type { Booking } from '@/hooks/queries/use-bookings'

const initialFilters: BookingFilterValues = {
  status: 'all',
  labId: '',
  dateRange: 'all',
  search: '',
}

export default function TechnicianBookingsPage() {
  const [tab, setTab] = useState<'today' | 'all'>('today')
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const todayQuery = useTodayBookings(tab === 'today')
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
  const allQuery = useBookings(requestFilters, tab === 'all')
  const todayBookings = useMemo(
    () => filterSearch(todayQuery.data ?? [], filters.search),
    [filters.search, todayQuery.data],
  )
  const allBookings = useMemo(
    () => filterSearch(allQuery.data?.data ?? [], filters.search),
    [allQuery.data?.data, filters.search],
  )

  function updateFilters(value: BookingFilterValues) {
    setFilters(value)
    setPage(1)
  }

  function select(booking: Booking) {
    setSelectedId(booking.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Requests"
        description="Manage and process lab requisitions"
      />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'today' | 'all')}
      >
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="space-y-4">
          {todayQuery.isError ? (
            <ErrorState message={todayQuery.error.message} />
          ) : todayQuery.isLoading ? (
            <LoadingCards />
          ) : todayBookings.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="There are no bookings scheduled for today."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {todayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onSelect={select}
                >
                  <TechnicianBookingActions booking={booking} compact />
                </BookingCard>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <BookingFilters value={filters} onChange={updateFilters} />
          {allQuery.isError ? (
            <ErrorState message={allQuery.error.message} />
          ) : allQuery.isLoading ? (
            <>
              <div className="hidden md:block">
                <BookingTable bookings={[]} onSelect={() => {}} isLoading />
              </div>
              <div className="space-y-3 md:hidden">
                <LoadingCards />
              </div>
            </>
          ) : allBookings.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              <div className="hidden md:block">
                <BookingTable
                  bookings={allBookings}
                  onSelect={select}
                  renderActions={(booking) => (
                    <TechnicianBookingActions
                      booking={booking}
                      compact
                    />
                  )}
                />
              </div>
              <div className="grid gap-4 md:hidden">
                {allBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onSelect={select}
                  >
                    <TechnicianBookingActions booking={booking} compact />
                  </BookingCard>
                ))}
              </div>
            </>
          )}
          {!allQuery.isError &&
          !allQuery.isLoading &&
          allQuery.data?.meta.totalPages ? (
            <Pagination
              page={page}
              totalPages={allQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </TabsContent>
      </Tabs>
      <BookingDetailDialog
        bookingId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        actions={(booking) => (
          <TechnicianBookingActions
            booking={booking}
            onActionSuccess={() => setSelectedId(null)}
          />
        )}
      />
    </div>
  )
}

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-44 w-full" />
      ))}
    </div>
  )
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
