'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'
import { getNextValidSchoolDay, Holiday, Trip } from'@/utils/dateMath'
import { parseISO, format, addDays, addWeeks, addMonths } from'date-fns'

export async function bumpDay(studentId: string, targetDateStr: string) {
  const supabase = await createClient()

  // 1. Fetch holidays
  const { data: holidays } = await supabase.from('holidays').select('*')
  
  // 2. Fetch trips for this student
  const { data: tripStudents } = await supabase
    .from('trip_students')
    .select('trip_id, trips(id, start_date, end_date)')
    .eq('student_id', studentId)

  const trips: Trip[] = (tripStudents || []).map(ts => ts.trips).filter(t => t !== null) as unknown as Trip[]

  // 3. Fetch all future Planned logs for this student (we only bump planned coursework, not activities)
  const { data: plannedLogs, error: logError } = await supabase
    .from('daily_logs')
    .select('id, date, original_date')
    .eq('student_id', studentId)
    .eq('log_type','Planned')
    .is('activity_id', null)
    .gte('date', targetDateStr)
    .order('date', { ascending: true })

  if (logError || !plannedLogs) {
    throw new Error("Failed to fetch logs")
  }

  if (plannedLogs.length === 0) {
    return { success: true, message:"No planned tasks to bump."}
  }

  // 4. Group logs by date
  const logsByDate: Record<string, string[]> = {}
  plannedLogs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = []
    logsByDate[log.date].push(log.id)
  })

  // 5. The Cascade Algorithm
  // We keep track of which logs need to be moved to which date
  const updates: { id: string, newDate: string, originalDate: string | null, oldDate: string }[] = []
  
  // Create a map to lookup full log objects
  const logMap = new Map(plannedLogs.map(l => [l.id, l]))
  
  // Start the bump from the target date
  let currentDateStr = targetDateStr
  let logsToPushForward = logsByDate[currentDateStr] || []
  
  // If there are no logs on the target date, we don't really have anything to bump from this date,
  // but the user might be clicking it to clear it. In our logic, if there's nothing to push, the cascade stops.
  if (logsToPushForward.length === 0) {
    return { success: true }
  }

  while (logsToPushForward.length > 0) {
    // Find next valid day
    const nextDate = getNextValidSchoolDay(parseISO(currentDateStr), holidays as Holiday[] || [], trips)
    const nextDateStr = format(nextDate,'yyyy-MM-dd')

    // Record updates for the items we are pushing
    logsToPushForward.forEach(id => {
      const log = logMap.get(id)
      updates.push({ id, newDate: nextDateStr, originalDate: log?.original_date || null, oldDate: log?.date || currentDateStr })
    })

    // Now look at what was originally on the nextDate
    const originalLogsOnNextDate = logsByDate[nextDateStr] || []
    
    // Set up the next iteration: we now need to push the original logs from nextDate forward
    logsToPushForward = originalLogsOnNextDate
    currentDateStr = nextDateStr
  }

  // 6. Execute Updates (Sequential or Batch)
  // Supabase JS doesn't have a bulk update for multiple different IDs with different values easily without RPC,
  // but since we compute `newDate` for a set of IDs, we can update in batches per date.
  
  // Group updates by newDate
  // Group updates by newDate AND whether original_date needs setting
  // This helps us batch efficiently.
  for (const u of updates) {
    const updatePayload: any = { date: u.newDate }
    if (!u.originalDate) {
      updatePayload.original_date = u.oldDate
    }
    
    const { error } = await supabase
      .from('daily_logs')
      .update(updatePayload)
      .eq('id', u.id)

    if (error) {
      console.error("Bump update error:", error)
      throw new Error("Failed to update logs during bump cascade.")
    }
  }

  revalidatePath('/calendar')
  return { success: true }
}

