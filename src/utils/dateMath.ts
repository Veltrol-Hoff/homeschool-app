import { isWeekend, addDays, subDays, format, parseISO } from'date-fns'

export interface Trip {
  id: string
  start_date: string
  end_date?: string
}

export interface Holiday {
  id: string
  date: string
}

/**
 * Checks if a given date is a valid school day (not a weekend, holiday, or trip)
 */
export function isSchoolDay(date: Date, holidays: Holiday[], trips: Trip[]): boolean {
  if (isWeekend(date)) return false

  const dateStr = format(date,'yyyy-MM-dd')
  
  // Check global holidays
  if (holidays.some(h => h.date === dateStr)) {
    return false
  }

  // Check student trips
  const isTrip = trips.some(t => {
    const start = parseISO(t.start_date)
    const end = t.end_date ? parseISO(t.end_date) : start
    // Using simple string comparison or date math
    const startStr = format(start,'yyyy-MM-dd')
    const endStr = format(end,'yyyy-MM-dd')
    return dateStr >= startStr && dateStr <= endStr
  })

  if (isTrip) return false

  return true
}

/**
 * Gets the very next valid school day after the provided date
 */
export function getNextValidSchoolDay(currentDate: Date, holidays: Holiday[], trips: Trip[]): Date {
  let nextDate = addDays(currentDate, 1)
  
  // Safety break to prevent infinite loops if they book 5 years of vacation
  let maxLookahead = 365 
  
  while (!isSchoolDay(nextDate, holidays, trips) && maxLookahead > 0) {
    nextDate = addDays(nextDate, 1)
    maxLookahead--
  }
  
  return nextDate
}

/**
 * Gets the previous valid school day before the provided date
 */
export function getPreviousValidSchoolDay(currentDate: Date, holidays: Holiday[], trips: Trip[]): Date {
  let prevDate = subDays(currentDate, 1)
  
  // Safety break to prevent infinite loops
  let maxLookback = 365 
  
  while (!isSchoolDay(prevDate, holidays, trips) && maxLookback > 0) {
    prevDate = subDays(prevDate, 1)
    maxLookback--
  }
  
  return prevDate
}
