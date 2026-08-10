import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import RewardBadge from'./RewardBadge'
import { Trophy, Star, Target, ShieldCheck, Clock, CheckCircle } from'lucide-react'
import { format } from'date-fns'

export default async function StudentDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Check access: must be owner/co-owner, OR the student themselves
  const { data: profile } = await supabase.from('profiles').select('household_role, linked_student_id').eq('id', user.id).single()
  if (!profile) return redirect('/login')
  
  const { id } = await params;

  if (profile.household_role === 'student' && profile.linked_student_id !== id) {
    return <div className="p-8 text-red-500 font-bold">Unauthorized. You can only view your own dashboard.</div>
  }
  
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*, rewards(*)')
    .eq('id', id)
    .single()

  if (studentError) {
    console.error("Error fetching student:", studentError);
  }

  if (!student) return <div className="p-8">Student not found. (Error: {studentError?.message ||'None'})</div>

  const { data: currentMapping } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    .eq('student_id', id)
    .limit(1)
    .single()
  
  const currentYear = currentMapping?.academic_years;
  const gradeLevel = currentMapping?.grade_level;

  // Fetch school settings
  const { data: settingsData } = await supabase.from('school_settings').select('*').eq('id', 1).single()
  const settings = settingsData || { year_start_month: 7, year_start_day: 1, goal_hours: 875 }
  const GOAL_HOURS = settings.goal_hours
  
  // Calculate school year start date
  const now = new Date()
  let startYear = now.getFullYear()
  if (now.getMonth() + 1 < settings.year_start_month || (now.getMonth() + 1 === settings.year_start_month && now.getDate() < settings.year_start_day)) {
    startYear--
  }
  const schoolYearStartDate = new Date(startYear, settings.year_start_month - 1, settings.year_start_day)

  // Fetch trips for this student
  const { data: tripStudents } = await supabase
    .from('trip_students')
    .select('trips(start_date, hours_credited)')
    .eq('student_id', id)
    
  const validTrips = (tripStudents || []).map(ts => ts.trips as any).filter(t => t && new Date(t.start_date as string) >= schoolYearStartDate)
  const tripHours = validTrips.reduce((sum, trip) => sum + (trip.hours_credited || 0), 0)

  // Fetch logs for hours calculation
  let totalHours = tripHours
  let totalMinutes = 0
  if (currentYear) {
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('duration_minutes, log_type')
      .eq('student_id', id)
      .eq('academic_year_id', currentYear.id)
      
    if (logs) {
      const completedLogs = logs.filter(log => log.log_type ==='Completed')
      totalMinutes = completedLogs.reduce((sum, log) => sum + log.duration_minutes, 0)
      totalHours = Math.floor(totalMinutes / 60) + tripHours
    }
  }
  let percentComplete = Math.round((totalHours / GOAL_HOURS) * 100)
  if (isNaN(percentComplete)) percentComplete = 0
  percentComplete = Math.min(percentComplete, 100)

  // Fetch recent work samples (Grades)
  const { data: recentSamples } = await supabase
    .from('work_samples')
    .select('id, title, confirmed_score, created_at, subjects(name)')
    .eq('status','confirmed')
    .order('created_at', { ascending: false })
    .limit(5)

  // Wait, work_samples are linked to daily_logs, not directly to students. We need an inner join.
  const { data: recentGrades } = await supabase
    .from('work_samples')
    .select('id, title, confirmed_score, created_at, subjects(name), daily_logs!inner(student_id)')
    .eq('status','confirmed')
    .eq('daily_logs.student_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Sort rewards: locked first, ordered by points required
  const sortedRewards = [...(student.rewards || [])].sort((a, b) => {
    if (a.is_unlocked === b.is_unlocked) return a.points_required - b.points_required
    return a.is_unlocked ? 1 : -1
  })

  // Find next goal
  const nextReward = sortedRewards.find(r => !r.is_unlocked)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header / Bio */}
      <div className="bg-white  rounded-2xl shadow-sm border border-stone-100  p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy size={120} className="text-stone-900"/>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-stone-900  mb-2 flex items-center gap-3">
              Welcome, {student.name}!
              {gradeLevel && (
                <span className="text-lg font-semibold bg-slate-100 text-slate-800   px-3 py-1 rounded-full">
                  {gradeLevel}
                </span>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white/80  p-4 rounded-3xl shadow-sm border border-stone-100  backdrop-blur-sm">
            <div className="bg-stone-100  px-4 py-3 rounded-2xl rounded-tr-none shadow-sm relative">
              <p className="text-base font-medium text-stone-700">Woof! You're doing great, {student.name}! Let's learn something new today!</p>
              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-stone-100"></div>
            </div>
            <img src="/mascot.jpg"alt="Bucky the Mascot"className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-white"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Rewards Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white  rounded-2xl shadow-sm border border-stone-100  p-8">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-stone-900  flex items-center gap-2">
                <Star className="text-slate-500 fill-slate-500"/>
                My Rewards
              </h2>
              <div className="bg-slate-50  border border-slate-200  text-slate-800  px-4 py-2 rounded-lg font-bold text-lg">
                {student.reward_points} Points
              </div>
            </div>

            {nextReward && (
              <div className="mb-8 bg-stone-50  p-6 rounded-xl border border-stone-200">
                <p className="font-bold text-stone-700  mb-2">Next Goal: {nextReward.title}</p>
                <div className="h-4 w-full bg-stone-200  rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (student.reward_points / nextReward.points_required) * 100)}%` }}
                  />
                </div>
                <p className="text-right text-sm text-stone-500  mt-2 font-medium">
                  {student.reward_points} / {nextReward.points_required}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedRewards.map(reward => (
                <RewardBadge key={reward.id} reward={reward} studentId={student.id} currentPoints={student.reward_points} />
              ))}
            </div>
          </div>
        </div>

        {/* Conditional Stats Column */}
        <div className="space-y-6">
          <div className="bg-white  rounded-2xl shadow-sm border border-stone-100  p-6">
            <h2 className="text-xl font-bold text-stone-900  flex items-center gap-2 mb-4">
              <ShieldCheck className="text-slate-500"/>
              My Stats
            </h2>
            
            <div className="space-y-6">
              
              {/* Hours Widget */}
              {student.can_view_compliance ? (
                <div className="bg-stone-50  border border-stone-200  p-5 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-stone-900  flex items-center gap-1.5"><Clock size={18} className="text-stone-500"/> Logged Hours</p>
                    <p className="text-sm font-bold text-stone-700">{totalHours} <span className="text-stone-500  font-normal">/ {GOAL_HOURS}h</span></p>
                  </div>
                  <div className="h-3 w-full bg-stone-200  rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-slate-500 transition-all duration-1000"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-stone-500 font-medium">{percentComplete}% of Year Goal</p>
                </div>
              ) : (
                <div className="bg-stone-50  border border-stone-200  p-4 rounded-xl opacity-60">
                  <p className="font-bold text-stone-500  flex items-center gap-2"><Clock size={18} /> Hours Hidden</p>
                </div>
              )}

              {/* Grades / Recent Work Widget */}
              {student.can_view_grades ? (
                <div className="bg-stone-50  border border-stone-200  p-5 rounded-xl">
                  <p className="font-bold text-stone-900  flex items-center gap-1.5 mb-4"><CheckCircle size={18} className="text-stone-500"/> Recent Feedback</p>
                  {(!recentGrades || recentGrades.length === 0) ? (
                    <p className="text-sm text-stone-500  italic">No recent graded work.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentGrades.map((grade: any) => (
                        <div key={grade.id} className="flex justify-between items-center bg-white  p-3 rounded-xl shadow-sm border border-stone-100">
                          <div>
                            <p className="text-xs font-bold text-stone-500  uppercase tracking-wider">{grade.subjects?.name ||'General'}</p>
                            <p className="text-sm font-semibold text-stone-900  line-clamp-1">{grade.title ||'Work Sample'}</p>
                          </div>
                          <div className="ml-2 bg-stone-100  text-stone-800  font-bold px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                            {grade.confirmed_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-stone-50  border border-stone-200  p-4 rounded-xl opacity-60">
                  <p className="font-bold text-stone-500  flex items-center gap-2"><CheckCircle size={18} /> Grades Hidden</p>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
