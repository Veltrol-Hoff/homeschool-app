'use client'

import { useState } from'react'
import { updateCurriculum, deleteCurriculum } from'@/app/curriculum/actions'

interface Subject {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
}

interface Curriculum {
  id: string
  title: string
  subject_id: string
  pacing_type: string
  delivery_mode: string
  course_name: string | null
  status: string
  student_curricula?: { student_id: string }[]
}

export default function EditCurriculumModal({
  curriculum,
  subjects,
  students,
  onClose
}: {
  curriculum: Curriculum
  subjects: Subject[]
  students: Student[]
  onClose: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await updateCurriculum(curriculum.id, formData)
      if (result.success) {
        onClose()
      }
    } catch (err: any) {
      setError(err.message ||"Failed to update curriculum")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this curriculum? All items and assignments will be lost. This cannot be undone.')) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await deleteCurriculum(curriculum.id)
      if (result.success) {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete curriculum")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white  rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-100  max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-900">Edit Curriculum</h3>
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
            <label htmlFor="title"className="block text-sm font-medium mb-1">Title</label>
            <input 
              type="text"
              id="title"
              name="title"
              required
              defaultValue={curriculum.title}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
            />
          </div>

          <div>
            <label htmlFor="course_name"className="block text-sm font-medium mb-1">Course Name (Optional Transcript Override)</label>
            <input 
              type="text"
              id="course_name"
              name="course_name"
              defaultValue={curriculum.course_name ||''}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
            />
          </div>



          <div>
            <label htmlFor="subject_id"className="block text-sm font-medium mb-1">Subject</label>
            <select 
              id="subject_id"
              name="subject_id"
              required
              defaultValue={curriculum.subject_id}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
            >
              <option value="">Select subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pacing_type"className="block text-sm font-medium mb-1">Pacing</label>
              <select 
                id="pacing_type"
                name="pacing_type"
                required
                defaultValue={curriculum.pacing_type}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="unit">Unit/Module</option>
                <option value="loop">Loop/Next</option>
              </select>
            </div>

            <div>
              <label htmlFor="delivery_mode"className="block text-sm font-medium mb-1">Format</label>
              <select 
                id="delivery_mode"
                name="delivery_mode"
                required
                defaultValue={curriculum.delivery_mode}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
              >
                <option value="textbook">Textbook</option>
                <option value="online">Online</option>
                <option value="video">Video</option>
                <option value="co-op">Co-op/Class</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
            <select 
              id="status"
              name="status"
              required
              defaultValue={curriculum.status || 'active'}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 p-2.5 border"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-200">
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              Delete Curriculum
            </button>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
