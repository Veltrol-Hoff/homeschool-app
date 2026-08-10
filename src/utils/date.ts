export function isPi1206FilingWindow(date: Date = new Date()): boolean {
  const currentYear = date.getFullYear()
  
  // Find third Friday of September
  // September is month 8 (0-indexed)
  let firstDayOfSept = new Date(currentYear, 8, 1)
  let firstDayOfWeek = firstDayOfSept.getDay() // 0 is Sunday, 5 is Friday
  
  // Calculate days until first Friday
  let daysUntilFirstFriday = (5 - firstDayOfWeek + 7) % 7
  
  // Third Friday is 14 days after the first Friday
  let thirdFridayDate = 1 + daysUntilFirstFriday + 14
  let thirdFriday = new Date(currentYear, 8, thirdFridayDate)
  
  // October 15
  let october15 = new Date(currentYear, 9, 15, 23, 59, 59) // End of Oct 15
  
  return date >= thirdFriday && date <= october15
}
