import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import TranscriptClient from'./TranscriptClient'

export const dynamic ='force-dynamic'

export default async function TranscriptsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch students
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('name')
  
  if (!students || students.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-stone-900">Transcripts</h1>
        <div className="bg-white  p-6 rounded-2xl shadow-sm border border-stone-100">
          <p className="text-stone-500">No students found. Please add a student first.</p>
        </div>
      </div>
    )
  }

  // Fetch academic years via mapping
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    
  const academicYears = mappings?.map(m => {
    const ay = m.academic_years as any;
    return {
      id: m.academic_year_id,
      year_label: ay.name,
      grade_level: m.grade_level,
      start_date: ay.start_date,
      end_date: ay.end_date,
      student_id: m.student_id,
      mapping_id: m.id
    }
  }).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()) || [];

  // Fetch subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name')

  // Fetch logs for duration calculations
  let logs: any[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('daily_logs')
      .select('student_id, academic_year_id, subject_id, duration_minutes')
      .neq('log_type', 'Planned')
      .range(page * 1000, (page + 1) * 1000 - 1)
      
    if (data && data.length > 0) logs = logs.concat(data)
    if (!data || data.length < 1000) break
    page++
  }

  // Fetch work samples for grade projections
  // Note: we're keeping it simple for now, maybe just pulling statuses.
  const { data: workSamples } = await supabase
    .from('work_samples')
    .select('id, log_id, subject_id, confirmed_score, status, daily_logs!inner(student_id, academic_year_id)')
    .eq('status','confirmed')

  // Fetch existing transcripts
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*, subjects(name)')

  // Fetch school settings
  const { data: settings } = await supabase
    .from('school_settings')
    .select('hours_per_credit')
    .eq('id', 1)
    .single()

  return (
    <div className="min-h-screen bg-transparent  p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white  p-6 rounded-2xl shadow-sm border border-stone-100  flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-stone-900  tracking-tight">Transcripts</h1>
            <p className="text-stone-500  mt-1">
              Finalize course credits and grades for the official record.
            </p>
          </div>
          <div className="hidden sm:block text-5xl">🎓</div>
        </div>

        <TranscriptClient 
          students={students}
          academicYears={academicYears || []}
          subjects={subjects || []}
          logs={logs || []}
          workSamples={(workSamples as any) || []}
          initialTranscripts={transcripts || []}
          hoursPerCredit={settings?.hours_per_credit || 120}
        />
      </div>
    </div>
  )
}
