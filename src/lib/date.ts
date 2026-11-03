const EAT_OFFSET = '+03:00'
const EAT_TIME_ZONE = 'Africa/Dar_es_Salaam'

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: EAT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

export function formatTimeRange(
  start: string | Date,
  end: string | Date,
): string {
  const formatTime = (value: string | Date) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: EAT_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  return `${formatTime(start)} – ${formatTime(end)} EAT`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: EAT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function dateTimeLocalToISO(value: string): string {
  const date = new Date(`${value}:00${EAT_OFFSET}`)
  if (!value || Number.isNaN(date.getTime())) {
    throw new Error('Enter a valid date and time.')
  }
  return date.toISOString()
}

export function dateTimeLocalInEAT(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EAT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

export function minBookingDateTime(): string {
  const minimum = Date.now() + 15 * 60_000
  const nextMinute = Math.ceil(minimum / 60_000) * 60_000
  return dateTimeLocalInEAT(new Date(nextMinute))
}
