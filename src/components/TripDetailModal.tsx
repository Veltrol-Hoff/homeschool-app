'use client'

import { useState, useEffect } from'react'
import { useRouter, useSearchParams, usePathname } from'next/navigation'
import * as LucideIcons from'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { addTripMedia, deleteTrip } from '@/app/calendar/actions'
import MediaUpload from '@/components/MediaUpload'

export default function TripDetailModal({ 
  tripId,
  onClose,
}: { 
  tripId: string
  onClose: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'Details'|'Portfolio'>('Details')
  const [trip, setTrip] = useState<any>(null)
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Media upload state
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaNote, setMediaNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function fetchMedia() {
    const supabase = createClient()
    const { data: mediaData } = await supabase.from('media_attachments')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      
    if (mediaData) {
      setArtifacts(mediaData)
    }
  }

  useEffect(() => {
    async function fetchTrip() {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data: tripData } = await supabase.from('trips')
        .select('*, trip_subjects(subjects(name))')
        .eq('id', tripId)
        .single()
        
      if (tripData) {
        setTrip(tripData)
      }
      
      await fetchMedia()
      
      setIsLoading(false)
    }
    fetchTrip()
  }, [tripId])

  async function handleAddMedia(e: React.FormEvent) {
    e.preventDefault()
    if (!mediaUrl) return
    setIsSubmitting(true)
    try {
      await addTripMedia(tripId, mediaUrl, mediaNote)
      // refresh media
      const supabase = createClient()
      const { data } = await supabase.from('media_attachments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
      if (data) setArtifacts(data)
      setMediaUrl('')
      setMediaNote('')
    } catch (err) {
      alert("Failed to add media")
    }
    setIsSubmitting(false)
  }

  async function handleDeleteTrip() {
    if (!confirm('Are you sure you want to delete this trip?')) return
    try {
      await deleteTrip(tripId)
      onClose()
    } catch (err) {
      alert("Failed to delete trip")
    }
  }

  function handleEditTrip() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('viewTrip') // close this modal
    params.set('editActivity', tripId)
    params.set('tab','Trip')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white  rounded-xl p-8 flex justify-center shadow-2xl">
          <LucideIcons.Loader2 className="animate-spin text-slate-600"size={32} />
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white  rounded-xl p-8 shadow-2xl">
          <p>Trip not found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-stone-200 rounded">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white  rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200  flex justify-between items-center shrink-0"style={{ backgroundColor: (trip.display_color ||'#10B981') +'20'}}>
          <h3 className="font-bold text-xl flex items-center gap-2"style={{ color: trip.display_color ||'#10B981'}}>
            <LucideIcons.Plane size={24} />
            {trip.title}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <LucideIcons.X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-stone-200  shrink-0 bg-stone-50/50">
          {(['Details','Portfolio'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab 
                  ?'border-slate-500 text-slate-600'
                  :'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab ==='Details'? <LucideIcons.FileText size={16} /> : <LucideIcons.Camera size={16} />}
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/30">
          {activeTab ==='Details'&& (
            <div className="space-y-4">
              {trip.trip_subjects && trip.trip_subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Subjects</label>
                  <div className="p-3 bg-white rounded-lg border border-stone-200 font-medium">
                    {trip.trip_subjects.map((ts: any) => ts.subjects.name).join(', ')}
                  </div>
                </div>
              )}
              {trip.location && (
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Location</label>
                  <div className="p-3 bg-white  rounded-lg border border-stone-200  flex items-center gap-2">
                    <LucideIcons.MapPin size={16} className="text-stone-400"/>
                    {trip.location}
                  </div>
                </div>
              )}
              {trip.theme && (
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Theme</label>
                  <div className="p-3 bg-white rounded-lg border border-stone-200">
                    {trip.theme}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Start Date</label>
                  <div className="p-3 bg-white  rounded-lg border border-stone-200">
                    {trip.start_date}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">End Date</label>
                  <div className="p-3 bg-white  rounded-lg border border-stone-200">
                    {trip.end_date}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Hours Credited</label>
                  <div className="p-3 bg-white  rounded-lg border border-stone-200">
                    {trip.hours_credited || 0} hrs
                  </div>
                </div>
              </div>
              
              <div className="pt-6 flex justify-between">
                <button 
                  onClick={handleDeleteTrip}
                  className="px-4 py-2 text-red-600 hover:bg-red-50  rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Trip
                </button>
                <button 
                  onClick={handleEditTrip}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Trip Details
                </button>
              </div>
            </div>
          )}

          {activeTab ==='Portfolio'&& (
            <div className="space-y-6">
              <MediaUpload tripId={tripId} existingMedia={artifacts} onUpdate={fetchMedia} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
