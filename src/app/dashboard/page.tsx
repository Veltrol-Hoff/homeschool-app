import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import { isPi1206FilingWindow } from'@/utils/date'
import PacingRadar from'@/components/PacingRadar'
import DailyChecklist from'@/components/DailyChecklist'
import StatisticsDashboard from '@/components/StatisticsDashboard'
import CoopTracker from '@/components/CoopTracker'
import WeeklyWins from '@/components/WeeklyWins'

// This would usually be dynamic, but hardcoding for Phase 1 UI structure
const GOAL_HOURS = 875

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch all students (for owner/co-owner, RLS will return all; for student, just themselves)
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .order('birth_date', { ascending: false })

  // Fetch current academic years for these students
  // Fetch current academic years mappings for these students
  const { data: studentAcademicYears } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')

  // Fetch all assignments across all students
  const { data: allAssignments } = await supabase
    .from('student_curricula')
    .select('*, curricula(title, subject_id)')

  // We need to fetch total hours and today's checklist items
  // Since we don't have"checklist items"fully built in MVP (that's Phase 1.5), 
  // we'll mock the checklist counts for now or infer from daily_logs today.
  
  const today = new Date().toISOString().split('T')[0]

  const todayDate = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(todayDate.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  let logs: any[] = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*, subjects(name, color_hex, icon_name), activities(name, color, icon)')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) break
    if (data && data.length > 0) logs = logs.concat(data)
    if (!data || data.length < 1000) break
    page++
  }

  const { data: recentStandards } = await supabase
    .from('curriculum_item_standards')
    .select('created_at')
    .eq('confirmed', true)
    .gte('created_at', sevenDaysAgo.toISOString())

  const { data: settingsData } = await supabase.from('school_settings').select('*').eq('id', 1).single()
  const settings = settingsData || { year_start_month: 7, year_start_day: 1, goal_hours: 875 }
  const GOAL_HOURS = settings.goal_hours

  const { data: tripStudents } = await supabase
    .from('trip_students')
    .select('student_id, trips(start_date, hours_credited)')

  const { data: coopEnrollments } = await supabase
    .from('co_op_enrollments')
    .select('*, co_op_classes(*), co_op_attendance(*)')

  const studentData = await Promise.all((students || []).map(async student => {
    // Find current academic year
    // Find current mapping
    const currentMapping = studentAcademicYears?.find(say => say.student_id === student.id);
    const currentYear = currentMapping?.academic_years;
    const gradeLevel = currentMapping?.grade_level || 'Unknown Grade';
    
    // Find school year start date for this year (Compliance Year Window)
    const now = new Date()
    let startYear = now.getFullYear()
    if (now.getMonth() + 1 < settings.year_start_month || (now.getMonth() + 1 === settings.year_start_month && now.getDate() < settings.year_start_day)) {
      startYear--
    }
    const schoolYearStartDate = new Date(startYear, settings.year_start_month - 1, settings.year_start_day)
    
    const schoolYearEndDate = new Date(startYear + 1, settings.year_start_month - 1, settings.year_start_day)
    schoolYearEndDate.setDate(schoolYearEndDate.getDate() - 1)
    
    // Filter logs for this student completely independent of academic_year_id, just based on the rolling compliance window
    const studentLogs = logs?.filter(log => {
      if (log.student_id !== student.id) return false;
      const logDate = new Date(log.date);
      return logDate >= schoolYearStartDate && logDate <= schoolYearEndDate;
    }) || []
    
    const completedLogs = studentLogs.filter(log => log.log_type === 'Completed')
    const plannedLogs = studentLogs.filter(log => log.log_type === 'Planned')
    
    // Get trips for this student
    const studentTrips = tripStudents?.filter(ts => ts.student_id === student.id).map(ts => ts.trips) || []
    
    // Filter trips that started after the school year start date AND have a subject selected
    const validTrips = (studentTrips as any[]).filter(t => t && new Date(t.start_date) >= schoolYearStartDate && t.subject_id)
    const tripHours = validTrips.reduce((sum, trip) => sum + (trip.hours_credited || 0), 0)
    
    // Calculate total hours (completed)
    const completedMinutes = completedLogs.reduce((sum, log) => sum + log.duration_minutes, 0)
    const totalHours = Math.floor(completedMinutes / 60) + tripHours
    
    // Calculate scheduled hours (planned)
    const scheduledMinutes = plannedLogs.reduce((sum, log) => sum + log.duration_minutes, 0)
    const scheduledHours = Math.floor(scheduledMinutes / 60)
    
    let percentComplete = Math.round((totalHours / GOAL_HOURS) * 100)
    if (isNaN(percentComplete)) percentComplete = 0
    percentComplete = Math.min(percentComplete, 100)
    
    // Mock today's checklist (Phase 1.5 feature)
    const todayLogs = studentLogs.filter(log => log.date === today)
    const completedToday = todayLogs.length
    const totalToday = student.name ==='Milli'? 4 : 3 // Hardcoded to match mockup
    
    // Calculate Pacing
    const elapsedDays = Math.max(1, Math.floor((now.getTime() - schoolYearStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    const expectedHours = Math.floor((GOAL_HOURS / 252) * elapsedDays) // Assuming 252 days in academic year
    
    let hoursStatus:'green'|'yellow'|'red'='green'
    if (totalHours < expectedHours * 0.8) hoursStatus ='red'
    else if (totalHours < expectedHours) hoursStatus ='yellow'
    
    // For mastery pacing check: Look for recent work samples
    let curriculumStatus:'green'|'yellow'|'red'='green'
    let curriculumDetails = `On track with assigned pacing`

    const { data: recentSamples } = await supabase
      .from('work_samples')
      .select('confirmed_score, daily_logs!inner(student_id)')
      .eq('status','confirmed')
      .eq('daily_logs.student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (recentSamples && recentSamples.length > 0) {
      const lowScores = recentSamples.filter(s => s.confirmed_score ==='Not Yet'|| s.confirmed_score ==='Emerging')
      if (lowScores.length >= 2) {
        curriculumStatus ='yellow'
        curriculumDetails = `Needs Review: Multiple recent lower-mastery scores detected.`
      }
    }

    const hoursDetails = `Logged ${totalHours}h / Expected ${expectedHours}h by today`
    
    const studentAssignments = allAssignments?.filter(a => a.student_id === student.id) || []
    const dueItems = todayLogs.filter(log => log.log_type === 'Planned' || log.log_type === 'Completed')
    
    // Sort dueItems by time if available
    dueItems.sort((a, b) => {
      if (a.time_of_day && b.time_of_day) return a.time_of_day.localeCompare(b.time_of_day)
      if (a.time_of_day) return -1
      if (b.time_of_day) return 1
      return 0
    })
    
    const studentCoopEnrollments = coopEnrollments?.filter(e => e.student_id === student.id) || []

    return {
      ...student,
      grade_level: gradeLevel,
      totalHours,
      scheduledHours,
      percentComplete,
      completedToday,
      totalToday,
      hoursStatus,
      curriculumStatus,
      hoursDetails,
      curriculumDetails,
      dueItems,
      studentCoopEnrollments,
      weeklyScheduledMinutes: 0 // We'll compute this next
    }
  })) || []

  // Compute Overload Radar
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  let familyWeeklyMinutes = 0
  
  studentData.forEach(student => {
    // Planned logs next 7 days
    const weeklyLogs = logs?.filter(log => log.student_id === student.id && log.log_type === 'Planned' && log.date >= today && log.date < nextWeekStr) || []
    familyWeeklyMinutes += weeklyLogs.reduce((sum, log) => sum + log.duration_minutes, 0)

    // Weekly Co-op classes
    student.studentCoopEnrollments.forEach((enrollment: any) => {
      familyWeeklyMinutes += enrollment.co_op_classes?.duration_minutes || 60
    })

    // Upcoming Trips
    const upcomingTrips = tripStudents?.filter(ts => ts.student_id === student.id).map(ts => ts.trips).filter((t: any) => t && t.start_date >= today && t.start_date < nextWeekStr) || []
    familyWeeklyMinutes += upcomingTrips.reduce((sum, trip: any) => sum + ((trip.hours_credited || 0) * 60), 0)
  })

  const familyWeeklyHours = Math.floor(familyWeeklyMinutes / 60)
  const isOverloaded = familyWeeklyHours > 35

  // Compute Weekly Wins
  const weeklyWins = {
    completedActivities: 0,
    totalHours: 0,
    standardsMastered: recentStandards?.length || 0
  }

  const pastWeekLogs = logs?.filter(log => log.log_type === 'Completed' && log.date >= sevenDaysAgoStr && log.date <= today) || []
  weeklyWins.completedActivities = pastWeekLogs.length
  weeklyWins.totalHours = Math.floor(pastWeekLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / 60)

  const showBanner = isPi1206FilingWindow()

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {showBanner && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r shadow-sm flex items-start">
            <span className="text-amber-500 mr-3 mt-0.5">⚠️</span>
            <div>
              <p className="font-medium text-amber-800">
                PI-1206 filing window open
              </p>
              <p className="text-sm text-amber-700">
                Due by October 15. Make sure to submit your form to the DPI.
              </p>
            </div>
          </div>
        )}

        {isOverloaded && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start">
            <span className="text-red-500 mr-3 mt-0.5">🚨</span>
            <div>
              <p className="font-medium text-red-800">
                Schedule Overload Warning
              </p>
              <p className="text-sm text-red-700">
                You have {familyWeeklyHours} hours of activities scheduled across all students this week. This exceeds the recommended 35 hours and may lead to burnout. Consider delaying some activities or skipping a co-op class.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <div>
            <h1 className="text-3xl font-bold text-stone-900  tracking-tight">Dashboard</h1>
            <p className="text-stone-500  mt-1 mb-4">Welcome back to the forest!</p>
            <div className="flex flex-wrap gap-3">
              <Link href="?quickAdd=true&tab=Activity"scroll={false} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                ⚡ Quick Log Activity
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="bg-stone-100  px-5 py-3 rounded-2xl rounded-tr-none shadow-sm border border-stone-200  relative">
              <p className="text-base font-medium text-stone-700">Woof! Ready to learn today?</p>
              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-stone-100"></div>
            </div>
            <img src="/mascot.jpg"alt="Bucky the Mascot"className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-white"/>
          </div>
        </div>

        <WeeklyWins {...weeklyWins} />

        {studentData.length === 0 ? (
          <div className="text-center py-12 bg-white  rounded-xl shadow-sm border border-stone-100">
            <p className="text-stone-500  mb-4">No students found.</p>
            <p className="text-sm">Please run the seed script to populate data!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentData.map(student => (
              <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-5 border-b border-stone-100  flex justify-between items-center bg-stone-50/50">
                  <div className="flex items-center gap-4">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-stone-200 shadow-sm"/>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-lg shadow-sm">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <Link href={`/student/${student.id}`} className="hover:underline">
                      <h2 className="font-semibold text-xl text-slate-700">{student.name}</h2>
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm bg-stone-200  px-3 py-1 rounded-full font-medium text-stone-700">
                      {student.grade_level}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 space-y-6">
                  {/* Progress Ring & Stats */}
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20">
                      {/* Background circle */}
                      <svg className="w-full h-full transform -rotate-90"viewBox="0 0 36 36">
                        <circle cx="18"cy="18"r="16"fill="none"className="stroke-stone-100"strokeWidth="3"/>
                        {/* Progress circle */}
                        <circle 
                          cx="18"cy="18"r="16"fill="none"
                          className="stroke-slate-500  transition-all duration-1000 ease-out"
                          strokeWidth="3"
                          strokeDasharray="100"
                          strokeDashoffset={100 - student.percentComplete} 
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-bold text-stone-700">{student.percentComplete}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-stone-500 font-medium">Compliance Hours</p>
                      <p className="text-2xl font-bold text-stone-900">
                        {student.totalHours} <span className="text-base font-normal text-stone-400">/ {GOAL_HOURS} completed</span>
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        + {student.scheduledHours} hours scheduled
                      </p>
                    </div>
                  </div>

                  {student.studentCoopEnrollments.length > 0 && (
                    <CoopTracker enrollments={student.studentCoopEnrollments} />
                  )}

                  {/* Checklist Status & Mini Checklist */}
                  <div className="bg-stone-50  rounded-xl p-4 flex flex-col gap-3 border border-stone-200">
                    <div className="flex items-center gap-3 border-b border-stone-200  pb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${student.completedToday >= student.totalToday ?'bg-slate-100 text-slate-600':'bg-stone-200 text-stone-600'}`}>
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Today: {student.completedToday} of {student.totalToday} done
                        </p>
                      </div>
                    </div>
                    
                    {/* Due Items Preview */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Up Next Today</h4>
                      <DailyChecklist dayLogs={student.dueItems} />
                      
                      <Link href={`/calendar?view=day&date=${today}&student=${student.id}`} className="inline-block mt-2 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100    rounded-lg text-sm font-medium transition-colors">
                        Go to Today &rarr;
                      </Link>
                    </div>
                  </div>

                  <PacingRadar 
                    hoursStatus={student.hoursStatus}
                    curriculumStatus={student.curriculumStatus}
                    hoursDetails={student.hoursDetails}
                    curriculumDetails={student.curriculumDetails}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <StatisticsDashboard logs={logs || []} />
      </div>
    </div>
  )
}
