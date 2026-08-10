'use client'

import { useState } from'react'
import { useRouter } from'next/navigation'

export default function InviteForm({ students }: { students: { id: string, name: string }[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState('co-owner')
  
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')
    const linked_student_id = formData.get('linked_student_id')

    try {
      const res = await fetch('/api/invite', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password, role, linked_student_id })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ||'Failed to create member')
      }

      setSuccess(true)
      // @ts-ignore
      e.target.reset()
      setRole('co-owner')
      router.refresh() // Refresh the page to show the new account in the list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6">
      <h2 className="font-bold text-lg mb-4">Create Account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded text-sm border border-green-100">
            Account created successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email"
            name="email"
            required 
            className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password"
            name="password"
            required 
            className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"
            placeholder="Minimum 6 characters"
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select 
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"
          >
            <option value="co-owner">Co-owner</option>
            <option value="student">Student</option>
          </select>
        </div>

        {role ==='student'&& (
          <div>
            <label className="block text-sm font-medium mb-1">Linked Student Record</label>
            <select 
              name="linked_student_id"
              required 
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"
            >
              <option value="">Select student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-stone-500 mt-1">
              Required for student accounts to link them to their existing records.
            </p>
          </div>
        )}

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-600 text-white py-2 rounded-md font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ?'Creating...':'Create Member'}
        </button>
      </form>
    </div>
  )
}
