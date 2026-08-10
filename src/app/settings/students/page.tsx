import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import StudentSettingsForm from'./StudentSettingsForm'
import RewardsManager from'./RewardsManager'

export default async function StudentsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Check if owner/co-owner
  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (!profile || (profile.household_role !=='owner'&& profile.household_role !=='co-owner')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500 font-bold">Unauthorized. Only Parents can manage student settings.</p>
      </div>
    )
  }

  const { data: globalAcademicYears } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false })

  const { data: students } = await supabase
    .from('students')
    .select('*, rewards(*), living_bio_entries(*, media_attachments(*)), student_academic_years(*, academic_years(*))')
    .order('birth_date', { ascending: false })

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Student Settings</h1>
        </div>

        {students && students.map((student: any) => (
          <div key={student.id} className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
            <div className="bg-stone-100  p-4 border-b border-stone-200  flex justify-between items-center">
              <h2 className="text-xl font-bold">{student.name}</h2>
              <Link href={`/student/${student.id}`} className="text-sm text-slate-600 hover:underline">
                View Dashboard &rarr;
              </Link>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Profile & Permissions</h3>
                <StudentSettingsForm student={student} globalAcademicYears={globalAcademicYears || []} />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Rewards</h3>
                <RewardsManager studentId={student.id} rewards={student.rewards} currentPoints={student.reward_points} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
