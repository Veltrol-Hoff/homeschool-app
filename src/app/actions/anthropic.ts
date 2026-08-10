'use server'

import Anthropic from'@anthropic-ai/sdk'
import { createClient } from'@/utils/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ||'', // Assumes ANTHROPIC_API_KEY is in .env.local
})

export async function generateBioSummary(studentId: string, academicYearId: string) {
  const supabase = await createClient()

  // 1. Fetch the student's bio entries for this year
  // In a real app, we'd filter by the academic_year date range. For now, we grab all entries for the student.
  const { data: entries } = await supabase
    .from('living_bio_entries')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })

  if (!entries || entries.length === 0) {
    throw new Error('No living bio entries found for this student.')
  }

  const entriesText = entries.map(e => `[${e.category}] ${e.entry_text}`).join('\n')

  const prompt = `You are an expert educator writing an end-of-year portfolio summary. 
Synthesize the following student bio entries into a short, warm, 3-4 sentence paragraph highlighting how the student's interests and goals evolved over the year.

Student Entries:
${entriesText}`

  try {
    const msg = await anthropic.messages.create({
      model:"claude-3-5-sonnet-20240620",
      max_tokens: 300,
      temperature: 0.7,
      system:"You write warm, professional end-of-year academic summaries.",
      messages: [
        { role:"user", content: prompt }
      ]
    })

    const aiDraft = (msg.content[0] as any).text

    // Save draft to DB
    await supabase.from('academic_years').update({
      ai_draft_bio_summary: aiDraft
    }).eq('id', academicYearId)

    return { success: true, draft: aiDraft }
  } catch (error: any) {
    console.error('Anthropic Error:', error)
    throw new Error('Failed to generate summary from AI.')
  }
}

export async function confirmBioSummary(academicYearId: string, summary: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('academic_years').update({
    confirmed_bio_summary: summary
  }).eq('id', academicYearId)

  if (error) throw new Error('Failed to save confirmed summary.')
  return { success: true }
}
