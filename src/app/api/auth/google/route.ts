import { NextResponse } from'next/server'
import { google } from'googleapis'
import { createClient } from'@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error:'Unauthorized'}, { status: 401 })
  }

  // Check if owner
  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role !=='owner') {
    return NextResponse.json({ error:'Only owners can manage calendar sync'}, { status: 403 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL ||'http://localhost:3000'}/api/auth/google/callback`
  )

  const scopes = [
'https://www.googleapis.com/auth/calendar.readonly',
'https://www.googleapis.com/auth/calendar.events'
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type:'offline',
    prompt:'consent', // Force consent to get refresh token
    scope: scopes,
    state: user.id // Pass user ID as state to verify in callback
  })

  return NextResponse.redirect(url)
}
