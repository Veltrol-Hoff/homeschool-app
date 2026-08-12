const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('media_attachments')
    .select(`
      id, 
      file_url, 
      created_at,
      log_id,
      trip_id,
      is_portfolio_sample,
      caption,
      daily_logs!left (
        date,
        notes,
        student_id,
        academic_year_id,
        subject_id,
        subjects (name)
      ),
      trips!left (
        title,
        start_date,
        trip_students (student_id),
        trip_subjects (subject_id)
      )
    `)
    .limit(1)

  console.log('Error:', error)
}

test()
