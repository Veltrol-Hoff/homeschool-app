'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function addTranscript(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const student_id = formData.get('student_id') as string
  const academic_year_id = formData.get('academic_year_id') as string
  const subject_id = formData.get('subject_id') as string
  const credit_earned = parseFloat(formData.get('credit_earned') as string)
  const grade_mark = formData.get('grade_mark') as string
  const course_name = (formData.get('course_name') as string) || null

  if (!student_id || !academic_year_id || !subject_id || isNaN(credit_earned) || !grade_mark) {
    throw new Error("Missing required fields")
  }

  const { error } = await supabase
    .from('transcripts')
    .insert([{
      student_id,
      academic_year_id,
      subject_id,
      credit_earned,
      grade_mark,
      course_name
    }])

  if (error) {
    console.error("Transcript insert error:", error)
    throw new Error("Failed to add transcript entry.")
  }

  revalidatePath('/transcripts')
  return { success: true }
}

export async function deleteTranscript(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('transcripts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error("Transcript delete error:", error)
    throw new Error("Failed to delete transcript entry.")
  }

  revalidatePath('/transcripts')
  return { success: true }
}

export async function updateTranscript(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const id = formData.get('id') as string
  const subject_id = formData.get('subject_id') as string
  const credit_earned = parseFloat(formData.get('credit_earned') as string)
  const grade_mark = formData.get('grade_mark') as string
  const course_name = (formData.get('course_name') as string) || null

  if (!id || !subject_id || isNaN(credit_earned) || !grade_mark) {
    throw new Error("Missing required fields")
  }

  const { error } = await supabase
    .from('transcripts')
    .update({
      subject_id,
      credit_earned,
      grade_mark,
      course_name
    })
    .eq('id', id)

  if (error) {
    console.error("Transcript update error:", error)
    throw new Error("Failed to update transcript entry.")
  }

  revalidatePath('/transcripts')
  return { success: true }
}
