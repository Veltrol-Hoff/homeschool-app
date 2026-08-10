'use client'

import { useState } from'react'
import { deleteStudent } from'@/app/dashboard/actions'

export default function DeleteStudentButton({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    setIsDeleting(true)
    setError(null)
    
    const result = await deleteStudent(studentId, password)
    
    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      setIsOpen(false)
      // Form state resets automatically when unmounted
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors p-1"
        title="Delete Student"
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-lg shadow-xl max-w-sm w-full p-6 border border-stone-100">
            <h3 className="text-lg font-bold text-stone-900  mb-2">Delete {studentName}?</h3>
            <p className="text-sm text-stone-600  mb-4">
              This action cannot be undone. All logs and records for this student will be permanently deleted.
            </p>
            
            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Confirm your password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-red-500 focus:ring-red-500    p-2.5 border"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isDeleting || !password}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting ?'Deleting...':'Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
