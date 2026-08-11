import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import { getSchoolSettings, updateSchoolSettings } from'./actions'
import AccountManager from'./AccountManager'
import AcademicYearManager from './AcademicYearManager'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profiles } = await supabase.from('profiles').select('*').order('household_role', { ascending: false })
  const { data: students } = await supabase.from('students').select('*').order('birth_date', { ascending: false })
  const settings = await getSchoolSettings()
  const { data: academicYears } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false })

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Account Management</h1>
        <p className="text-stone-500">Manage household owners, co-owners, and student logins.</p>
      </div>

      <AccountManager profiles={profiles || []} currentUserId={user.id} students={students || []} />

      <AcademicYearManager academicYears={academicYears || []} />

      <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
        <div className="p-4 border-b border-stone-200  bg-stone-50">
          <h2 className="font-bold">Compliance Settings</h2>
        </div>
        <form action={async (formData) => {
'use server'
          await updateSchoolSettings(formData)
        }} className="p-6 space-y-4 max-w-md">
          <p className="text-sm text-stone-500 mb-4">Set the start date for your academic year and your target compliance hours. These are used to calculate the pacing dials on the dashboard.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Month</label>
              <select 
                name="year_start_month"
                defaultValue={settings.year_start_month}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2.5 border text-sm"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Day</label>
              <input 
                type="number"
                name="year_start_day"
                min="1"max="31"
                defaultValue={settings.year_start_day}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2.5 border text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Goal Hours (Annual)</label>
              <input 
                type="number"
                name="goal_hours"
                min="1"max="2000"
                defaultValue={settings.goal_hours}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2.5 border text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hours per Credit</label>
              <input 
                type="number"
                name="hours_per_credit"
                min="1"max="1000"
                defaultValue={settings.hours_per_credit}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2.5 border text-sm"
              />
            </div>
          </div>

          <button type="submit"className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors">
            Save Settings
          </button>
        </form>
      </div>

      <div className="bg-white  rounded-xl shadow-sm border border-red-200  overflow-hidden">
        <div className="p-4 border-b border-red-100  bg-red-50/50">
          <h2 className="font-bold text-red-700">Danger Zone</h2>
        </div>
        <div className="p-6 space-y-4 max-w-md">
          <p className="text-sm text-stone-500 mb-4">
            Need to restart testing? This will permanently delete <strong>all logged activities, calendar events, and trips</strong> for the entire household. This action cannot be undone.
          </p>
          <form 
            action={async () => {
'use server'
              const { clearTestData } = await import('./actions')
              await clearTestData()
            }}
          >
            <button 
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              formAction={async () => {
'use server'
                const { clearTestData } = await import('./actions')
                await clearTestData()
              }}
            >
              Clear All Test Data
            </button>
          </form>

          <div className="pt-4 border-t border-red-200">
            <p className="text-sm text-stone-500 mb-4">
              Need to clear out media? This will permanently delete <strong>all media attachments and portfolio samples</strong>.
            </p>
            <form 
              action={async () => {
                'use server'
                const { clearPortfolioData } = await import('./actions')
                await clearPortfolioData()
              }}
            >
              <button 
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              >
                Clear All Portfolio & Media Data
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
