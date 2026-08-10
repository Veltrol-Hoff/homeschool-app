'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function unlockReward(rewardId: string, studentId: string, cost: number) {
  const supabase = await createClient()
  
  // Verify student has enough points
  const { data: student } = await supabase.from('students').select('reward_points').eq('id', studentId).single()
  if (!student || student.reward_points < cost) {
    throw new Error("Not enough points!")
  }

  // Deduct points
  await supabase.from('students').update({
    reward_points: student.reward_points - cost
  }).eq('id', studentId)

  // Mark unlocked
  const { error } = await supabase.from('rewards').update({
    is_unlocked: true,
    unlocked_at: new Date().toISOString()
  }).eq('id', rewardId)

  if (error) throw new Error("Failed to unlock reward")

  revalidatePath(`/student/${studentId}`)
  return { success: true }
}
