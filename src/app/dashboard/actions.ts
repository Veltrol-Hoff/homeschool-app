'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function deleteStudent(studentId: string, password: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { error:'Unauthorized'}
  }

  // Verify the password by attempting to sign in again
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (authError) {
    return { error:'Incorrect password'}
  }

  // Password is correct, proceed with deletion
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error:'Failed to delete student from database'}
  }

  revalidatePath('/dashboard')
  revalidatePath('/compliance')
  return { success: true }
}
