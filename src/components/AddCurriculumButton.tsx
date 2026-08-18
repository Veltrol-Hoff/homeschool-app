'use client'

import { useState } from'react'
import { addCurriculum } from'@/app/curriculum/actions'

export default function AddCurriculumButton({ subjects, students }: { subjects: { id: string, name: string }[], students: { id: string, name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await addCurriculum(formData)
      if (result.success) {
        setIsOpen(false)
      }
    } catch (err: any) {
      setError(err.message ||"Failed to add curriculum")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors"
      >
        + Add Curriculum
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-100">
            <h3 className="text-lg font-bold text-stone-900  mb-4">Add Curriculum</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="title"className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text"
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. BookShark Level A"
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                />
              </div>

              <div>
                <label htmlFor="course_name"className="block text-sm font-medium mb-1">Course Name (Optional Transcript Override)</label>
                <input 
                  type="text"
                  id="course_name"
                  name="course_name"
                  placeholder="e.g. Biology 101"
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                />
              </div>



              <div>
                <label htmlFor="subject_id"className="block text-sm font-medium mb-1">Subject</label>
                <select 
                  id="subject_id"
                  name="subject_id"
                  required
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pacing_type"className="block text-sm font-medium mb-1">Pacing Type</label>
                <select 
                  id="pacing_type"
                  name="pacing_type"
                  required
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                >
                  <option value="calendar">Calendar-paced (e.g. daily/weekly schedule)</option>
                  <option value="mastery">Mastery-paced (move on when ready)</option>
                </select>
              </div>

              <div>
                <label htmlFor="delivery_mode"className="block text-sm font-medium mb-1">Delivery Mode</label>
                <select 
                  id="delivery_mode"
                  name="delivery_mode"
                  required
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
                >
                  <option value="physical">Physical (Books/Worksheets)</option>
                  <option value="online">Online (Videos/Modules)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
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
                  {isSubmitting ?'Saving...':'Save Curriculum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
