import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import BenchmarkList from'@/components/BenchmarkList'

export default async function BenchmarksPage({ searchParams }: { searchParams: { student?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: students } = await supabase.from('students').select('id, name').order('birth_date', { ascending: false })
  
  if (!students || students.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No students found. Add a student first.</p>
        <Link href="/add-student"className="text-slate-600 hover:underline mt-4 inline-block">Add Student</Link>
      </div>
    )
  }

  const selectedStudentId = searchParams.student || students[0].id
  const selectedStudent = students.find(s => s.id === selectedStudentId)

  // In a real app we'd fetch the academic year to get the grade level.
  // For MVP, we'll fetch from academic_years, or default to a mocked grade if missing.
  const { data: academicYear } = await supabase
    .from('academic_years')
    .select('grade_level')
    .eq('student_id', selectedStudentId)
    .single()

  const gradeLevel = academicYear?.grade_level ||'Kindergarten'

  // Fetch benchmarks for this grade
  const { data: benchmarks } = await supabase
    .from('benchmark_references')
    .select('*')
    .eq('grade_level', gradeLevel)

  // Fetch progress for this student
  const { data: progress } = await supabase
    .from('benchmark_progress')
    .select('*')
    .eq('student_id', selectedStudentId)

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
              &larr; Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Benchmark Parity Check</h1>
          </div>
          
          <select 
            className="rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 border text-sm"
            defaultValue={selectedStudentId}
            // In Next.js App Router, using a client component for select is better, but we can do a simple form or just rely on a client wrapper.
            // For MVP, we can make it a simple form that submits a GET request
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 border-l-4 border-slate-500 p-5 rounded-r shadow-sm">
          <h2 className="font-semibold text-slate-800  mb-1">Informal Comfort-Check</h2>
          <p className="text-sm text-slate-700">
            These benchmarks are provided as a helpful reference for what is typically covered in {gradeLevel}. 
            They are <strong>not legally required</strong> for your homeschool. Use them simply to see how {selectedStudent?.name}'s learning aligns with typical pacing!
          </p>
        </div>

        {(!benchmarks || benchmarks.length === 0) ? (
          <div className="text-center p-8 bg-white  rounded-xl border border-stone-100">
            <p className="text-stone-500">No benchmark data seeded for {gradeLevel} yet.</p>
            <p className="text-sm mt-2">Run the seed script to populate benchmark_references.</p>
          </div>
        ) : (
          <BenchmarkList 
            studentId={selectedStudentId} 
            benchmarks={benchmarks} 
            progress={progress || []} 
          />
        )}

      </div>
    </div>
  )
}
