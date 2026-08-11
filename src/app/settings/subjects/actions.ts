'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function createSubject(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const is_state_required = formData.get('is_state_required') ==='on'
  const color_hex = formData.get('color_hex') as string
  const icon_name = formData.get('icon_name') as string
  const is_family_subject = formData.get('is_family_subject') === 'on'

  const { error } = await supabase.from('subjects').insert([{
    name,
    is_state_required,
    is_family_subject,
    color_hex: color_hex || null,
    icon_name: icon_name || null
  }])

  if (error) throw new Error("Failed to create subject:"+ error.message)

  revalidatePath('/settings/subjects')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}

export async function updateSubject(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const is_state_required = formData.get('is_state_required') ==='on'
  const color_hex = formData.get('color_hex') as string
  const icon_name = formData.get('icon_name') as string
  const is_family_subject = formData.get('is_family_subject') === 'on'

  const { error } = await supabase.from('subjects').update({
    name,
    is_state_required,
    is_family_subject,
    color_hex: color_hex || null,
    icon_name: icon_name || null
  }).eq('id', id)

  if (error) throw new Error("Failed to update subject")

  revalidatePath('/settings/subjects')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteSubject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw new Error("Failed to delete subject. It might be in use.")
  
  revalidatePath('/settings/subjects')
  return { success: true }
}
