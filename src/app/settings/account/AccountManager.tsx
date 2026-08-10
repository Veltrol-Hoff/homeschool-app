'use client'

import { useState } from'react'
import { createClient } from'@/utils/supabase/client'
import EditPasswordModal from '@/components/EditPasswordModal'

export default function AccountManager({ profiles, currentUserId }: { profiles: any[], currentUserId: string }) {
  const currentUserProfile = profiles.find(p => p.id === currentUserId)
  const isOwner = currentUserProfile?.household_role === 'owner'
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState('')
  const supabase = createClient()

  async function handleUpdateProfile(e: React.FormEvent, id: string) {
    e.preventDefault()
    setStatus('Updating...')
    const form = e.target as HTMLFormElement
    const displayName = (form.elements.namedItem('display_name') as HTMLInputElement).value

    // Update profile
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', id)
    if (error) {
      setStatus('Error updating profile')
      return
    }

    // If you want users to be able to change their own password, you would do it here. 
    // But we are letting EditPasswordModal handle it for everyone instead to keep it unified, 
    // or just leaving the profile update for display name.

    setStatus('Profile updated!')
    setTimeout(() => {
      setStatus('')
      setEditingUserId(null)
      window.location.reload()
    }, 1500)
  }

  function handleInvite() {
    alert("In this demo version, inviting members via email is simulated.")
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
      <div className="p-4 border-b border-stone-200  bg-stone-50  flex justify-between items-center">
        <h2 className="font-bold">Household Profiles</h2>
        <button onClick={handleInvite} className="px-3 py-1.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800   transition-colors">
          + Invite Member
        </button>
      </div>

      <div className="divide-y divide-stone-100">
        {profiles?.map(profile => (
          <div key={profile.id} className="p-4">
            {editingUserId === profile.id ? (
              <form onSubmit={(e) => handleUpdateProfile(e, profile.id)} className="space-y-4 max-w-md bg-stone-50  p-4 rounded-lg border border-stone-200">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-500">Display Name</label>
                  <input name="display_name"defaultValue={profile.display_name} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 text-sm"required />
                </div>

                {/* Password change is now handled by EditPasswordModal outside this form */}

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
