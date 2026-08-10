import { createClient } from'@/utils/supabase/server'
import { NextResponse } from'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: cols, error: selError } = await supabase.from('students').select('*').limit(1)
    
    const { error: updateError } = await supabase.from('students').update({
      bio_favorites:'test',
      bio_future_career:'test',
      can_view_grades: false,
      can_view_compliance: false,
      reward_points: 0,
      display_color:'#10B981',
      avatar_url: null
    }).eq('id','00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ updateError, cols: cols ? cols[0] : null })
  } catch (e: any) {
    return NextResponse.json({ exception: e.message })
  }
}
