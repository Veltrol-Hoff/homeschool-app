'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function addMediaAttachment(url: string, logId?: string, tripId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('media_attachments').insert([{
    file_url: url,
    log_id: logId || null,
    trip_id: tripId || null,
    is_portfolio_sample: false
  }])

  if (error) {
    console.error("Add media error:", error)
    throw new Error("Failed to save media record")
  }

  // Revalidate both just to be safe
  revalidatePath('/trips')
  revalidatePath('/dashboard')
}

export async function togglePortfolioSample(mediaId: string, currentState: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('media_attachments')
    .update({ is_portfolio_sample: !currentState })
    .eq('id', mediaId)

  if (error) {
    console.error("Toggle portfolio error:", error)
    throw new Error("Failed to update media record")
  }

  revalidatePath('/trips')
  revalidatePath('/dashboard')
}
