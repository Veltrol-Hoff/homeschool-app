'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function getSchoolSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('school_settings').select('*').eq('id', 1).single()
  return data || { year_start_month: 7, year_start_day: 1, goal_hours: 875, hours_per_credit: 120 }
}

export async function updateSchoolSettings(formData: FormData) {
  const supabase = await createClient()
  
  const updates = {
    id: 1,
    year_start_month: parseInt(formData.get('year_start_month') as string, 10),
    year_start_day: parseInt(formData.get('year_start_day') as string, 10),
    goal_hours: parseInt(formData.get('goal_hours') as string, 10),
    hours_per_credit: parseInt(formData.get('hours_per_credit') as string, 10),
  }
  
  const { error } = await supabase
    .from('school_settings')
    .upsert(updates, { onConflict:'id'})
    
  if (error) {
    throw new Error(error.message)
  }
  
  revalidatePath('/settings/account')
  revalidatePath('/dashboard')
  revalidatePath('/','layout')
  
  return { success: true }
}

export async function clearTestData() {
  const supabase = await createClient()
  
  // Delete all daily_logs
  const { error: logsError } = await supabase.from('daily_logs').delete().neq('id','00000000-0000-0000-0000-000000000000')
  if (logsError) throw new Error(logsError.message)
    
  // Delete all trips
  const { error: tripsError } = await supabase.from('trips').delete().neq('id','00000000-0000-0000-0000-000000000000')
  if (tripsError) throw new Error(tripsError.message)

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  revalidatePath('/student/[id]','page')
  revalidatePath('/','layout')
  
  return { success: true }
}

export async function clearPortfolioData() {
  const supabase = await createClient()
  
  // Delete all media attachments
  const { error: mediaError } = await supabase.from('media_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (mediaError) throw new Error(mediaError.message)

  revalidatePath('/portfolio')
  revalidatePath('/student/[id]', 'page')
  revalidatePath('/export')
  
  return { success: true }
}

export async function createAcademicYear(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('academic_years').insert({
    name: formData.get('name') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings/account')
}

export async function updateAcademicYear(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('academic_years').update({
    name: formData.get('name') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/account')
}

export async function deleteAcademicYear(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('academic_years').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/account')
}

export async function deleteUserAction(id: string) {
  const supabase = await createClient()
  
  // 1. Verify caller is an owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
    
  const { data: currentUserProfile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (currentUserProfile?.household_role !== 'owner') {
    throw new Error("Only owners can delete users.")
  }

  // 2. Fetch the target user's profile
  const { data: targetProfile } = await supabase.from('profiles').select('household_role').eq('id', id).single()
  
  if (targetProfile?.household_role === 'owner') {
    // 3. Count total owners
    const { data: allOwners, error: countError } = await supabase.from('profiles').select('id').eq('household_role', 'owner')
    if (countError) throw new Error("Failed to count owners")
      
    if (allOwners && allOwners.length <= 1) {
      throw new Error("Cannot delete the last owner of the account. There must always be at least one owner.")
    }
  }

  // 4. Delete the user using Admin API
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)
  
  if (deleteError) {
    throw new Error("Failed to delete user: " + deleteError.message)
  }

  revalidatePath('/settings/account')
}
