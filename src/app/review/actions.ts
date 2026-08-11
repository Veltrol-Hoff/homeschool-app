'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { adjustMasteryPacing } from '@/lib/pacing-engine'

export async function confirmWorkSample(id: string, feedback: string, score: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  
  if (profile?.household_role ==='student') {
    throw new Error("Students cannot confirm work samples.")
  }

  const { error } = await supabase
    .from('work_samples')
    .update({
      ai_feedback: feedback, // overwrite with parent's edits
      confirmed_score: score,
      status:'confirmed'
    })
    .eq('id', id)

  if (error) throw error

  // Trigger mastery pacing adjustment if needed
  try {
    await adjustMasteryPacing(id)
  } catch (err) {
    console.error("Failed to adjust mastery pacing:", err)
  }

  revalidatePath('/review')
  revalidatePath('/compliance')
  revalidatePath('/dashboard')
}

export async function approveLog(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') throw new Error("Students cannot approve logs.")

  // We should also increment reward points for the student when a log is approved.
  // First, get the student ID from the log
  const { data: log } = await supabase.from('daily_logs').select('student_id').eq('id', id).single()
  
  if (log && log.student_id) {
    // We increment by 1 for simplicity, or we can just call an RPC/update
    // Supabase has no easy increment in simple update without RPC, so we fetch and add
    const { data: student } = await supabase.from('students').select('reward_points').eq('id', log.student_id).single()
    if (student) {
      await supabase.from('students').update({ reward_points: (student.reward_points || 0) + 1 }).eq('id', log.student_id)
    }
  }

  await supabase.from('daily_logs').update({ pending_parent_approval: false }).eq('id', id)
  
  revalidatePath('/review')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/compliance')
}

export async function rejectLog(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') throw new Error("Students cannot reject logs.")

  await supabase.from('daily_logs').delete().eq('id', id)
  
  revalidatePath('/review')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/compliance')
}

export async function approveNarrationTag(id: string, skill: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') throw new Error("Students cannot approve narrations.")

  await supabase.from('narrations').update({ tagged_skill: skill, tag_confirmed: true }).eq('id', id)
  
  revalidatePath('/review')
}

export async function rejectNarrationTag(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') throw new Error("Students cannot reject narrations.")

  await supabase.from('narrations').delete().eq('id', id)
  
  revalidatePath('/review')
}

export async function approveStandardSuggestion(curriculum_item_id: string, standard_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') throw new Error("Students cannot approve standards.")

  await supabase.from('curriculum_item_standards').update({ confirmed: true }).eq('curriculum_item_id', curriculum_item_id).eq('standard_id', standard_id)
  
  revalidatePath('/review')
  revalidatePath('/compliance')
}

export async function rejectStandardSuggestion(curriculum_item_id: string, standard_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') throw new Error("Students cannot reject standards.")

  await supabase.from('curriculum_item_standards').delete().eq('curriculum_item_id', curriculum_item_id).eq('standard_id', standard_id)
  
  revalidatePath('/review')
  revalidatePath('/compliance')
}
