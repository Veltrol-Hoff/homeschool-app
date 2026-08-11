import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { imageUrl, logId, subjectId } = await request.json()

    if (!imageUrl || !logId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let ai_feedback = "No feedback generated."
    let ai_suggested_score = "N/A"

    if (process.env.GEMINI_API_KEY) {
      try {
        // Fetch the image to get base64 and mime type
        const imageRes = await fetch(imageUrl)
        if (!imageRes.ok) throw new Error("Failed to fetch image for analysis.")
        
        const arrayBuffer = await imageRes.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Image = buffer.toString('base64')
        const mimeType = imageRes.headers.get('content-type') || 'image/jpeg'

        const prompt = `You are an encouraging and supportive homeschool teacher grading a student's work sample. 
Please review the attached image of their work.
Output your evaluation strictly as a JSON object with the following schema:
{
  "ai_feedback": "A 2-3 sentence encouraging review of the student's work. Point out what they did well and gently note any mistakes.",
  "ai_suggested_score": "A short suggested score. Use a mastery-based scale (e.g., 'Mastered', 'Demonstrated', 'Developing', 'Needs Practice') unless it is clearly a traditional test, in which case you may suggest a numerical or letter grade."
}
Return only the raw JSON object, without any markdown formatting, backticks, or extra text.`

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Image } }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.statusText}`)
        }

        const responseData = await response.json()
        const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

        try {
          const parsed = JSON.parse(textResponse)
          ai_feedback = parsed.ai_feedback || textResponse
          ai_suggested_score = parsed.ai_suggested_score || "Demonstrated"
        } catch (e) {
          console.error("Failed to parse Gemini JSON response:", e)
          ai_feedback = textResponse
          ai_suggested_score = "Demonstrated"
        }

      } catch (geminiError: any) {
        console.error("Gemini API Error:", geminiError)
        ai_feedback = "Error analyzing image with AI."
        ai_suggested_score = "Error"
      }
    } else {
      // Fallback for missing API key
      console.warn("GEMINI_API_KEY is not set. Using fallback grading.")
      await new Promise(resolve => setTimeout(resolve, 1500))
      ai_feedback = "The student successfully completed all addition problems on the page. They showed their work clearly for the carry-over digits, demonstrating a solid grasp of double-digit addition. There was one minor mistake on question 4 where they forgot to add the carried '1'."
      ai_suggested_score = "Demonstrated"
    }

    const { data, error } = await supabase
      .from('work_samples')
      .insert({
        log_id: logId,
        subject_id: subjectId,
        image_url: imageUrl,
        ai_feedback,
        ai_suggested_score,
        status: 'draft'
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
