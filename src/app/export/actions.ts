'use server'

import { createClient } from'@/utils/supabase/server'

export async function fetchExportData(studentId: string, yearId: string) {
  const supabase = await createClient()

  // 1. Total logged hours
  let logsQuery = supabase
    .from('daily_logs')
    .select('duration_minutes, subject_id')
    .eq('student_id', studentId)
    .neq('log_type', 'Planned')
    
  if (yearId !=='all') {
    logsQuery = logsQuery.eq('academic_year_id', yearId)
  }

  let logs: any[] = []
  let page = 0
  while (true) {
    const { data } = await logsQuery.range(page * 1000, (page + 1) * 1000 - 1)
    if (data && data.length > 0) logs = logs.concat(data)
    if (!data || data.length < 1000) break
    page++
  }

  const totalMinutes = logs?.reduce((acc, l) => acc + l.duration_minutes, 0) || 0
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  // 2. 6-Subject Checklist (which subjects had activity)
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name')
  
  const subjectsWithHours = allSubjects?.map(s => {
    const subjectLogs = logs?.filter(l => l.subject_id === s.id) || []
    const hrs = subjectLogs.reduce((acc, l) => acc + l.duration_minutes, 0) / 60
    return {
      id: s.id,
      name: s.name,
      hours: hrs
    }
  }) || []

  // 3. Curriculum Completion
  const { data: curriculaAssignments } = await supabase
    .from('student_curricula')
    .select(`
      id,
      current_sequence_order,
      curricula (
        title,
        pacing_type,
        subjects (name)
      )
    `)
    .eq('student_id', studentId)

  // 4. Standards (Optional: we can pull standard stats if needed, or leave simple for MVP)
  
  // 5. Transcripts
  let transcriptsQuery = supabase
    .from('transcripts')
    .select('id, credit_earned, grade_mark, subjects(name)')
    .eq('student_id', studentId)

  if (yearId !=='all') {
    transcriptsQuery = transcriptsQuery.eq('academic_year_id', yearId)
  }

  const { data: transcripts } = await transcriptsQuery

  // 6. Portfolio Photos
  const { data: media } = await supabase
    .from('media_attachments')
    .select('file_url')
    .eq('is_portfolio_sample', true)
    // To strictly limit to year, we'd join daily_logs. For MVP, we'll just grab their samples.
    // In a real app we'd filter by date range of the yearId.
    .limit(20)
  
  const photos = media?.map(m => m.file_url) || []

  return {
    totalHours,
    subjects: subjectsWithHours,
    curricula: curriculaAssignments,
    transcripts: transcripts || [],
    photos
  }
}

export async function fetchPortfolioMedia(studentId: string, yearId: string) {
  const supabase = await createClient()
  let query = supabase
    .from('media_attachments')
    .select('file_url')
    .eq('is_portfolio_sample', true)
    .limit(10)

  // In a real app we'd filter by the academic_year_id dates by joining. 
  // For MVP, we just pull 10 samples if they want the portfolio.
  const { data: media } = await query
  return media?.map(m => m.file_url) || []
}
export async function proxyImageFetch(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch image');
    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') ||'image/jpeg';
    return"data:"+ contentType +";base64,"+ b64;
  } catch (err) {
    console.error('Proxy error for', url, err);
    return'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}
