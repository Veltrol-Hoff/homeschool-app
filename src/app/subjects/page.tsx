import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import AssignCurriculumButton from'@/components/AssignCurriculumButton'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch students
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('birth_date', { ascending: false })

  // Fetch library of curricula available
  const { data: library } = await supabase
    .from('curricula')
    .select('id, title, subjects(name)')
    .order('title')

  // Fetch current assignments
  const { data: assignments } = await supabase
    .from('student_curricula')
    .select('*, curricula(title, pacing_type, subjects(name))')

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Subjects & Curricula</h1>
        </div>

        {!students || students.length === 0 ? (
          <div className="text-center py-12 bg-white  rounded-xl shadow-sm border border-stone-100">
            <p className="text-stone-500  mb-4">No students found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map(student => {
              const studentAssignments = assignments?.filter(a => a.student_id === student.id) || []
              
              return (
                <div key={student.id} className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-stone-50  bg-stone-50/50">
                    <h2 className="font-semibold text-lg">{student.name}'s Subjects</h2>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    {studentAssignments.length === 0 ? (
                      <div className="text-center py-6 text-stone-500 text-sm italic flex-1">
                        No curriculum assigned yet.
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        {studentAssignments.map(assignment => (
                          <div key={assignment.id} className="border border-stone-200  rounded-lg p-4 bg-stone-50">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold">{assignment.curricula?.title}</h3>
                              <span className="text-xs bg-slate-100 text-slate-700   px-2 py-0.5 rounded">
                                {assignment.curricula?.subjects?.name}
                              </span>
                            </div>
                            <div className="text-sm text-stone-600  space-y-1">
                              <p>Pacing: {assignment.curricula?.pacing_type}</p>
                              <p>Started: {new Date(assignment.start_date).toLocaleDateString()}</p>
                              <p>Currently on Sequence #: {assignment.current_sequence_order}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <AssignCurriculumButton 
                      studentId={student.id} 
                      studentName={student.name}
                      curricula={library || []} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
