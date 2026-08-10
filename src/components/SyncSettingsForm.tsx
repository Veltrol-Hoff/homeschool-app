'use client'

import { useState } from'react'

export default function SyncSettingsForm({ initialConnection }: { initialConnection: any }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type:'success'|'error', text: string } | null>(null)

  async function handleManualSync() {
    setIsSyncing(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/sync', { method:'POST'})
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ||'Sync failed')
      
      setSyncMessage({ type:'success', text: `Sync complete! Added/Updated ${data.syncedCount || 0} events.` })
    } catch (err: any) {
      setSyncMessage({ type:'error', text: err.message })
    } finally {
      setIsSyncing(false)
    }
  }

  if (!initialConnection) {
    return (
      <div className="text-center py-8 bg-stone-50  rounded-lg border border-stone-200">
        <div className="text-4xl mb-3">📅</div>
        <h3 className="font-medium text-lg mb-2">Not Connected</h3>
        <p className="text-sm text-stone-500  mb-6 max-w-sm mx-auto">
          Connect your Google account to enable calendar syncing. You'll be asked to grant access to manage your calendar.
        </p>
        <a 
          href="/api/auth/google"
          className="inline-flex items-center gap-2 bg-white text-stone-800 border border-stone-300 font-medium px-4 py-2 rounded shadow-sm hover:bg-stone-50 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"alt="Google"className="w-5 h-5"/>
          Connect Google Calendar
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {syncMessage && (
        <div className={`p-4 rounded-md text-sm border ${syncMessage.type ==='success'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
          {syncMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">Connected Account</label>
          <div className="bg-stone-50  border border-stone-200  rounded-md p-3 flex justify-between items-center">
            <span className="font-medium">{initialConnection.google_account_email}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Connected</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">Target Calendar ID</label>
          {/* Real implementation might fetch the user's calendars to populate a dropdown, but'primary'is usually sufficient */}
          <input 
            type="text"
            disabled 
            value={initialConnection.target_calendar_id} 
            className="w-full bg-stone-50  border-stone-200  rounded-md p-3 text-stone-500 cursor-not-allowed"
          />
          <p className="text-xs text-stone-500 mt-1">Currently hardcoded to primary calendar for MVP.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700">Sync Direction</label>
          <input 
            type="text"
            disabled 
            value="One-way (App to Google)"
            className="w-full bg-stone-50  border-stone-200  rounded-md p-3 text-stone-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="pt-4 flex gap-4 border-t border-stone-100">
        <button 
          onClick={handleManualSync}
          disabled={isSyncing}
          className="bg-slate-600 text-white px-4 py-2 rounded-md font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {isSyncing ?'Syncing...':'Sync Now'}
        </button>
        
        <a 
          href="/api/auth/google"
          className="text-stone-600  hover:text-stone-900  px-4 py-2 rounded-md font-medium transition-colors"
        >
          Reconnect
        </a>
      </div>
    </div>
  )
}
