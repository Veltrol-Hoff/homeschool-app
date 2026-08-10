'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'
import { redirect } from'next/navigation'

export async function createUnitStudy(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const topic_description = formData.get('topic_description') as string
  const subject_id = formData.get('subject_id') as string
  const template_id = formData.get('template_id') as string

  if (!title) throw new Error("Title is required")

  const { data, error } = await supabase.from('unit_studies').insert([{
    title,
    topic_description,
    subject_id: subject_id || null,
    template_id: template_id || null
  }]).select().single()

  if (error) {
    console.error("Create Unit Study error:", error)
    throw new Error("Failed to create unit study")
  }

  revalidatePath('/unit-studies')
  redirect(`/unit-studies/${data.id}`)
}

export async function addObjective(unitStudyId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const student_id = formData.get('student_id') as string
  const objective_description = formData.get('objective_description') as string

  if (!student_id || !objective_description) throw new Error("Fields missing")

  const { error } = await supabase.from('unit_study_objectives').insert([{
    unit_study_id: unitStudyId,
    student_id,
    objective_description
  }])

  if (error) {
    console.error("Add Objective error:", error)
    throw new Error("Failed to add objective")
  }

  revalidatePath(`/unit-studies/${unitStudyId}`)
  return { success: true }
}
