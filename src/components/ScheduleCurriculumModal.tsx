'use client'

import { useState } from 'react'
import { scheduleCurriculum } from '@/app/curriculum/actions'

export default function ScheduleCurriculumModal({
  curriculumId,
  students,
  onClose
}: {
  curriculumId: string
  students: any[]
  onClose: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>(students.length > 0 ? [students[0].id] : [])
  
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default

  function toggleDay(day: number) {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day))
    } else {
      setDaysOfWeek([...daysOfWeek, day])
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedStudents.length === 0) {
      setError("Please select at least one student.")
      return
    }
    if (daysOfWeek.length === 0) {
      setError("Please select at least one day of the week.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    selectedStudents.forEach(id => formData.append('student_id', id))
    daysOfWeek.forEach(d => formData.append('days_of_week', d.toString()))
    
    try {
      const result = await scheduleCurriculum(curriculumId, formData)
      if (result.success) {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || "Failed to schedule curriculum")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-900">Schedule on Calendar</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Students</label>
            {students.length === 0 ? (
              <p className="text-sm text-stone-500">
                You must assign this curriculum to a student first (use the Edit button on the library page).
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto border border-stone-200 rounded-md p-3">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, s.id])
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== s.id))
                        }
                      }}
                      className="rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium mb-1">Start Date</label>
            <input 
              type="date" 
              id="start_date" 
              name="start_date" 
              required
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 p-2.5 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Days of the Week</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Sun', value: 0 },
                { label: 'Mon', value: 1 },
                { label: 'Tue', value: 2 },
                { label: 'Wed', value: 3 },
                { label: 'Thu', value: 4 },
                { label: 'Fri', value: 5 },
                { label: 'Sat', value: 6 }
              ].map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    daysOfWeek.includes(day.value)
                      ? 'bg-slate-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-2">
              The scheduler will automatically skip unselected days and defined holidays.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || students.length === 0}
              className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
