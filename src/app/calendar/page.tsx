import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import CalendarView from'@/components/CalendarView'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string, student?: string }> }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: students } = await supabase.from('students').select('*')
  if (!students || students.length === 0) {
    return <div className="p-8">No students found.</div>
  }

  const sp = await searchParams
  // Parse student ids from comma separated string
  const selectedStudentIds = sp.student ? sp.student.split(',') : students.map(s => s.id)
  const view = sp.view ||'month'

  // Fetch logs for these students
  const { data: logs, error: logsError } = await supabase
    .from('daily_logs')
    .select('*, subjects(name, color_hex, icon_name), students!daily_logs_student_id_fkey(display_color), activities(name, color, icon), is_starred')
    .in('student_id', selectedStudentIds)

  // Fetch trips for these students
  const { data: tripStudents } = await supabase
    .from('trip_students')
    .select('trip_id')
    .in('student_id', selectedStudentIds)
  
  const tripIds = Array.from(new Set(tripStudents?.map(ts => ts.trip_id) || []))
  let trips: any[] = []
  if (tripIds.length > 0) {
    const { data: t } = await supabase.from('trips').select('*, subjects(name)').in('id', tripIds)
    trips = t || []
  }

  // To reuse TodayChecklist for day view, we need the"due items"logic.
  const { data: assignments } = await supabase
    .from('student_curricula')
    .select('*, curricula(title, subject_id)')
    .in('student_id', selectedStudentIds)

  // Fetch holidays
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')

  const dueItems = []
  if (assignments && assignments.length > 0) {
    for (const assignment of assignments) {
      const { data: item } = await supabase
        .from('curriculum_items')
        .select('*')
        .eq('curriculum_id', assignment.curriculum_id)
        .eq('sequence_order', assignment.current_sequence_order)
        .single()
        
      if (item) {
        dueItems.push({
          assignment_id: assignment.id,
          student_id: assignment.student_id,
          subject_id: assignment.curricula?.subject_id,
          curriculum_title: assignment.curricula?.title,
          item_title: item.title,
          estimated_minutes: item.estimated_minutes,
          item_type: item.item_type
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {logsError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Database Error:</strong> {logsError.message}
            {logsError.hint && <p className="text-sm mt-1">Hint: {logsError.hint}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
              &larr; Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Calendar</h1>
          </div>

          <div className="flex gap-4 items-center">
            <Link href="/sync-settings"className="text-sm bg-white  border border-stone-300  px-3 py-1.5 rounded-md hover:bg-stone-50  transition-colors">
              ⚙️ Sync Settings
            </Link>
          </div>
        </div>

        <CalendarView 
          view={view}
          students={students}
          selectedStudentIds={selectedStudentIds}
          logs={logs || []}
          trips={trips}
          dueItems={dueItems}
          holidays={holidays || []}
        />

      </div>
    </div>
  )
}
