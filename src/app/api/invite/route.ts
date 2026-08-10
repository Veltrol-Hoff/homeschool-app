import { createClient } from'@supabase/supabase-js'
import { createClient as createServerClient } from'@/utils/supabase/server'
import { NextResponse } from'next/server'

export async function POST(request: Request) {
  try {
    // 1. Authenticate the caller using the standard server client
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error:'Unauthorized'}, { status: 401 })
    }

    // 2. Verify caller is an'owner'
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('household_role')
      .eq('id', user.id)
      .single()

    if (profile?.household_role !=='owner') {
      return NextResponse.json({ error:'Only owners can invite new accounts'}, { status: 403 })
    }

    // 3. Parse request body
    const { email, password, role, linked_student_id } = await request.json()

    if (!email || !role || !password) {
      return NextResponse.json({ error:'Missing required fields'}, { status: 400 })
    }

    if (role ==='student'&& !linked_student_id) {
      return NextResponse.json({ error:'Student accounts must be linked to a student record'}, { status: 400 })
    }

    // 4. Initialize Supabase Admin client with service_role key
    // Note: In production this must be set securely in the environment
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

    // 5. Create User directly (auto-confirming email)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (inviteError) {
      console.error("Create User Error:", inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // 6. Create matching profile entry
    // Since we used admin client, it bypasses RLS, but it's safe because we verified the caller above.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: inviteData.user.id,
        household_role: role,
        linked_student_id: role ==='student'? linked_student_id : null,
        status:'active',
        display_name: email.split('@')[0] // Temporary display name
      }])

    if (profileError) {
      console.error("Profile Creation Error:", profileError)
      return NextResponse.json({ error:'Invite sent, but failed to create profile record'}, { status: 500 })
    }

    return NextResponse.json({ success: true, user: inviteData.user })
    
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message ||'Internal Server Error'}, { status: 500 })
  }
}
