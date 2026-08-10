import { NextResponse } from'next/server'
import { createClient } from'@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { imageUrl, logId, subjectId } = await request.json()

    if (!imageUrl || !logId) {
      return NextResponse.json({ error:'Missing required fields'}, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized'}, { status: 401 })

    // Simulate Anthropic Vision API call
    // In production:
    // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // const response = await anthropic.messages.create({ ... image block ... })
    // const ai_feedback = response.content[0].text;
    
    // MOCK RESPONSE for MVP:
    await new Promise(resolve => setTimeout(resolve, 1500)) // Fake latency
    const ai_feedback ="The student successfully completed all addition problems on the page. They showed their work clearly for the carry-over digits, demonstrating a solid grasp of double-digit addition. There was one minor mistake on question 4 where they forgot to add the carried'1'."
    const ai_suggested_score ="Demonstrated"

    const { data, error } = await supabase
      .from('work_samples')
      .insert({
        log_id: logId,
        subject_id: subjectId,
        image_url: imageUrl,
        ai_feedback,
        ai_suggested_score,
        status:'draft'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, workSample: data })

  } catch (error: any) {
    console.error("Work sample API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
