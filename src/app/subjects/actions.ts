'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function assignCurriculum(formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const student_id = formData.get('student_id') as string
  const curriculum_id = formData.get('curriculum_id') as string
  const start_date = formData.get('start_date') as string

  if (!student_id || !curriculum_id || !start_date) {
    throw new Error("All fields are required")
  }

  // Insert or update (upsert is easiest if we assume 1 active curriculum per subject, but the schema allows multiple per student. 
  // Let's just insert, but if they already assigned this exact curriculum, update the start_date)
  const { error } = await supabase.from('student_curricula').upsert([{
    student_id,
    curriculum_id,
    start_date,
    current_sequence_order: 1 // Reset to 1 on new assignment
  }], { onConflict:'student_id, curriculum_id'})

  if (error) {
    console.error("Assign error:", error)
    throw new Error("Failed to assign curriculum")
  }

  revalidatePath('/subjects')
  return { success: true }
}
