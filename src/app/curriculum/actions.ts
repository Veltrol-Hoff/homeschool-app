'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function addCurriculum(formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const subject_id = formData.get('subject_id') as string
  const pacing_type = formData.get('pacing_type') as string
  const delivery_mode = formData.get('delivery_mode') as string
  const course_name = (formData.get('course_name') as string) || null

  if (!title || !subject_id || !pacing_type || !delivery_mode) {
    throw new Error("All fields are required")
  }

  const { data: curriculum, error: currError } = await supabase.from('curricula').insert([{
    title, subject_id, pacing_type, delivery_mode, course_name
  }]).select().single()

  if (currError) {
    console.error("Insert error:", currError)
    throw new Error(`Failed to add curriculum: ${currError.message || JSON.stringify(currError)}`)
  }

  revalidatePath('/curriculum')
  return { success: true }
}

export async function deleteCurriculum(curriculumId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('curricula').delete().eq('id', curriculumId)

  if (error) {
    throw new Error(`Failed to delete curriculum: ${error.message || JSON.stringify(error)}`)
  }

  revalidatePath('/curriculum')
  return { success: true }
}
export async function scheduleCurriculum(curriculumId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const student_ids = formData.getAll('student_id') as string[]
  const start_date = formData.get('start_date') as string
  const days_of_week = formData.getAll('days_of_week').map(d => parseInt(d as string, 10))

  if (student_ids.length === 0 || !start_date || days_of_week.length === 0) {
    throw new Error("Missing required scheduling fields")
  }

  // Fetch curriculum items in sequence order
  const { data: items } = await supabase
    .from('curriculum_items')
    .select('*')
    .eq('curriculum_id', curriculumId)
    .order('sequence_order', { ascending: true })

  if (!items || items.length === 0) {
    throw new Error("No curriculum items found to schedule")
  }

  // Fetch holidays for the academic year(s) active during this time
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date')
    .eq('is_observed', true)
    
  const holidayStrings = new Set((holidays || []).map(h => h.date))

  // Fetch academic years for all selected students via mapping
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('student_id, academic_year_id, academic_years(start_date, end_date)')
    .in('student_id', student_ids)
    
  const academicYears = mappings?.map(m => {
    const ay = m.academic_years as any;
    return {
      student_id: m.student_id,
      id: m.academic_year_id,
      start_date: ay.start_date,
      end_date: ay.end_date
    }
  }) || [];

  // Build the insert array
  const logsToInsert = []
  let currentDate = new Date(start_date)
  
  // Ensure we start at midnight local time to avoid timezone shifts
  currentDate.setHours(0, 0, 0, 0)

  // Fast forward until we hit a valid day to start
  function isValidDay(date: Date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    return days_of_week.includes(date.getDay()) && !holidayStrings.has(dateStr)
  }

  // Assign items to dates
  let datePointer = new Date(currentDate)
  for (const item of items) {
    // Find next valid day
    while (!isValidDay(datePointer)) {
      datePointer.setDate(datePointer.getDate() + 1)
    }

    const yyyy = datePointer.getFullYear()
    const mm = String(datePointer.getMonth() + 1).padStart(2, '0')
    const dd = String(datePointer.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    const shared_activity_group_id = student_ids.length > 1 ? crypto.randomUUID() : null

    for (const sid of student_ids) {
      const yearMatch = academicYears?.find(y => y.student_id === sid && dateStr >= y.start_date && dateStr <= y.end_date)
      
      if (!yearMatch) {
        throw new Error(`Cannot schedule item on ${dateStr}: No academic year covers this date for student ID ${sid}.`)
      }

      logsToInsert.push({
        student_id: sid,
        academic_year_id: yearMatch.id,
        date: dateStr,
        log_type: 'Planned',
        duration_minutes: item.estimated_minutes || 30,
        subject_id: null, // We'll look up the curriculum subject id later
        notes: `Scheduled: ${item.title}`,
        pending_parent_approval: false, // Auto-approved since parent scheduled it
        curriculum_item_id: item.id,
        shared_activity_group_id
      })
    }
    
    // Move to next day for the next item
    datePointer.setDate(datePointer.getDate() + 1)
  }

  // We need to look up the curriculum's subject_id
  const { data: curriculum } = await supabase
    .from('curricula')
    .select('subject_id')
    .eq('id', curriculumId)
    .single()
    
  if (curriculum) {
    logsToInsert.forEach(log => log.subject_id = curriculum.subject_id)
  }

  const { error } = await supabase.from('daily_logs').insert(logsToInsert)

  if (error) {
    throw new Error(`Failed to insert scheduled logs: ${error.message}`)
  }

  revalidatePath('/curriculum')
  revalidatePath('/calendar')
  return { success: true }
}
export async function updateCurriculum(curriculumId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const subject_id = formData.get('subject_id') as string
  const pacing_type = formData.get('pacing_type') as string
  const delivery_mode = formData.get('delivery_mode') as string
  const course_name = (formData.get('course_name') as string) || null
  const status = formData.get('status') as string

  if (!title || !subject_id || !pacing_type || !delivery_mode || !status) {
    throw new Error("All fields are required")
  }

  // Update curriculum details
  const { error: currError } = await supabase.from('curricula').update({
    title, subject_id, pacing_type, delivery_mode, course_name, status
  }).eq('id', curriculumId)

  if (currError) {
    throw new Error(`Failed to update curriculum: ${currError.message || JSON.stringify(currError)}`)
  }

  revalidatePath('/curriculum')
  return { success: true }
}
