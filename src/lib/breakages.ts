export function formatTzs(amount: number | string): string {
  return `TZS ${Number(amount).toLocaleString('en-TZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function dateInputToEATRange(
  date: string,
  endOfDay = false,
): string | undefined {
  if (!date) return undefined
  return `${date}T${endOfDay ? '23:59:59.999' : '00:00:00'}+03:00`
}
