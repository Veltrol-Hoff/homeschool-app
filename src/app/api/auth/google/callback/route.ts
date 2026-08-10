import { NextResponse } from'next/server'
import { google } from'googleapis'
import { createClient } from'@/utils/supabase/server'
import { encrypt } from'@/utils/crypto'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // Should be user.id

  if (!code) {
    return NextResponse.json({ error:'Missing code'}, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== state) {
    return NextResponse.json({ error:'Unauthorized or state mismatch'}, { status: 401 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL ||'http://localhost:3000'}/api/auth/google/callback`
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      throw new Error("No access token returned")
    }

    // Get user's Google email
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version:'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const googleEmail = userInfo.data.email

    if (!googleEmail) {
      throw new Error("Could not determine Google account email")
    }

    // Store in DB
    const { error } = await supabase
      .from('google_calendar_connections')
      .upsert({
        id: user.id,
        google_account_email: googleEmail,
        target_calendar_id:'primary', // Default to primary calendar
        sync_direction:'one-way',
        access_token: encrypt(tokens.access_token),
        refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined
        // If refresh_token is not returned (user already authorized without'consent'prompt), 
        // we might have a problem if it's not already stored, but we enforced prompt='consent'.
      }, { onConflict:'id'})

    if (error) {
      console.error("DB Upsert error:", error)
      return NextResponse.json({ error:'Failed to save connection'}, { status: 500 })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL ||'http://localhost:3000'}/sync-settings`)

  } catch (error: any) {
    console.error("Callback error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
