'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function deleteStudent(studentId: string, password: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { error:'Unauthorized'}
  }

  // Verify the password by attempting to sign in again
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (authError) {
    return { error:'Incorrect password'}
  }

  // Password is correct, proceed with deletion
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error:'Failed to delete student from database'}
  }

  revalidatePath('/dashboard')
  revalidatePath('/compliance')
  return { success: true }
}

export async function markCoopAttendance(enrollmentId: string, classId: string, date: string, status: string, studentId: string, academicYearId: string) {
  const supabase = await createClient()

  // 1. Mark attendance
  const { error: attError } = await supabase.from('co_op_attendance').upsert({
    enrollment_id: enrollmentId,
    date,
    status
  }, { onConflict: 'enrollment_id, date' })

  if (attError) {
    console.error('Attendance error:', attError)
    return { error: 'Failed to record attendance' }
  }

  // 2. If present, create daily logs
  if (status === 'Present') {
    // Fetch class details and subjects
    const { data: cls } = await supabase.from('co_op_classes').select('*, co_op_class_subjects(subject_id)').eq('id', classId).single()
    if (cls) {
      const subjects = cls.co_op_class_subjects || []
      const durationPerSubject = subjects.length > 0 ? cls.duration_minutes / subjects.length : cls.duration_minutes

      const logInserts: any[] = []
      if (subjects.length > 0) {
        for (const sub of subjects) {
          logInserts.push({
            student_id: studentId,
            academic_year_id: academicYearId,
            subject_id: sub.subject_id,
            date,
            duration_minutes: durationPerSubject,
            log_type: 'Co-op Class',
            notes: `Attended Co-op: ${cls.name}`,
            pending_parent_approval: false // Already confirmed by marking present manually
          })
        }
      } else {
        logInserts.push({
          student_id: studentId,
          academic_year_id: academicYearId,
          date,
          duration_minutes: durationPerSubject,
          log_type: 'Co-op Class',
          notes: `Attended Co-op: ${cls.name}`,
          pending_parent_approval: false
        })
      }

      await supabase.from('daily_logs').insert(logInserts)
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
