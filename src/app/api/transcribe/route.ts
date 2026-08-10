import { NextResponse } from'next/server'
import { createClient } from'@/utils/supabase/server'
// import Anthropic from'@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized'}, { status: 401 })

    const { audioUrl, logId, studentId } = await request.json()

    // Mocking Anthropic Audio Transcription since Anthropic doesn't natively support Audio API like Whisper yet.
    // In a real scenario, you'd download the audio and send it to an audio-to-text service, 
    // then send the text to Anthropic for the skill tagging.
    
    // 1. Mock Transcript
    const transcript ="The frog jumped over the log, and then he found a friend. They went to the pond together."

    // 2. Mock Skill Suggestion (In reality, send transcript to Anthropic here)
    /*
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model:"claude-3-haiku-20240307",
      max_tokens: 50,
      messages: [{ role:"user", content: `Identify the primary comprehension skill demonstrated in this narration:"${transcript}". Options: Retelling, Sequencing, Inferencing, Vocabulary.` }]
    })
    const suggestedSkill = msg.content[0].text
    */
    const suggestedSkill ="Sequencing"

    // 3. Save to narrations table
    const { data: narration, error } = await supabase.from('narrations').insert([{
      student_id: studentId,
      log_id: logId,
      audio_url: audioUrl,
      transcript_text: transcript,
      tagged_skill: suggestedSkill,
      tag_confirmed: false
    }]).select().single()

    if (error) {
      console.error("Narration insert error:", error)
      return NextResponse.json({ error:'Failed to save narration'}, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      narration 
    })

  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
