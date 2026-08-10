import { NextResponse } from'next/server'
import { createClient } from'@/utils/supabase/server'
// In a real app we'd use the official @anthropic-ai/sdk
// import Anthropic from'@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized'}, { status: 401 })

    const { itemId, description, subjectName } = await request.json()

    // 1. Fetch relevant standards for this subject to provide as context to Claude
    const { data: standards } = await supabase
      .from('standards')
      .select('id, code, short_description')
      .ilike('subject', `%${subjectName}%`)
      .limit(20)

    if (!standards || standards.length === 0) {
      return NextResponse.json({ error:'No standards found for this subject'}, { status: 400 })
    }

    // 2. Call Anthropic API
    // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    // const msg = await anthropic.messages.create({
    //   model:'claude-3-haiku-20240307',
    //   max_tokens: 100,
    //   system:'You match curriculum descriptions to the single most relevant educational standard code from the provided list. Reply ONLY with the exact standard code. No other text.',
    //   messages: [{
    //     role:'user', 
    //     content: `Standards:\n${standards.map(s => `${s.code}: ${s.short_description}`).join('\n')}\n\nItem: ${description}`
    //   }]
    // })
    // const suggestedCode = msg.content[0].text.trim()
    
    // MOCK API CALL for local dev without requiring real Anthropic credits:
    // We just pick the first standard as the"AI suggestion"
    const suggestedCode = standards[0].code
    const suggestedStandardId = standards[0].id

    // 3. Write suggestion to database (ai_suggested = true, confirmed = false)
    const { error } = await supabase.from('curriculum_item_standards').upsert({
      curriculum_item_id: itemId,
      standard_id: suggestedStandardId,
      ai_suggested: true,
      confirmed: false
    }, { onConflict:'curriculum_item_id, standard_id'})

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      suggestion: { 
        id: suggestedStandardId,
        code: suggestedCode, 
        description: standards[0].short_description 
      } 
    })

  } catch (error: any) {
    console.error('AI Suggestion Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
