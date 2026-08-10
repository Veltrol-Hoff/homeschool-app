import { NextResponse } from'next/server'
import { google } from'googleapis'
import { createClient } from'@/utils/supabase/server'
import { decrypt } from'@/utils/crypto'
import { isPi1206FilingWindow } from'@/utils/date'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized'}, { status: 401 })

    // Get owner's connection
    const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
    
    // In a real automated job, we would iterate all connections, but since this is triggered by the user
    // or we only have one owner, we'll sync the owner's connection.
    const { data: connection } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('id', profile?.household_role ==='owner'? user.id :'owner_id_logic_here')
      .single()

    if (!connection) {
      return NextResponse.json({ error:'No Google Calendar connection found'}, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL ||'http://localhost:3000'}/api/auth/google/callback`
    )

    // Decrypt refresh token
    const refreshToken = decrypt(connection.refresh_token)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    const calendar = google.calendar({ version:'v3', auth: oauth2Client })
    let syncedCount = 0

    // ==========================================
    // 1. Sync Trips (Field Trips/Vacations)
    // ==========================================
    const { data: trips } = await supabase.from('trips').select('*')
    if (trips) {
      for (const trip of trips) {
        if (!trip.start_date) continue

        const event = {
          summary: `✈️ Trip: ${trip.title}`,
          description: trip.description ||'',
          location: trip.location ||'',
          start: { date: trip.start_date },
          end: { date: trip.end_date || trip.start_date },
        }

        // Ideally trips would have a google_event_id column too. Let's add it to trips on the fly or just assume they don't for now
        // For MVP, if we don't have google_event_id on trips, we might create duplicates, 
        // so let's just do a basic insert for demonstration, or search by summary.
        // Best practice: search existing event.
        const res = await calendar.events.list({
          calendarId: connection.target_calendar_id ||'primary',
          q: `✈️ Trip: ${trip.title}`,
          timeMin: new Date(new Date(trip.start_date).getTime() - 86400000).toISOString(),
          timeMax: new Date(new Date(trip.start_date).getTime() + 86400000).toISOString()
        })

        const existing = res.data.items?.[0]
        if (existing) {
          await calendar.events.update({
            calendarId: connection.target_calendar_id ||'primary',
            eventId: existing.id!,
            requestBody: event
          })
        } else {
          await calendar.events.insert({
            calendarId: connection.target_calendar_id ||'primary',
            requestBody: event
          })
        }
        syncedCount++
      }
    }

    // ==========================================
    // 2. Sync Curriculum Items (Planned lessons)
    // ==========================================
    // In Phase 1.5, curriculum_items don't have explicit due dates, they are derived from sequence_order + start_date.
    // For MVP sync, we'll sync items that have an estimated_minutes and try to mock a date or just skip if no date logic exists yet.
    // Since we must demonstrate it, let's sync items to"today"if they are pending.
    
    // ==========================================
    // 3. Sync PI-1206 Deadline
    // ==========================================
    const currentYear = new Date().getFullYear()
    const oct15 = new Date(`${currentYear}-10-15`)
    
    const piEvent = {
      summary:'⚠️ PI-1206 Filing Deadline',
      description:'Deadline to submit the PI-1206 form to the WI DPI.',
      start: { date: `${currentYear}-10-15` },
      end: { date: `${currentYear}-10-16` },
    }

    const piRes = await calendar.events.list({
      calendarId: connection.target_calendar_id ||'primary',
      q:'PI-1206 Filing Deadline',
      timeMin: new Date(`${currentYear}-10-01`).toISOString(),
      timeMax: new Date(`${currentYear}-10-31`).toISOString()
    })

    if (piRes.data.items && piRes.data.items.length > 0) {
      await calendar.events.update({
        calendarId: connection.target_calendar_id ||'primary',
        eventId: piRes.data.items[0].id!,
        requestBody: piEvent
      })
    } else {
      await calendar.events.insert({
        calendarId: connection.target_calendar_id ||'primary',
        requestBody: piEvent
      })
      syncedCount++
    }

    return NextResponse.json({ success: true, syncedCount })

  } catch (error: any) {
    console.error("Sync API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
