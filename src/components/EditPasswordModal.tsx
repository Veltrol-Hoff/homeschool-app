'use client'

import { useState } from'react'

export default function EditPasswordModal({ userId, userEmail }: { userId: string, userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/update-password', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ targetUserId: userId, newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ||'Failed to update password')
      }

      setSuccess(true)
      setNewPassword('')
      setTimeout(() => setIsOpen(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs text-stone-500 hover:text-slate-600 transition-colors bg-stone-100  px-2 py-1 rounded"
      >
        Reset Password
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white  p-6 rounded-lg shadow-xl w-full max-w-sm border border-stone-100">
            <h2 className="text-xl font-bold mb-2">Reset Password</h2>
            <p className="text-sm text-stone-500 mb-4">Setting new password for {userEmail}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded text-sm border border-green-100">
                  Password updated successfully!
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  minLength={6}
                  className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 p-2 bg-stone-100  rounded text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting} 
                  className="flex-1 p-2 bg-slate-600 text-white rounded text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ?'Saving...':'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
