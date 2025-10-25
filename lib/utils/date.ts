export function differenceInCalendarMonths(later: Date, earlier: Date) {
  const yearDiff = later.getUTCFullYear() - earlier.getUTCFullYear()
  const monthDiff = later.getUTCMonth() - earlier.getUTCMonth()
  let totalMonths = yearDiff * 12 + monthDiff

  if (later.getUTCDate() < earlier.getUTCDate()) {
    totalMonths -= 1
  }

  return totalMonths
}

export function monthsBetween(later: Date, earlier: Date) {
  return Math.max(0, differenceInCalendarMonths(later, earlier))
}

export function daysBetween(later: Date, earlier: Date) {
  const diff = later.getTime() - earlier.getTime()
  return diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24))
}
