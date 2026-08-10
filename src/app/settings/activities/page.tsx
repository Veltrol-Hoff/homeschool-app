import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import ActivityForm from'./ActivityForm'
import * as LucideIcons from'lucide-react'

export default async function ActivitiesSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: activities } = await supabase.from('activities').select('*').order('created_at', { ascending: true })

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Manage Activities</h1>
        <p className="text-stone-500">Configure extracurricular activities separate from core academic subjects.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Current Activities</h2>
          <div className="space-y-4">
            {activities?.map(activity => {
              const Icon = (LucideIcons as any)[activity.icon] || LucideIcons.Dumbbell
              return (
                <div key={activity.id} className="bg-white  p-4 rounded-xl shadow-sm border border-stone-100  flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"style={{ backgroundColor: activity.color +'20', color: activity.color }}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-900">{activity.name}</h3>
                    </div>
                  </div>
                  <ActivityForm mode="edit"activity={activity} />
                </div>
              )
            })}
            {(!activities || activities.length === 0) && (
              <div className="p-8 text-center text-stone-500 border-2 border-dashed border-stone-200  rounded-xl">
                No activities created yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <ActivityForm />
        </div>
      </div>
    </div>
  )
}
