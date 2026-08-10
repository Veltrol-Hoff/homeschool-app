'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function confirmStandardSuggestion(curriculumItemId: string, standardId: string, isConfirmed: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (isConfirmed) {
    // Update to confirmed
    await supabase.from('curriculum_item_standards')
      .update({ confirmed: true, ai_suggested: false })
      .match({ curriculum_item_id: curriculumItemId, standard_id: standardId })
  } else {
    // Reject by deleting the suggestion row
    await supabase.from('curriculum_item_standards')
      .delete()
      .match({ curriculum_item_id: curriculumItemId, standard_id: standardId })
  }

  // We could revalidate the path, but it's tricky since we don't have the curriculum_id here. 
  // Let's just return success and let the client hide it.
  return { success: true }
}
