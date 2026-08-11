import { createClient } from '@/utils/supabase/server'

export async function adjustMasteryPacing(workSampleId: string) {
  const supabase = await createClient()

  // 1. Fetch the work sample and its associated daily log
  const { data: sample } = await supabase
    .from('work_samples')
    .select(`
      id, 
      confirmed_score,
      daily_logs (
        id, 
        student_id, 
        academic_year_id,
        curriculum_item_id,
        date,
        curriculum_items (
          title,
          curriculum_id,
          curricula (
            pacing_type
          )
        )
      )
    `)
    .eq('id', workSampleId)
    .single()

  if (!sample || !sample.daily_logs || !sample.daily_logs.curriculum_items) return

  const log = sample.daily_logs
  const item = log.curriculum_items as any
  const curriculum = item.curricula

  // Only adjust for mastery pacing
  if (curriculum.pacing_type !== 'mastery' && curriculum.pacing_type !== 'mastery_paced') {
    return
  }

  // Only adjust for low scores
  if (sample.confirmed_score !== 'Needs Practice' && sample.confirmed_score !== 'Emerging') {
    return
  }

  // 2. Fetch all future Planned logs for this student and curriculum
  const { data: futureLogs } = await supabase
    .from('daily_logs')
    .select('id, date, original_date, curriculum_item_id, notes, duration_minutes')
    .eq('student_id', log.student_id)
    .eq('log_type', 'Planned')
    .gt('date', log.date)
    .order('date', { ascending: true })

  // Filter to ensure they belong to the same curriculum
  const { data: currItems } = await supabase
    .from('curriculum_items')
    .select('id')
    .eq('curriculum_id', item.curriculum_id)

  if (!currItems) return
  
  const currItemIds = new Set(currItems.map(c => c.id))
  const relevantFutureLogs = (futureLogs || []).filter(fl => currItemIds.has(fl.curriculum_item_id))

  if (relevantFutureLogs.length === 0) {
    // If no future logs are planned, just insert a review log for tomorrow.
    await insertReviewLog(supabase, log, item.title)
    return
  }

  // 3. Fetch Holidays to know what days to skip
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date')
    .eq('is_observed', true)
  const holidayStrings = new Set((holidays || []).map(h => h.date))

  function isValidDay(date: Date) {
    const day = date.getDay()
    if (day === 0 || day === 6) return false // Skip weekends by default
    
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    return !holidayStrings.has(dateStr)
  }

  function getNextValidDay(currentDateStr: string) {
    let date = new Date(currentDateStr)
    date.setDate(date.getDate() + 1)
    while (!isValidDay(date)) {
      date.setDate(date.getDate() + 1)
    }
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // 4. Determine the date for the Review Log
  const reviewDate = getNextValidDay(log.date)

  // 5. Shift all future logs
  let shiftFromDate = reviewDate;
  const updates = []

  for (const fLog of relevantFutureLogs) {
    if (fLog.date >= shiftFromDate) {
      let newDate = getNextValidDay(fLog.date)
      updates.push({
        id: fLog.id,
        date: newDate,
        original_date: fLog.original_date || fLog.date
      })
    }
  }

  // 6. Update future logs in DB
  for (const update of updates) {
    await supabase.from('daily_logs').update({ 
      date: update.date,
      original_date: update.original_date
    }).eq('id', update.id)
  }

  // 7. Insert the Review Log
  await insertReviewLog(supabase, log, item.title, reviewDate)
}

async function insertReviewLog(supabase: any, originalLog: any, originalTitle: string, dateOverride?: string) {
  let targetDate = dateOverride
  if (!targetDate) {
    const d = new Date(originalLog.date)
    d.setDate(d.getDate() + 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    targetDate = `${yyyy}-${mm}-${dd}`
  }

  await supabase.from('daily_logs').insert([{
    student_id: originalLog.student_id,
    academic_year_id: originalLog.academic_year_id,
    date: targetDate,
    log_type: 'Planned',
    duration_minutes: 30,
    notes: `Review: ${originalTitle}`,
    curriculum_item_id: originalLog.curriculum_item_id,
    pending_parent_approval: false
  }])
}
