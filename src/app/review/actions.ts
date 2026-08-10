'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

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

  revalidatePath('/review')
  revalidatePath('/compliance')
  revalidatePath('/dashboard')
}