export async function createActivity(data: { 
  type:'Course'|'Activity', 
  subject_id?: string, 
  activity_id?: string, 
  notes?: string, 
  date: string, 
  time?: string, 
  duration_minutes?: number, 
  file_url?: string, 
  students: string[],
  recurringRule?: string,
  recurringCount?: number
}) {
  const supabase = await createClient()
  
  // Get active academic year
  const { data: year } = await supabase.from('academic_years').select('id').eq('is_active', true).single()
  
  let yearId = year?.id
  if (!yearId) {
    const { data: anyYear } = await supabase.from('academic_years').select('id').limit(1).maybeSingle()
    yearId = anyYear?.id
  }
  
  if (!yearId) {
    // Auto-create a default academic year to satisfy the constraint
    const { data: newYear, error: newYearError } = await supabase.from('academic_years').insert({
      student_id: data.students[0],
      year_label:'2024-2025',
      grade_level:'Ungraded',
      start_date:'2024-08-01',
      end_date:'2025-06-01'
    }).select('id').single()
    
    if (newYearError) throw new Error("Failed to auto-create academic year:"+ newYearError.message)
    yearId = newYear?.id
  }

  const baseDate = parseISO(data.date)
  const count = (data.recurringRule && data.recurringRule !=='none') ? (data.recurringCount || 1) : 1
  const inserts = []
  
  // Generate a single recurring_group_id for this batch if it's recurring
  const recurringGroupId = count > 1 ? crypto.randomUUID() : null

  // Generate records for each occurrence
  for (let i = 0; i < count; i++) {
    let currentDate = baseDate
    if (data.recurringRule ==='daily') {
      currentDate = addDays(baseDate, i)
    } else if (data.recurringRule ==='weekly') {
      currentDate = addWeeks(baseDate, i)
    } else if (data.recurringRule ==='monthly') {
      currentDate = addMonths(baseDate, i)
    }

    const dateStr = format(currentDate,'yyyy-MM-dd')
    const sharedGroupId = crypto.randomUUID()

    for (const studentId of data.students) {
      inserts.push({
        student_id: studentId,
        academic_year_id: yearId,
        date: dateStr,
        notes: data.notes ||'',
        log_type:'Planned',
        duration_minutes: data.duration_minutes || 30,
        subject_id: data.type ==='Course'? (data.subject_id || undefined) : undefined,
        activity_id: data.type ==='Activity'? (data.activity_id || undefined) : undefined,
        shared_activity_group_id: sharedGroupId,
        recurring_group_id: recurringGroupId,
        time_of_day: data.time || null,
        file_url: data.file_url || null
      })
    }
  }
  
  const { error } = await supabase.from('daily_logs').insert(inserts)
  if (error) throw new Error(error.message)
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  return { success: true }
}

export async function updateActivity(id: string, data: { type:'Course'|'Activity', subject_id?: string, activity_id?: string, notes?: string, date: string, time?: string, duration_minutes?: number, file_url?: string, students?: string[] }) {
  const supabase = await createClient()
  
  if (data.students && data.students.length === 0) {
    return deleteActivity(id)
  }

  const { data: log } = await supabase.from('daily_logs').select('shared_activity_group_id, academic_year_id, recurring_group_id').eq('id', id).single()

  const updateData: any = {
    notes: data.notes ||'', 
    date: data.date,
    subject_id: data.type ==='Course'? (data.subject_id || null) : null,
    activity_id: data.type ==='Activity'? (data.activity_id || null) : null,
    time_of_day: data.time || null
  }
  if (data.duration_minutes) updateData.duration_minutes = data.duration_minutes
  if (data.file_url !== undefined) updateData.file_url = data.file_url

  if (log?.shared_activity_group_id && data.students) {
    // 1. Update existing logs
    const { error } = await supabase.from('daily_logs')
      .update(updateData)
      .eq('shared_activity_group_id', log.shared_activity_group_id)
      
    if (error) throw new Error(error.message)

    // 2. Fetch existing students in this group
    const { data: existingLogs } = await supabase.from('daily_logs').select('id, student_id').eq('shared_activity_group_id', log.shared_activity_group_id)
    const existingStudentIds = existingLogs?.map(l => l.student_id) || []

    // 3. Find students to remove and add
    const toRemove = existingStudentIds.filter(id => id && !data.students!.includes(id))
    const toAdd = data.students.filter(id => !existingStudentIds.includes(id))

    if (toRemove.length > 0) {
      await supabase.from('daily_logs').delete().eq('shared_activity_group_id', log.shared_activity_group_id).in('student_id', toRemove)
    }

    if (toAdd.length > 0) {
      const inserts = toAdd.map(studentId => ({
        student_id: studentId,
        academic_year_id: log.academic_year_id,
        date: updateData.date,
        notes: updateData.notes,
        log_type: 'Planned',
        duration_minutes: updateData.duration_minutes || 30,
        subject_id: updateData.subject_id,
        activity_id: updateData.activity_id,
        shared_activity_group_id: log.shared_activity_group_id,
        recurring_group_id: log.recurring_group_id,
        time_of_day: updateData.time_of_day,
        file_url: updateData.file_url
      }))
      await supabase.from('daily_logs').insert(inserts)
    }

  } else {
    // Legacy / single update
    const { error } = await supabase.from('daily_logs')
      .update(updateData)
      .eq('id', id)
    if (error) throw new Error(error.message)
  }
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  return { success: true }
}

