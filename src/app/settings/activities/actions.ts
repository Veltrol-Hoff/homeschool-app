'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function createActivity(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const color = formData.get('color') as string ||'#10B981'
  const icon = formData.get('icon') as string ||'Dumbbell'

  const { error } = await supabase.from('activities').insert([{ name, color, icon }])
  if (error) throw new Error(error.message)

  revalidatePath('/settings/activities')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}

export async function updateActivity(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const color = formData.get('color') as string ||'#10B981'
  const icon = formData.get('icon') as string ||'Dumbbell'

  const { error } = await supabase.from('activities').update({ name, color, icon }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/settings/activities')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteActivity(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/settings/activities')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}
