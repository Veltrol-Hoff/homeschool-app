import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import TranscriptGenerator from'@/components/TranscriptGenerator'

export default async function TranscriptPage({ params }: { params: Promise<{ student_id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { student_id } = await params

  // 1. Fetch Student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .single()

  if (!student) return <div className="p-8">Student not found.</div>

  // 2. Fetch Academic Years for the student via mapping table
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    .eq('student_id', student_id)
    
  // Flatten to match the old shape expected by TranscriptGenerator
  const academicYears = mappings?.map(m => {
    const ay = m.academic_years as any;
    return {
      id: m.academic_year_id,
      year_label: ay.name,
      grade_level: m.grade_level,
      start_date: ay.start_date,
      end_date: ay.end_date,
      student_id: m.student_id,
      mapping_id: m.id // just in case
    }
  }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) || [];

  // 3. Fetch Transcripts for the student (only ones with a confirmed_date or explicitly mapped)
  // Wait, the prompt says"Only include data from the transcripts table that has a confirmed_date... Ensure courses marked as currently in progress (from the current academic_year) are displayed but denoted as"IP"(In Progress)"
  // So we fetch ALL transcripts, but our TranscriptGenerator logic or query needs to handle it.
  // We'll fetch all and filter client side, or filter here. We'll fetch all.
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*, subjects(name)')
    .eq('student_id', student_id)

  // As per constraints:"Only include data from the transcripts table that has a confirmed_date. Do not include draft grades."
  // Wait, if it has NO confirmed_date, but it is in the CURRENT academic year, it should be IP.
  // Actually, the prompt says:"Ensure courses marked as currently in progress (from the current academic_year) are displayed but denoted as"IP"(In Progress) and excluded from the GPA calculation."
  // Then it says:"Only include data from the transcripts table that has a confirmed_date. Do not include draft grades."
  // This is slightly contradictory, but the intent is likely: include confirmed grades AND currently in-progress courses (where grade_mark ='IP'or similar).
  // We will pass them all and let TranscriptGenerator handle it based on grade_mark ='IP'or confirmed_date.

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/transcripts"className="text-sm text-slate-600 hover:underline">
            &larr; Back to Transcripts
          </Link>
        </div>

        <TranscriptGenerator 
          student={student}
          academicYears={academicYears || []}
          transcripts={transcripts || []}
        />

      </div>
    </div>
  )
}