export async function deleteActivity(id: string) {
  const supabase = await createClient()
  const { data: log } = await supabase.from('daily_logs').select('shared_activity_group_id').eq('id', id).single()
  
  if (log?.shared_activity_group_id) {
    const { error } = await supabase.from('daily_logs').delete().eq('shared_activity_group_id', log.shared_activity_group_id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('daily_logs').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  return { success: true }
}

export async function toggleLogCompletion(id: string, isCompleted: boolean, moveToToday: boolean = false) {
  const supabase = await createClient()
  
  // Fetch existing log to check original_date and shared group
  const { data: log } = await supabase.from('daily_logs').select('original_date, date, shared_activity_group_id').eq('id', id).single()

  const updateData: any = {
    log_type: isCompleted ?'Completed':'Planned',
    completed_date: isCompleted ? new Date().toISOString() : null
  }
  
  if (isCompleted && moveToToday) {
    updateData.date = format(new Date(), 'yyyy-MM-dd')
    if (!log?.original_date) {
      updateData.original_date = log?.date
    }
  }
  
  let error;
  if (log?.shared_activity_group_id) {
    // Update all logs in the shared group
    const { error: sharedError } = await supabase.from('daily_logs')
      .update(updateData)
      .eq('shared_activity_group_id', log.shared_activity_group_id)
    error = sharedError;
  } else {
    // Update just this specific log
    const { error: singleError } = await supabase.from('daily_logs')
      .update(updateData)
      .eq('id', id)
    error = singleError;
  }
    
  if (error) throw new Error(error.message)
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createTrip(data: { title: string, location: string, start_date: string, end_date: string, hours_credited?: number, display_color: string, subject_ids?: string[], theme?: string, students: string[] }) {
  const supabase = await createClient()
  
  // Insert trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      title: data.title,
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
      hours_credited: data.hours_credited || 0,
      display_color: data.display_color,
      theme: data.theme || null,
      trip_type:'Vacation'
    })
    .select()
    .single()
    
  if (tripError || !trip) throw new Error(tripError?.message ||"Failed to create trip")

  // Insert trip_students
  if (data.students.length > 0) {
    const studentInserts = data.students.map(studentId => ({
      trip_id: trip.id,
      student_id: studentId
    }))
    
    const { error: tsError } = await supabase.from('trip_students').insert(studentInserts)
    if (tsError) throw new Error(tsError.message)

    // Insert trip_subjects
    if (data.subject_ids && data.subject_ids.length > 0) {
      const subjectInserts = data.subject_ids.map(subId => ({
        trip_id: trip.id,
        subject_id: subId
      }))
      const { error: subError } = await supabase.from('trip_subjects').insert(subjectInserts)
      if (subError) throw new Error(subError.message)
    }

    // Auto-create daily_logs for the trip if hours are credited
    if ((data.hours_credited || 0) > 0) {
      // Find current academic year
      const { data: year } = await supabase.from('academic_years').select('id').eq('is_active', true).single()
      let yearId = year?.id
      if (!yearId) {
        const { data: anyYear } = await supabase.from('academic_years').select('id').limit(1).maybeSingle()
        yearId = anyYear?.id
      }
      
      if (yearId) {
        const logInserts: any[] = []
        if (data.subject_ids && data.subject_ids.length > 0) {
          const durationPerSubject = ((data.hours_credited || 0) * 60) / data.subject_ids.length
          for (const studentId of data.students) {
            for (const subjectId of data.subject_ids) {
              logInserts.push({
                student_id: studentId,
                academic_year_id: yearId,
                date: data.start_date,
                log_type: 'Field Trip',
                duration_minutes: durationPerSubject,
                subject_id: subjectId,
                notes: `Trip: ${data.title}`,
                trip_id: trip.id,
                pending_parent_approval: false
              })
            }
          }
        } else {
          for (const studentId of data.students) {
            logInserts.push({
              student_id: studentId,
              academic_year_id: yearId,
              date: data.start_date,
              log_type: 'Field Trip',
              duration_minutes: (data.hours_credited || 0) * 60,
              subject_id: null,
              notes: `Trip: ${data.title}`,
              trip_id: trip.id,
              pending_parent_approval: false
            })
          }
        }
        const { error: logError } = await supabase.from('daily_logs').insert(logInserts)
        if (logError) throw new Error(logError.message)
      }
    }
  }
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  return { success: true }
}

export async function updateTrip(id: string, data: { title: string, location: string, start_date: string, end_date: string, hours_credited?: number, display_color: string, subject_ids?: string[], theme?: string, students: string[] }) {
  const supabase = await createClient()
  
  const { error: tripError } = await supabase
    .from('trips')
    .update({
      title: data.title,
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
      hours_credited: data.hours_credited || 0,
      display_color: data.display_color,
      theme: data.theme || null
    })
    .eq('id', id)
    
  if (tripError) throw new Error(tripError.message)

  // Update students by deleting and recreating
  await supabase.from('trip_students').delete().eq('trip_id', id)
  // Clean up any existing auto-generated trip logs
  await supabase.from('daily_logs').delete().eq('trip_id', id)
  
  if (data.students.length > 0) {
    const studentInserts = data.students.map(studentId => ({
      trip_id: id,
      student_id: studentId
    }))
    const { error: tsError } = await supabase.from('trip_students').insert(studentInserts)
    if (tsError) throw new Error(tsError.message)

    // Update trip_subjects
    await supabase.from('trip_subjects').delete().eq('trip_id', id)
    if (data.subject_ids && data.subject_ids.length > 0) {
      const subjectInserts = data.subject_ids.map(subId => ({
        trip_id: id,
        subject_id: subId
      }))
      const { error: subError } = await supabase.from('trip_subjects').insert(subjectInserts)
      if (subError) throw new Error(subError.message)
    }

    // Re-create daily_logs for the trip if hours are credited
    if ((data.hours_credited || 0) > 0) {
      // Find current academic year
      const { data: year } = await supabase.from('academic_years').select('id').eq('is_active', true).single()
      let yearId = year?.id
      if (!yearId) {
        const { data: anyYear } = await supabase.from('academic_years').select('id').limit(1).maybeSingle()
        yearId = anyYear?.id
      }
      
      if (yearId) {
        const logInserts: any[] = []
        if (data.subject_ids && data.subject_ids.length > 0) {
          const durationPerSubject = ((data.hours_credited || 0) * 60) / data.subject_ids.length
          for (const studentId of data.students) {
            for (const subjectId of data.subject_ids) {
              logInserts.push({
                student_id: studentId,
                academic_year_id: yearId,
                date: data.start_date,
                log_type: 'Field Trip',
                duration_minutes: durationPerSubject,
                subject_id: subjectId,
                notes: `Trip: ${data.title}`,
                trip_id: id,
                pending_parent_approval: false
              })
            }
          }
        } else {
          for (const studentId of data.students) {
            logInserts.push({
              student_id: studentId,
              academic_year_id: yearId,
              date: data.start_date,
              log_type: 'Field Trip',
              duration_minutes: (data.hours_credited || 0) * 60,
              subject_id: null,
              notes: `Trip: ${data.title}`,
              trip_id: id,
              pending_parent_approval: false
            })
          }
        }
        const { error: logError } = await supabase.from('daily_logs').insert(logInserts)
        if (logError) throw new Error(logError.message)
      }
    }
  }
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  return { success: true }
}

export async function deleteTrip(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
    
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  return { success: true }
}

export async function addTripMedia(tripId: string, url: string, note: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('media_attachments').insert({
    trip_id: tripId,
    file_url: url,
    is_portfolio_sample: false
  })
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateRecurringActivity(
  recurringGroupId: string,
  originalDate: string,
  data: { type: 'Course' | 'Activity', subject_id?: string, activity_id?: string, notes?: string, date: string, time?: string, duration_minutes?: number, file_url?: string, students?: string[] }
) {
  const supabase = await createClient()
  
  // 1. Fetch all future Planned logs in this group
  const { data: logs, error: fetchError } = await supabase
    .from('daily_logs')
    .select('id, date, shared_activity_group_id')
    .eq('recurring_group_id', recurringGroupId)
    .eq('log_type', 'Planned')
    .gte('date', originalDate)
    
  if (fetchError) throw new Error(fetchError.message)
  if (!logs || logs.length === 0) return { success: true }
  
  // 2. Calculate day shift
  const oldDateObj = parseISO(originalDate)
  const newDateObj = parseISO(data.date)
  // Get time difference in days
  const diffTime = newDateObj.getTime() - oldDateObj.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  // 3. Update each log
  for (const log of logs) {
    const oldLogDate = parseISO(log.date)
    const newLogDate = addDays(oldLogDate, diffDays)
    
    const updateData: any = {
      notes: data.notes || '',
      date: format(newLogDate, 'yyyy-MM-dd'),
      subject_id: data.type === 'Course' ? (data.subject_id || null) : null,
      activity_id: data.type === 'Activity' ? (data.activity_id || null) : null,
      time_of_day: data.time || null
    }
    if (data.duration_minutes) updateData.duration_minutes = data.duration_minutes
    if (data.file_url !== undefined) updateData.file_url = data.file_url
    
    // First, update the log itself
    await supabase.from('daily_logs').update(updateData).eq('id', log.id)
    
    // If it's part of a shared group, handle students for this specific occurrence
    if (log.shared_activity_group_id && data.students) {
      const { data: existingLogs } = await supabase.from('daily_logs').select('id, student_id').eq('shared_activity_group_id', log.shared_activity_group_id)
      const existingStudentIds = existingLogs?.map(l => l.student_id) || []
      
      const toRemove = existingStudentIds.filter(id => id && !data.students!.includes(id))
      const toAdd = data.students.filter(id => !existingStudentIds.includes(id))

      if (toRemove.length > 0) {
        await supabase.from('daily_logs').delete().eq('shared_activity_group_id', log.shared_activity_group_id).in('student_id', toRemove)
      }

      if (toAdd.length > 0) {
        const { data: fullLog } = await supabase.from('daily_logs').select('academic_year_id').eq('id', log.id).single()
        if (fullLog) {
          const inserts = toAdd.map(studentId => ({
            student_id: studentId,
            academic_year_id: fullLog.academic_year_id,
            date: updateData.date,
            notes: updateData.notes,
            log_type: 'Planned',
            duration_minutes: updateData.duration_minutes || 30,
            subject_id: updateData.subject_id,
            activity_id: updateData.activity_id,
            shared_activity_group_id: log.shared_activity_group_id,
            recurring_group_id: recurringGroupId,
            time_of_day: updateData.time_of_day,
            file_url: updateData.file_url
          }))
          await supabase.from('daily_logs').insert(inserts)
        }
      }
    }
  }
  
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
  return { success: true }
}
