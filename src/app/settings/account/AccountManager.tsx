'use client'

import { useState } from'react'
import { createClient } from'@/utils/supabase/client'
import EditPasswordModal from '@/components/EditPasswordModal'
import InviteForm from '@/components/InviteForm'
import { deleteUserAction } from './actions'

export default function AccountManager({ profiles, currentUserId, students }: { profiles: any[], currentUserId: string, students: any[] }) {
  const currentUserProfile = profiles.find(p => p.id === currentUserId)
  const isOwner = currentUserProfile?.household_role === 'owner'
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState('')
  const supabase = createClient()

  const [showInviteForm, setShowInviteForm] = useState(false)

  async function handleUpdateProfile(e: React.FormEvent, id: string) {
    e.preventDefault()
    setStatus('Updating...')
    const form = e.target as HTMLFormElement
    const displayName = (form.elements.namedItem('display_name') as HTMLInputElement).value
    const roleInput = form.elements.namedItem('household_role') as HTMLSelectElement | null
    const newRole = roleInput ? roleInput.value : null
    const linkedStudentInput = form.elements.namedItem('linked_student_id') as HTMLSelectElement | null
    const linkedStudentId = linkedStudentInput ? (linkedStudentInput.value || null) : null

    // Update profile
    const { error } = await supabase.from('profiles').update({ 
      display_name: displayName,
      ...(newRole && { household_role: newRole }),
      ...(linkedStudentInput && { linked_student_id: linkedStudentId })
    }).eq('id', id)
    
    if (error) {
      setStatus('Error updating profile')
      return
    }

    setStatus('Profile updated!')
    setTimeout(() => {
      setStatus('')
      setEditingUserId(null)
      window.location.reload()
    }, 1500)
  }

  async function handleDeleteUser(id: string, name: string) {
    if (!confirm(`Are you sure you want to permanently remove ${name}? This action cannot be undone and will delete all their personal data.`)) {
      return
    }

    try {
      await deleteUserAction(id)
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
      <div className="p-4 border-b border-stone-200  bg-stone-50  flex justify-between items-center">
        <h2 className="font-bold">Household Profiles</h2>
        <button onClick={() => setShowInviteForm(!showInviteForm)} className="px-3 py-1.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800   transition-colors">
          {showInviteForm ? 'Cancel Invite' : '+ Invite Member'}
        </button>
      </div>

      {showInviteForm && (
        <div className="p-4 border-b border-stone-100 bg-stone-50">
          <InviteForm students={students} />
        </div>
      )}

      <div className="divide-y divide-stone-100">
        {profiles?.map(profile => (
          <div key={profile.id} className="p-4">
            {editingUserId === profile.id ? (
              <form onSubmit={(e) => handleUpdateProfile(e, profile.id)} className="space-y-4 max-w-md bg-stone-50  p-4 rounded-lg border border-stone-200">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-500">Display Name</label>
                  <input name="display_name" defaultValue={profile.display_name} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 text-sm" required />
                </div>

                {isOwner && profile.id !== currentUserId && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-stone-500">Account Role</label>
                    <select 
                      name="household_role"
                      defaultValue={profile.household_role}
                      className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 text-sm"
                    >
                      <option value="owner">Owner</option>
                      <option value="co-owner">Co-owner</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                )}

                {profile.household_role === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-stone-500">Linked Student Record</label>
                    <select 
                      name="linked_student_id" 
                      defaultValue={profile.linked_student_id || ""} 
                      className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 text-sm"
                    >
                      <option value="">-- No student linked --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-stone-400 mt-1">Allows this user to log their own activities.</p>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <button type="submit"className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-sm hover:bg-slate-700">Save Changes</button>
                  <button type="button"onClick={() => setEditingUserId(null)} className="px-3 py-1.5 bg-stone-200  rounded-md text-sm">Cancel</button>
                  {status && <span className="text-xs text-slate-600 font-medium ml-2">{status}</span>}
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-900  flex items-center gap-2">
                    {profile.display_name ||'Unnamed'}
                    {profile.id === currentUserId && <span className="text-xs bg-stone-200  px-2 py-0.5 rounded-full text-stone-600">You</span>}
                  </div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded font-medium capitalize ${
                      profile.household_role === 'owner' ? 'bg-purple-100 text-purple-700' :
                      profile.household_role === 'co-owner' ? 'bg-blue-100 text-blue-700' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {profile.household_role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {(isOwner || profile.id === currentUserId) && (
                    <EditPasswordModal userId={profile.id} userEmail={profile.display_name || 'User'} />
                  )}
                  {isOwner && profile.id !== currentUserId && (
                    <button onClick={() => handleDeleteUser(profile.id, profile.display_name || 'User')} className="text-red-600 hover:underline text-sm font-medium">Remove Member</button>
                  )}
                  <button onClick={() => { setEditingUserId(profile.id); setPassword(''); setPasswordConfirm(''); setStatus(''); }} className="text-slate-600 hover:underline text-sm font-medium">Edit Profile</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
