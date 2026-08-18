'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadPI1206Url(year: number, url: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('pi_1206_forms')
    .upsert({ year, file_url: url })
    
  if (error) throw new Error(error.message)
  
  revalidatePath('/compliance')
  return { success: true }
}

export async function removePI1206Url(year: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('pi_1206_forms')
    .delete()
    .eq('year', year)
    
  if (error) throw new Error(error.message)
  
  revalidatePath('/compliance')
  return { success: true }
}
