'use client'

import { useState } from 'react'
import { markCoopAttendance } from '@/app/dashboard/actions'
import * as LucideIcons from 'lucide-react'
import { format } from 'date-fns'

export default function CoopTracker({ 
  enrollments 
}: { 
  enrollments: any[]
}) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const today = format(new Date(), 'yyyy-MM-dd')

  if (!enrollments || enrollments.length === 0) return null

  const handleMarkPresent = async (enrollmentId: string, classId: string, studentId: string, academicYearId: string) => {
    const key = `${enrollmentId}-${today}`
    setLoadingIds(prev => new Set(prev).add(key))
    try {
      await markCoopAttendance(enrollmentId, classId, today, 'Present', studentId, academicYearId)
    } catch (err) {
      alert("Failed to mark attendance")
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <LucideIcons.Users size={18} />
          Weekly Co-op Classes
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {enrollments.map((enrollment, idx) => {
          const cls = enrollment.co_op_classes
          const hasAttendedToday = enrollment.co_op_attendance?.some((a: any) => a.date === today && a.status === 'Present')
          const key = `${enrollment.id}-${today}`
          const isMarking = loadingIds.has(key)

          return (
            <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-stone-50 border border-stone-200 rounded-lg">
              <div>
                <p className="font-semibold text-stone-900">{cls.name}</p>
                <p className="text-xs text-stone-500">{cls.schedule_details} • {cls.instructor_name || 'No instructor listed'}</p>
              </div>
              <div className="mt-3 sm:mt-0 flex gap-2">
                {hasAttendedToday ? (
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-md flex items-center gap-1">
                    <LucideIcons.Check size={16} /> Present Today
                  </span>
                ) : (
                  <button 
                    onClick={() => handleMarkPresent(enrollment.id, cls.id, enrollment.student_id, enrollment.academic_year_id)}
                    disabled={isMarking}
                    className="px-4 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isMarking ? <LucideIcons.Loader2 className="animate-spin" size={16} /> : <LucideIcons.CheckCircle size={16} />}
                    Mark Present
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
