import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: logs, error } = await supabase.from('daily_logs').select('*, subjects(name)').order('created_at', { ascending: false }).limit(20)
  if (error) {
    console.error(error)
  } else {
    console.log(logs.map(l => ({ id: l.id, date: l.date, type: l.log_type, subject: l.subjects?.name, notes: l.notes, time: l.duration_minutes, completed_date: l.completed_date })))
  }
}

run()
