'use server'

import { createClient } from'@/utils/supabase/server'
import { revalidatePath } from'next/cache'

export async function addCurriculumItem(curriculumId: string, formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const sequence_order = parseInt(formData.get('sequence_order') as string, 10)
  const item_type = formData.get('item_type') as string
  const estimated_minutes = parseInt(formData.get('estimated_minutes') as string, 10)

  if (!title || isNaN(sequence_order) || !item_type || isNaN(estimated_minutes)) {
    throw new Error("All fields are required")
  }

  const { error } = await supabase.from('curriculum_items').insert([{
    curriculum_id: curriculumId,
    title,
    sequence_order,
    item_type,
    estimated_minutes
  }])

  if (error) {
    console.error("Insert error:", error)
    throw new Error("Failed to add curriculum item")
  }

  revalidatePath(`/curriculum/${curriculumId}/items`)
  return { success: true }
}

export async function bulkAddCurriculumItems(curriculumId: string, formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const bulkText = formData.get('bulkText') as string
  const start_sequence = parseInt(formData.get('start_sequence') as string, 10) || 1
  const item_type = formData.get('item_type') as string
  const estimated_minutes = parseInt(formData.get('estimated_minutes') as string, 10)

  if (!bulkText || !item_type || isNaN(estimated_minutes)) {
    throw new Error("Missing required fields for bulk upload")
  }

  // Parse lines, ignoring empty lines
  const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  if (lines.length === 0) {
    throw new Error("No valid items found in the text")
  }

  const itemsToInsert = lines.map((title, index) => ({
    curriculum_id: curriculumId,
    title,
    sequence_order: start_sequence + index,
    item_type,
    estimated_minutes
  }))

  const { error } = await supabase.from('curriculum_items').insert(itemsToInsert)

  if (error) {
    console.error("Insert error:", error)
    throw new Error("Failed to add curriculum items")
  }

  revalidatePath(`/curriculum/${curriculumId}/items`)
  return { success: true }
}

export async function csvBulkAddCurriculumItems(curriculumId: string, itemsToInsert: any[]) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // The client side has already validated the schema, but we do a quick check
  if (!itemsToInsert || itemsToInsert.length === 0) {
    throw new Error("No items to insert")
  }

  // Supabase `.insert(array)` is atomic by default. If any row fails constraints, the whole request fails.
  const { error } = await supabase.from('curriculum_items').insert(itemsToInsert)

  if (error) {
    console.error("CSV Bulk Insert error:", error)
    throw new Error(`Database insert failed: ${error.message}`)
  }

  revalidatePath(`/curriculum/${curriculumId}/items`)
  return { success: true }
}

export async function generate36WeekSchedule(curriculumId: string, nextSequence: number, daysPerWeek: number = 4) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const totalWeeks = 36
  const itemsToInsert = []
  
  let currentSeq = nextSequence
  for (let week = 1; week <= totalWeeks; week++) {
    for (let day = 1; day <= daysPerWeek; day++) {
      itemsToInsert.push({
        curriculum_id: curriculumId,
        sequence_order: currentSeq++,
        title: `Week ${week} - Day ${day}`,
        item_type:'worksheet', // Generic default
        estimated_minutes: 45
      })
    }
  }

  const { error } = await supabase.from('curriculum_items').insert(itemsToInsert)

  if (error) {
    console.error("Schedule generator error:", error)
    throw new Error(`Failed to generate schedule: ${error.message || JSON.stringify(error)}`)
  }

  revalidatePath(`/curriculum/${curriculumId}/items`)
  return { success: true }
}

export async function deleteCurriculumItem(curriculumId: string, itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('curriculum_items').delete().eq('id', itemId).eq('curriculum_id', curriculumId)

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`)
  }

  revalidatePath(`/curriculum/${curriculumId}/items`)
  return { success: true }
}

export async function deleteAllCurriculumItems(curriculumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('curriculum_items').delete().eq('curriculum_id', curriculumId)

  if (error) {
    throw new Error(`Failed to delete items: ${error.message}`)
  }

  revalidatePath(`/curriculum/${curriculumId}/items`)
  return { success: true }
}
