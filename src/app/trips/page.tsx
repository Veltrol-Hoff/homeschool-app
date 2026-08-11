import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { format } from 'date-fns'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      location,
      theme,
      start_date,
      end_date,
      hours_credited,
      display_color,
      trip_students (
        students (name)
      ),
      media_attachments (
        file_url
      )
    `)
    .order('start_date', { ascending: false })

  if (error) {
    console.error("Error fetching trips:", error)
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      
      <div className="flex justify-between items-center">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:underline mb-2 inline-block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <LucideIcons.Map className="text-emerald-500 w-8 h-8" />
            Trips & Vacations
          </h1>
          <p className="text-stone-500 mt-2">A record of all your out-of-home learning experiences.</p>
        </div>
        <Link href="/calendar?quickAdd=true&tab=Trip" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <LucideIcons.Plus size={18} />
          Log Trip
        </Link>
      </div>

      {!trips || trips.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
          <LucideIcons.MapPin size={48} className="mx-auto text-stone-300 mb-4" />
          <h3 className="text-xl font-bold text-stone-700 mb-2">No trips logged yet</h3>
          <p className="text-stone-500 max-w-md mx-auto">
            Log your field trips, museum visits, and educational vacations here to earn hours!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip: any) => {
            const hasMedia = trip.media_attachments && trip.media_attachments.length > 0
            const firstImage = hasMedia ? trip.media_attachments.find((m: any) => m.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i))?.file_url : null
            
            return (
              <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col sm:flex-row group hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="w-full sm:w-48 h-48 sm:h-auto bg-stone-100 flex-shrink-0 relative">
                  {firstImage ? (
                    <img src={firstImage} alt={trip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <LucideIcons.Image size={40} />
                    </div>
                  )}
                  {hasMedia && trip.media_attachments.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                      <LucideIcons.Image size={12} />
                      {trip.media_attachments.length}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl text-stone-900" style={{ color: trip.display_color }}>{trip.title}</h3>
                      <Link href={`/calendar?viewTrip=${trip.id}`} className="text-slate-500 hover:text-slate-700 p-1">
                        <LucideIcons.Edit2 size={16} />
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 mb-4">
                      <div className="flex items-center gap-1.5 font-medium text-stone-800">
                        <LucideIcons.Calendar size={14} className="text-stone-400" />
                        {format(new Date(trip.start_date), 'MMM d, yyyy')} 
                        {trip.start_date !== trip.end_date && ` - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
                      </div>
                      {trip.location && (
                        <div className="flex items-center gap-1.5">
                          <LucideIcons.MapPin size={14} className="text-stone-400" />
                          {trip.location}
                        </div>
                      )}
                      {trip.theme && (
                        <div className="flex items-center gap-1.5">
                          <LucideIcons.Tag size={14} className="text-stone-400" />
                          {trip.theme}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex gap-2">
                      {trip.trip_students?.map((ts: any, i: number) => (
                        <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md font-medium">
                          {ts.students?.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">Hours Credited</span>
                      <span className="text-lg font-black text-stone-800">{trip.hours_credited || 0} hrs</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
