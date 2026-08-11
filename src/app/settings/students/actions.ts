'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function updateStudentSettings(studentId: string, formData: FormData) {
  const supabase = await createClient()
  
  const current_grade_level = formData.get('current_grade_level') as string
  const can_view_grades = formData.get('can_view_grades') ==='on'
  const can_view_compliance = formData.get('can_view_compliance') ==='on'
  const reward_points = parseInt(formData.get('reward_points') as string) || 0
  const display_color = formData.get('display_color') as string ||'#10B981'// Default slate-500
  const avatar_url = formData.get('avatar_url') as string || null

  const { error } = await supabase.from('students').update({
    current_grade_level,
    can_view_grades,
    can_view_compliance,
    reward_points,
    display_color,
    avatar_url
  }).eq('id', studentId)

  if (error) {
    console.error("Supabase update error:", error)
    throw new Error("Failed to update student settings")
  }

  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createReward(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const points_required = parseInt(formData.get('points_required') as string) || 10

  const { error } = await supabase.from('rewards').insert([{
    student_id: studentId,
    title,
    points_required
  }])

  if (error) {
    return { success: false, error:"Failed to create reward:"+ error.message }
  }

  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true, error: null }
}

export async function deleteReward(rewardId: string) {
  const supabase = await createClient()
  
  // need student ID for revalidation
  const { data } = await supabase.from('rewards').select('student_id').eq('id', rewardId).single()
  
  const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
  if (error) throw new Error("Failed to delete reward")

  if (data) {
    revalidatePath('/settings/students')
    revalidatePath(`/student/${data.student_id}`)
  }
  return { success: true }
}

export async function addLivingBioEntry(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const entry_text = formData.get('entry_text') as string
  const category = formData.get('category') as string ||'Milestone'

  const { error } = await supabase.from('living_bio_entries').insert([{
    student_id: studentId,
    entry_text,
    category
  }])

  if (error) throw new Error("Failed to add living bio entry")

  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}

export async function updateLivingBioEntry(entryId: string, studentId: string, entry_text: string, category: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('living_bio_entries').update({
    entry_text,
    category
  }).eq('id', entryId)
  if (error) throw new Error("Failed to update bio entry")
  
  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}

export async function deleteLivingBioEntry(entryId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('living_bio_entries').delete().eq('id', entryId)
  if (error) throw new Error("Failed to delete bio entry")
  
  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}

export async function addBioMedia(bioId: string, url: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('media_attachments').insert({
    bio_id: bioId,
    file_url: url,
    is_portfolio_sample: false
  })
  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}

export async function createAcademicYear(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const academic_year_id = formData.get('academic_year_id') as string
  const grade_level = formData.get('grade_level') as string

  const { error } = await supabase.from('student_academic_years').insert([{
    student_id: studentId,
    academic_year_id,
    grade_level
  }])
  
  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}

export async function updateAcademicYear(mappingId: string, studentId: string, formData: FormData) {
  const supabase = await createClient()
  const academic_year_id = formData.get('academic_year_id') as string
  const grade_level = formData.get('grade_level') as string

  const { error } = await supabase.from('student_academic_years').update({
    academic_year_id,
    grade_level
  }).eq('id', mappingId)
  
  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}

export async function deleteAcademicYear(mappingId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('student_academic_years').delete().eq('id', mappingId)
  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(`/student/${studentId}`)
  return { success: true }
}
