const EAT_TIME_ZONE = 'Africa/Dar_es_Salaam'

export function dateKeyInEAT(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EAT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )
  return `${values.year}-${values.month}-${values.day}`
}

export function formatDateInEAT(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-TZ', {
    timeZone: EAT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getServiceDueState(
  value: string | null | undefined,
  today = dateKeyInEAT(),
): 'overdue' | 'due-soon' | 'scheduled' | 'none' {
  if (!value) return 'none'
  const dateKey = value.slice(0, 10)
  if (dateKey < today) return 'overdue'
  const daysUntil = Math.ceil(
    (Date.parse(`${dateKey}T12:00:00Z`) -
      Date.parse(`${today}T12:00:00Z`)) /
      86_400_000,
  )
  return daysUntil <= 14 ? 'due-soon' : 'scheduled'
}

export function getDaysUntilService(
  value: string | null | undefined,
  today = dateKeyInEAT(),
): number | null {
  if (!value) return null
  const dateKey = value.slice(0, 10)
  return Math.ceil(
    (Date.parse(`${dateKey}T12:00:00Z`) -
      Date.parse(`${today}T12:00:00Z`)) /
      86_400_000,
  )
}
