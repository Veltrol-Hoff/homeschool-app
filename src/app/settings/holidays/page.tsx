import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HolidaysForm from './HolidaysForm'

export default async function HolidaysSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: academicYears } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false })

  const { data: holidays } = await supabase
    .from('holidays')
    .select('*, academic_years(name)')
    .order('date', { ascending: true })

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-slate-600 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Holiday Settings</h1>
      </div>

      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-stone-600">
        <p>
          Holidays defined here will be automatically skipped by the curriculum scheduling engine. 
          When you tell a curriculum to schedule itself starting on a specific date, it will leap over these dates.
        </p>
      </div>

      <HolidaysForm 
        academicYears={academicYears || []} 
        holidays={holidays || []} 
      />
    </div>
  )
}
