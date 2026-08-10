import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase.from('daily_logs').update({ log_type: 'Planned' }).eq('log_type', 'curriculum')
  
  return NextResponse.json({ success: true, error })
}
