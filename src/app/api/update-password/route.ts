import { createClient } from'@supabase/supabase-js'
import { createClient as createServerClient } from'@/utils/supabase/server'
import { NextResponse } from'next/server'

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error:'Unauthorized'}, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('household_role')
      .eq('id', user.id)
      .single()

    if (profile?.household_role !=='owner') {
      return NextResponse.json({ error:'Only owners can edit passwords'}, { status: 403 })
    }

    const { targetUserId, newPassword } = await request.json()

    if (!targetUserId || !newPassword) {
      return NextResponse.json({ error:'Missing required fields'}, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error:'Server misconfiguration: missing service role key'}, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Update Password Error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message ||'Internal Server Error'}, { status: 500 })
  }
}
