import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import ExportOptionsForm from'@/components/ExportOptionsForm'

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ student?: string, year?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: students } = await supabase.from('students').select('*').order('birth_date', { ascending: false })
  
  if (!students || students.length === 0) {
    return <div className="p-8 text-center">No students found.</div>
  }

  const sp = await searchParams
  const selectedStudentId = sp.student || students[0].id
  
  // Fetch academic years via mapping for the selected student
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    .eq('student_id', selectedStudentId)
    
  const years = mappings?.map(m => {
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

  const selectedYearId = sp.year || (years && years.length > 0 ? years[0].id :'')

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <h1 className="text-2xl font-bold mb-6">End-of-Year Export</h1>

        <ExportOptionsForm 
          students={students} 
          years={years || []}
          selectedStudentId={selectedStudentId}
          selectedYearId={selectedYearId}
        />

      </div>
    </div>
  )
}
