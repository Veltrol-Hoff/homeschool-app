import { createClient } from'@/utils/supabase/server'
import { NextResponse } from'next/server'
import fs from'fs'

export async function GET() {
  const supabase = await createClient()
  const { data: logs, error: logsError } = await supabase.from('daily_logs').select('*')
  
  // Log to a file locally so we can read it!
  fs.writeFileSync('C:/Users/ewhof/Desktop/HomeSchool App/debug_logs.json', JSON.stringify({ logs, logsError }, null, 2))
  
  return NextResponse.json({ ok: true })
}
