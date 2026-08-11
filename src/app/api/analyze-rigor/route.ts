import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // In a real app we'd pass studentId or evaluate all students.
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
       return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // 1. Fetch standards history for the student
    const { data: standardsData } = await supabase
      .from('curriculum_item_standards')
      .select('created_at, confirmed, standards(code, short_description, grade_level, subject), curriculum_items(curricula(student_curricula!inner(student_id)))')
      .eq('curriculum_items.curricula.student_curricula.student_id', studentId)
      .order('created_at', { ascending: true })

    // 2. Mock Rigor Trend Analysis
    // A real AI prompt would check if the student is consistently completing standards at the same or lower grade level.
    // E.g., "Analyze this sequence of math standards. Is the student plateauing?"
    
    // For local dev, we return a mock flag if there's any data
    let flagged = false
    let message = ""

    if (standardsData && standardsData.length > 5) {
      flagged = true
      message = "Rigor Trend Alert: Student appears to be repeating foundational frameworks in Math without advancing to complex abstractions. Suggest adding an advanced Co-op Class or Dual Enrollment to maintain rigor for college admissions."
    }

    return NextResponse.json({ 
      success: true, 
      flagged,
      message
    })

  } catch (error: any) {
    console.error('Rigor Trend Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
