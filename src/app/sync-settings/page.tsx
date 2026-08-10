import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import SyncSettingsForm from'@/components/SyncSettingsForm'

export default async function SyncSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  
  if (profile?.household_role !=='owner') {
    return (
      <div className="min-h-screen p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p>Only the Owner can manage sync settings.</p>
        <Link href="/dashboard"className="text-slate-600 hover:underline mt-4 inline-block">&larr; Back to Dashboard</Link>
      </div>
    )
  }

  const { data: connection } = await supabase
    .from('google_calendar_connections')
    .select('google_account_email, target_calendar_id, sync_direction')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Sync Settings</h1>
        </div>

        <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6 md:p-8">
          <div className="mb-6 border-b border-stone-100  pb-6">
            <h2 className="text-xl font-bold mb-2">Google Calendar Integration</h2>
            <p className="text-stone-600  text-sm">
              Keep your family schedule organized by automatically syncing planned curriculum lessons, trips, and state filing deadlines to your Google Calendar.
            </p>
          </div>

          <SyncSettingsForm initialConnection={connection} />

          <div className="mt-8 bg-slate-50  p-4 rounded-lg text-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800  mb-2">What is included in the sync?</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-900">
              <li>Planned lessons and assignments (based on curriculum pacing)</li>
              <li>Upcoming field trips and vacations</li>
              <li>PI-1206 Filing Window (September 15 - October 15)</li>
            </ul>
            <p className="mt-3 text-xs italic text-slate-700">
              * Note: This is a one-way sync (App → Google). Changes made directly in Google Calendar will not sync back to the app.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
