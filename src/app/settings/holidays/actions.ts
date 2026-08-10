'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addHoliday(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const academic_year_id = formData.get('academic_year_id') as string
  const name = formData.get('name') as string
  const date = formData.get('date') as string

  if (!academic_year_id || !name || !date) {
    throw new Error("All fields are required")
  }

  const { error } = await supabase.from('holidays').insert([{
    academic_year_id,
    name,
    date,
    is_observed: true
  }])

  if (error) {
    throw new Error(`Failed to add holiday: ${error.message}`)
  }

  revalidatePath('/settings/holidays')
  return { success: true }
}

export async function deleteHoliday(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('holidays').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete holiday: ${error.message}`)
  }

  revalidatePath('/settings/holidays')
  return { success: true }
}

export async function updateHoliday(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const academic_year_id = formData.get('academic_year_id') as string
  const name = formData.get('name') as string
  const date = formData.get('date') as string

  if (!academic_year_id || !name || !date) {
    throw new Error("All fields are required")
  }

  const { error } = await supabase.from('holidays').update({
    academic_year_id,
    name,
    date
  }).eq('id', id)

  if (error) {
    throw new Error(`Failed to update holiday: ${error.message}`)
  }

  revalidatePath('/settings/holidays')
  return { success: true }
}

function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, nth: number) {
  let d = new Date(year, month, 1)
  let count = 0
  while (d.getMonth() === month) {
    if (d.getDay() === dayOfWeek) {
      count++
      if (count === nth) return new Date(d)
    }
    d.setDate(d.getDate() + 1)
  }
  return d
}

function getLastDayOfMonth(year: number, month: number, dayOfWeek: number) {
  let d = new Date(year, month + 1, 0)
  while (d.getMonth() === month) {
    if (d.getDay() === dayOfWeek) return new Date(d)
    d.setDate(d.getDate() - 1)
  }
  return d
}

function toLocalISOString(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function bulkAddUSHolidays(academicYearId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get academic year bounds
  const { data: ay } = await supabase.from('academic_years').select('*').eq('id', academicYearId).single()
  if (!ay) throw new Error("Academic year not found")

  const startDate = new Date(ay.start_date)
  const endDate = new Date(ay.end_date)
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  const allHolidays: { name: string, date: Date }[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    allHolidays.push({ name: "New Year's Day", date: new Date(year, 0, 1) })
    allHolidays.push({ name: "Martin Luther King Jr. Day", date: getNthDayOfMonth(year, 0, 1, 3) })
    allHolidays.push({ name: "Presidents' Day", date: getNthDayOfMonth(year, 1, 1, 3) })
    allHolidays.push({ name: "Memorial Day", date: getLastDayOfMonth(year, 4, 1) })
    allHolidays.push({ name: "Juneteenth National Independence Day", date: new Date(year, 5, 19) })
    allHolidays.push({ name: "Independence Day", date: new Date(year, 6, 4) })
    allHolidays.push({ name: "Labor Day", date: getNthDayOfMonth(year, 8, 1, 1) })
    allHolidays.push({ name: "Columbus Day", date: getNthDayOfMonth(year, 9, 1, 2) })
    allHolidays.push({ name: "Veterans Day", date: new Date(year, 10, 11) })
    allHolidays.push({ name: "Thanksgiving Day", date: getNthDayOfMonth(year, 10, 4, 4) })
    // Also adding day after thanksgiving for many schools
    const dayAfterThanksgiving = getNthDayOfMonth(year, 10, 4, 4)
    dayAfterThanksgiving.setDate(dayAfterThanksgiving.getDate() + 1)
    allHolidays.push({ name: "Day After Thanksgiving", date: dayAfterThanksgiving })
    allHolidays.push({ name: "Christmas Eve", date: new Date(year, 11, 24) })
    allHolidays.push({ name: "Christmas Day", date: new Date(year, 11, 25) })
    allHolidays.push({ name: "New Year's Eve", date: new Date(year, 11, 31) })
  }

  // Filter those that fall within the academic year
  const validHolidays = allHolidays.filter(h => h.date >= startDate && h.date <= endDate)

  if (validHolidays.length === 0) {
    throw new Error("No standard holidays fall within this academic year's dates.")
  }

  // Format and bulk insert
  const inserts = validHolidays.map(h => ({
    academic_year_id: academicYearId,
    name: h.name,
    date: toLocalISOString(h.date),
    is_observed: true
  }))

  const { error } = await supabase.from('holidays').insert(inserts)
  if (error) {
    throw new Error(`Failed to bulk add holidays: ${error.message}`)
  }

  revalidatePath('/settings/holidays')
  return { success: true, count: validHolidays.length }
}
