'use client'

import { useState } from'react'
import { assignCurriculum } from'@/app/subjects/actions'

export default function AssignCurriculumButton({ 
  studentId, 
  curricula, 
  studentName 
}: { 
  studentId: string, 
  curricula: { id: string, title: string, subjects: any }[],
  studentName: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('student_id', studentId)
    
    try {
      const result = await assignCurriculum(formData)
      if (result.success) {
        setIsOpen(false)
      }
    } catch (err: any) {
      setError(err.message ||"Failed to assign curriculum")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors mt-4 w-full"
      >
        + Assign Curriculum
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-100">
            <h3 className="text-lg font-bold text-stone-900  mb-4">Assign Curriculum to {studentName}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="curriculum_id"className="block text-sm font-medium mb-1">Select Curriculum</label>
                <select 
                  id="curriculum_id"
                  name="curriculum_id"
                  required
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                >
                  <option value="">Choose a curriculum...</option>
                  {curricula.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({Array.isArray(c.subjects) ? c.subjects[0]?.name : c.subjects?.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="start_date"className="block text-sm font-medium mb-1">Start Date (Anchors Pacing)</label>
                <input 
                  type="date"
                  id="start_date"
                  name="start_date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                />
                <p className="text-xs text-stone-500 mt-1">
                  This date is used to calculate what items are due on a given day.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ?'Saving...':'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
