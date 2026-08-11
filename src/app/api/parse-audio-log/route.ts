import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text } = await request.json()
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

    // 1. Fetch students and subjects to pass to AI context (in real life)
    const { data: students } = await supabase.from('students').select('*')
    const { data: subjects } = await supabase.from('subjects').select('*')
    
    // We also need the current academic year for these students
    const { data: mappings } = await supabase.from('student_academic_years').select('*')

    // 2. MOCK ANTHROPIC CALL
    // In a real implementation we would prompt Claude to output a JSON array like:
    // [ { studentName: "Milli", subjectName: "Science", duration_minutes: 60, notes: "..." } ]
    // Here we will mock it by just parsing basic details or picking a random subject if we can't figure it out.
    
    // Naive mock extraction:
    const lowerText = text.toLowerCase()
    const foundStudents = (students || []).filter(s => lowerText.includes(s.name.toLowerCase()))
    
    // If no students matched, pick the first one just for the mock to work
    const targetStudents = foundStudents.length > 0 ? foundStudents : [students?.[0]].filter(Boolean)
    
    const foundSubjects = (subjects || []).filter(s => lowerText.includes(s.name.toLowerCase()))
    const targetSubject = foundSubjects.length > 0 ? foundSubjects[0] : subjects?.[0]
    
    // Extract duration (mock: default 60 or look for numbers)
    let duration = 60
    const hoursMatch = lowerText.match(/(\d+)\s*hour/)
    if (hoursMatch) duration = parseInt(hoursMatch[1]) * 60
    const minsMatch = lowerText.match(/(\d+)\s*min/)
    if (minsMatch) duration = parseInt(minsMatch[1])

    if (!targetStudents.length || !targetSubject) {
      return NextResponse.json({ error: 'Could not determine student or subject from text' }, { status: 400 })
    }

    const today = format(new Date(), 'yyyy-MM-dd')
    const insertedLogs = []

    for (const student of targetStudents) {
      const mapping = mappings?.find(m => m.student_id === student.id)
      if (!mapping) continue // Skip if no academic year

      const { data, error } = await supabase.from('daily_logs').insert({
        student_id: student.id,
        academic_year_id: mapping.academic_year_id,
        subject_id: targetSubject.id,
        date: today,
        duration_minutes: duration,
        log_type: 'Completed',
        notes: `Parsed from audio: "${text}"`,
        pending_parent_approval: true // ALWAYS TRUE FOR AI DRAFTS
      }).select().single()

      if (error) throw error
      insertedLogs.push(data)
    }

    return NextResponse.json({ success: true, logs: insertedLogs })

  } catch (error: any) {
    console.error('Audio Parse Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
