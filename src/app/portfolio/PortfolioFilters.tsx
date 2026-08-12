'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import * as LucideIcons from 'lucide-react'

export default function PortfolioFilters({
  students,
  academicYears,
  subjects,
  activeTab
}: {
  students: any[]
  academicYears: any[]
  subjects: any[]
  activeTab: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStudent = searchParams.get('student') || 'all'
  const currentYear = searchParams.get('year') || 'all'
  const currentSubject = searchParams.get('subject') || 'all'

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Filter years by selected student if applicable
  const availableYears = currentStudent !== 'all' 
    ? academicYears.filter(ay => ay.student_id === currentStudent)
    : academicYears

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <LucideIcons.User size={14} /> Student
          </label>
          <select
            value={currentStudent}
            onChange={(e) => {
              updateFilters('student', e.target.value)
              // Clear year if switching students since years are per-student
              const params = new URLSearchParams(searchParams.toString())
              params.delete('year')
              if (e.target.value !== 'all') params.set('student', e.target.value)
              else params.delete('student')
              router.push(`${pathname}?${params.toString()}`)
            }}
            className="w-full text-sm p-2 bg-stone-50 border border-stone-200 rounded-lg focus:border-slate-500 focus:ring-slate-500 outline-none transition-shadow"
          >
            <option value="all">All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <LucideIcons.Calendar size={14} /> Academic Year
          </label>
          <select
            value={currentYear}
            onChange={(e) => updateFilters('year', e.target.value)}
            className="w-full text-sm p-2 bg-stone-50 border border-stone-200 rounded-lg focus:border-slate-500 focus:ring-slate-500 outline-none transition-shadow"
          >
            <option value="all">All Years</option>
            {availableYears.map(y => {
              const studentName = students.find(s => s.id === y.student_id)?.name || 'Unknown'
              return (
                <option key={y.id} value={y.id}>
                  {currentStudent === 'all' ? `${studentName} - ${y.year_label}` : y.year_label}
                </option>
              )
            })}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <LucideIcons.BookOpen size={14} /> Subject
          </label>
          <select
            value={currentSubject}
            onChange={(e) => updateFilters('subject', e.target.value)}
            className="w-full text-sm p-2 bg-stone-50 border border-stone-200 rounded-lg focus:border-slate-500 focus:ring-slate-500 outline-none transition-shadow"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  )
}
