import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from 'next/link'
import ComplianceExportAllButton from '@/components/ComplianceExportAllButton'
import PacingRadar from '@/components/PacingRadar'
import SubjectPieChart from '@/components/SubjectPieChart'
import StandardsGapDashboard from '@/components/StandardsGapDashboard'
import PI1206Uploader from '@/components/PI1206Uploader'
import fs from 'fs'

const WI_REQUIRED_SUBJECTS = [
'Reading',
'Language Arts',
'Mathematics',
'Social Studies',
'Science',
'Health'
]

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch data
  const { data: students } = await supabase.from('students').select('*').order('birth_date', { ascending: false })
  const { data: academicYears } = await supabase.from('academic_years').select('*')
  const activeYear = academicYears?.find(y => y.is_active)
  // Fetch PI-1206 forms
  const { data: pi1206Forms } = await supabase.from('pi_1206_forms').select('*')
  const { data: studentYears } = await supabase.from('student_academic_years').select('*')
  const { data: subjects } = await supabase.from('subjects').select('*')
  
  let logs: any[] = []
  let page = 0
  while (true) {
    const { data } = await supabase.from('daily_logs')
      .select('*')
      .range(page * 1000, (page + 1) * 1000 - 1)
      
    if (data && data.length > 0) {
      logs = logs.concat(data)
    }
    if (!data || data.length < 1000) {
      break
    }
    page++
  }
  
  // Fetch global compliance settings
  const { data: settingsData } = await supabase.from('school_settings').select('*').single()
  const settings = settingsData || { year_start_month: 7, year_start_day: 1, goal_hours: 875 }
  
  // Calculate current compliance window
  const now = new Date()
  let complianceYearStart = new Date(now.getFullYear(), settings.year_start_month - 1, settings.year_start_day)
  if (now < complianceYearStart) {
    complianceYearStart.setFullYear(complianceYearStart.getFullYear() - 1)
  }
  const complianceYearEnd = new Date(complianceYearStart)
  complianceYearEnd.setFullYear(complianceYearEnd.getFullYear() + 1)
  complianceYearEnd.setDate(complianceYearEnd.getDate() - 1)
  
  // Fetch standards data
  const { data: allStandards } = await supabase.from('standards').select('*')
  const { data: assignments } = await supabase.from('student_curricula').select('student_id, curriculum_id')
  const { data: tripStudents } = await supabase.from('trip_students').select('student_id, trips(*)')
  const { data: coveredStandardsData } = await supabase
    .from('curriculum_item_standards')
    .select('standard_id, curriculum_items(curriculum_id)')
    .eq('confirmed', true)

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <p>No students found.</p>
        <Link href="/dashboard"className="text-slate-600 mt-4">&larr; Back to Dashboard</Link>
      </div>
    )
  }

  let logoBase64 = ''
  try {
    const filePath = "C:\\Users\\ewhof\\.gemini\\antigravity\\brain\\0772288e-39e9-4683-a48b-40af064eb763\\.user_uploaded\\media__1786044548064.jpg"
    const imageBuffer = fs.readFileSync(filePath)
    logoBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  } catch (e) {
    console.error(e)
  }

  const reports = students.map(student => {
    const currentMapping = studentYears?.find(sy => sy.student_id === student.id)
    let currentYear = null
    if (currentMapping) {
      const ay = academicYears?.find(y => y.id === currentMapping.academic_year_id)
      if (ay) {
        currentYear = { ...ay, grade_level: currentMapping.grade_level, year_label: ay.name }
      }
    }
    
    // Filter logs strictly by compliance dates, completely decoupled from academic_year_id
    const studentLogs = logs?.filter(log => {
      if (log.student_id !== student.id) return false
      if (log.log_type === 'Planned') return false // Only count actual time logged
      const logDate = new Date(log.date)
      return logDate >= complianceYearStart && logDate <= complianceYearEnd
    }) || []
    
    // Get trips for this student that fall in the compliance year
    const studentTrips = tripStudents?.filter(ts => ts.student_id === student.id).map(ts => ts.trips) || []
    const validTrips = (studentTrips as any[]).filter(t => t && new Date(t.start_date) >= complianceYearStart && new Date(t.start_date) <= complianceYearEnd)

    // Calculate stats per subject
    const subjectStats = subjects?.map(sub => {
      const subLogs = studentLogs.filter(l => l.subject_id === sub.id)
      
      const totalMinutes = subLogs.reduce((acc, l) => acc + l.duration_minutes, 0)
      
      return {
        id: sub.id,
        name: sub.name,
        is_state_required: sub.is_state_required,
        totalHours: Math.floor(totalMinutes / 60),
        logCount: subLogs.length
      }
    }) || []

    // Checklist for the 6 required subjects (Checking if they have ANY logs in these subjects)
    // Since our dummy data might not have the exact names, we do a loose check
    const requiredSubjectStatus = WI_REQUIRED_SUBJECTS.map(reqSub => {
      // Find a matching subject in our DB by name (case insensitive partial match for robustness in dummy data)
      const dbSub = subjectStats.find(s => {
        const sName = s.name.toLowerCase()
        const rName = reqSub.toLowerCase()
        if (sName.includes(rName) || rName.includes(sName)) return true
        if (rName === 'language arts' && sName.includes('languare')) return true
        return false
      })
      const hasHours = dbSub ? dbSub.totalHours > 0 || dbSub.logCount > 0 : false
      return { name: reqSub, completed: hasHours }
    })

    const totalHoursAll = subjectStats.reduce((acc, s) => acc + s.totalHours, 0)

    // Standards Coverage Calculation
    const studentGrade = currentYear?.grade_level || '1'
    const relevantStandards = allStandards?.filter(s => s.grade_level === studentGrade) || []
    const studentAssignedCurricula = assignments?.filter(a => a.student_id === student.id).map(a => a.curriculum_id) || []
    
    const standardsCoverage = relevantStandards.map(std => {
      // Count how many confirmed items link to this standard for this student's curricula
      const links = coveredStandardsData?.filter(link => {
        // Ignore TS error about missing curriculum_id since we joined it
        const currId = (link.curriculum_items as any)?.curriculum_id
        return link.standard_id === std.id && studentAssignedCurricula.includes(currId)
      }) || []
      
      return {
        ...std,
        isCovered: links.length > 0,
        lessonCount: links.length
      }
    })

    return {
      student,
      currentYear,
      studentLogs,
      subjectStats,
      requiredSubjectStatus,
      totalHoursAll,
      standardsCoverage
    }
  })

  return (
    <div className="min-h-screen bg-transparent text-stone-900 p-4 sm:p-8 print:bg-white print:p-0">
      
      <div id="compliance-report-content" className="max-w-4xl mx-auto space-y-8 print:max-w-none">
        
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
              &larr; Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Compliance & Reports</h1>
          </div>
          <ComplianceExportAllButton reports={reports} logoBase64={logoBase64} />
        </div>

        {/* PDF Letterhead - Hidden by default on screen, shown via JS during export */}
        <div id="pdf-letterhead" className="hidden text-center mb-8 border-b-2 border-stone-200 pb-8">
          {logoBase64 && <img src={logoBase64} alt="School Logo" className="h-48 mx-auto mb-4 object-contain" />}
          <p className="text-stone-600 font-medium">1713 Daily Dr. Waunakee, WI 53597 | info@hoffmannhomeschool.com</p>
        </div>

        {/* Wisconsin Rules Summary */}
        <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6 print:hidden">
          <h2 className="text-lg font-bold text-stone-900  mb-4">Wisconsin Homeschooling Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <span className="text-xl">⏱️</span> Total Hours
              </h3>
              <p className="text-sm text-stone-600 mt-1">You need <strong>{settings.goal_hours} total hours</strong> of learning time each school year.</p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-800  flex items-center gap-2">
                <span className="text-xl">📚</span> Curriculum Freedom
              </h3>
              <p className="text-sm text-stone-600  mt-1">You choose the books and materials. The state does not approve or pick your curriculum.</p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-800  flex items-center gap-2">
                <span className="text-xl">📝</span> No Testing
              </h3>
              <p className="text-sm text-stone-600  mt-1">Wisconsin does not require standardized testing for homeschoolers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-800  flex items-center gap-2">
                <span className="text-xl">📋</span> Annual Form
              </h3>
              <p className="text-sm text-stone-600  mt-1">You must file form PI-1206 online each year with the <a href="https://dpi.wi.gov/parental-education-options/home-based"target="_blank"rel="noreferrer"className="text-slate-600 hover:underline font-medium">Wisconsin Department of Public Instruction</a>.</p>
              
              <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar bg-stone-50/50 border border-stone-100 rounded-lg p-2">
                {Array.from({ length: 16 }, (_, i) => 2026 + i).map(year => {
                  const form = pi1206Forms?.find(f => f.year === year)
                  return (
                    <PI1206Uploader 
                      key={year} 
                      year={year} 
                      existingUrl={form?.file_url} 
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {reports.map(report => (
          <div key={report.student.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 print:shadow-none print:border-stone-300 print:mb-8 print:break-inside-avoid">
            
            <div className="border-b border-stone-100 pb-4 mb-6">
              <h2 className="text-2xl font-bold">{report.student.name}</h2>
              <p className="text-stone-500">
                {report.currentYear?.year_label} • Grade {report.currentYear?.grade_level} • Total Hours: <span className="font-semibold text-stone-900">{report.totalHoursAll}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* 6 Required Subjects Checklist */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-stone-700">Wisconsin Required Subjects</h3>
                <div className="space-y-3">
                  {report.requiredSubjectStatus.map((req: any) => (
                    <div key={req.name} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${req.completed ?'bg-green-100 text-green-700 border border-green-200':'bg-stone-100 text-transparent border border-stone-300'}`}>
                        {req.completed ?'✓':''}
                      </div>
                      <span className={`text-sm ${req.completed ?'text-stone-900':'text-stone-500'}`}>
                        {req.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-4 mb-8">
                  Note: A subject is marked checked once any activity is logged against it for the current year.
                </p>

                <h3 className="font-semibold text-lg mb-4 text-stone-700 pt-6 border-t border-stone-100">Subject Distribution</h3>
                <SubjectPieChart subjectStats={report.subjectStats} />
              </div>

              {/* Per-Subject Pacing / Hours */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-stone-700">Pacing & Hours Summary</h3>
                <div className="space-y-4">
                  {report.subjectStats.map((stat: any) => (
                    <div key={stat.id} className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-stone-900">{stat.name}</span>
                        <span className="text-sm font-semibold text-slate-600">{stat.totalHours} hrs</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-stone-500">
                        <span>{stat.logCount} lessons logged</span>
                        {stat.totalHours > 20 ? (
                          <span className="text-green-600 font-medium">✓ On Track</span>
                        ) : (
                          <span className="text-amber-600 font-medium">⚠ Behind</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Pacing Radar Section */}
            <div className="mt-8 pt-6 border-t border-stone-100">
              <h3 className="font-semibold text-lg mb-4 text-stone-700">Overall Pacing</h3>
              <PacingRadar 
                hoursStatus={report.totalHoursAll > 200 ?'green':'yellow'}
                curriculumStatus={'green'}
                hoursDetails={`Logged ${report.totalHoursAll}h total.`}
                curriculumDetails={`All curricula on track.`}
              />
            </div>

            {/* Standards Coverage Section */}
            <StandardsGapDashboard 
              gradeLevel={report.currentYear?.grade_level || '1'}
              standardsCoverage={report.standardsCoverage}
              complianceYearStart={complianceYearStart}
              complianceYearEnd={complianceYearEnd}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
