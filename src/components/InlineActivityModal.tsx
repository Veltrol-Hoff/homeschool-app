'use client'

import { useState } from'react'
import { useRouter } from'next/navigation'
import * as LucideIcons from'lucide-react'
import { createActivity, updateActivity, deleteActivity, createTrip } from'@/app/calendar/actions'
import { createClient } from'@/utils/supabase/client'
import { useEffect } from'react'

export default function InlineActivityModal({ 
  isOpen, 
  onClose, 
  defaultDate,
  students,
  subjects,
  activities,
  initialTab ='Activity',
  editId
}: { 
  isOpen: boolean
  onClose: () => void
  defaultDate: string
  students: any[]
  subjects: any[]
  activities: any[]
  initialTab?:'Course'|'Activity'|'Trip'
  editId?: string | null
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'Course'|'Activity'|'Trip'>(initialTab as'Course'|'Activity'|'Trip')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedStudents, setSelectedStudents] = useState<string[]>(students.map(s => s.id))
  const [recurringRule, setRecurringRule] = useState('none')
  const [recurringCount, setRecurringCount] = useState(36)
  
  // Edit state
  const [existingData, setExistingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (editId) {
      setIsLoading(true)
      const fetchData = async () => {
        const supabase = createClient()
        if (initialTab ==='Trip') {
          const { data, error } = await supabase.from('trips').select('*').eq('id', editId).single()
          if (data) {
            setExistingData(data)
            setActiveTab('Trip')
            const { data: tsData } = await supabase.from('trip_students').select('student_id').eq('trip_id', editId)
            if (tsData) setSelectedStudents(tsData.map((ts: any) => ts.student_id))
          }
        } else {
          const { data, error } = await supabase.from('daily_logs').select('*').eq('id', editId).single()
          if (data) {
            setExistingData(data)
            setActiveTab(data.subject_id ?'Course': (data.activity_id ?'Activity':'Trip'))
          }
        }
        setIsLoading(false)
      }
      fetchData()
    } else {
      setIsLoading(false)
      setExistingData(null)
    }
  }, [editId, initialTab])

  if (!isOpen) return null

  function toggleStudent(id: string) {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(s => s !== id))
    } else {
      setSelectedStudents([...selectedStudents, id])
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      const title = formData.get('title') as string

      if (activeTab ==='Trip') {
        const location = formData.get('location') as string
        const start_date = formData.get('start_date') as string
        const end_date = formData.get('end_date') as string
        const display_color = formData.get('display_color') as string
        const hours_credited = parseInt(formData.get('hours_credited') as string) || 0
        const subject_ids = formData.getAll('subject_ids') as string[]
        const theme = formData.get('theme') as string
        
        if (editId) {
          const { updateTrip } = await import('@/app/calendar/actions')
          await updateTrip(editId, { title, location, start_date, end_date, hours_credited, display_color, subject_ids, theme, students: selectedStudents })
        } else {
          await createTrip({ title, location, start_date, end_date, hours_credited, display_color, subject_ids, theme, students: selectedStudents })
        }
      } else {
        const date = formData.get('date') as string
        const time = formData.get('time') as string
        const notes = formData.get('notes') as string
        const subject_id = formData.get('subject_id') as string
        const activity_id = formData.get('activity_id') as string
        const duration_minutes = parseInt(formData.get('duration_minutes') as string) || 30
        
        let file_url = existingData?.file_url
        if (file) {
          setUploading(true)
          const supabase = createClient()
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${fileName}`
          const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file)
          if (uploadError) throw new Error(uploadError.message)
          const { data } = supabase.storage.from('media').getPublicUrl(filePath)
          file_url = data.publicUrl
          setUploading(false)
        }
        
        if (editId) {
          const updateFuture = formData.get('update_future') === 'on'
          if (updateFuture && existingData?.recurring_group_id) {
            const { updateRecurringActivity } = await import('@/app/calendar/actions')
            await updateRecurringActivity(existingData.recurring_group_id, existingData.date, { type: activeTab, subject_id, activity_id, notes, date, time, duration_minutes, file_url, students: selectedStudents })
          } else {
            await updateActivity(editId, { type: activeTab, subject_id, activity_id, notes, date, time, duration_minutes, file_url, students: selectedStudents })
          }
        } else {
          await createActivity({ type: activeTab, subject_id, activity_id, notes, date, time, duration_minutes, file_url, students: selectedStudents, recurringRule, recurringCount })
        }
      }
      
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editId) return
    if (!confirm(`Are you sure you want to delete this ${initialTab ==='Trip'?'trip':'activity'}?`)) return
    
    setIsSubmitting(true)
    try {
      if (initialTab ==='Trip') {
        const { deleteTrip } = await import('@/app/calendar/actions')
        await deleteTrip(editId)
      } else {
        await deleteActivity(editId)
      }
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white  rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-stone-200  bg-stone-50  flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {editId ? <LucideIcons.Edit size={20} className="text-slate-600"/> : <LucideIcons.PlusCircle size={20} className="text-slate-600"/>}
            {editId ? `Edit ${activeTab}` :'Quick Add'}
          </h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-700">
            <LucideIcons.X size={20} />
          </button>
        </div>
        
        {/* Tabs - Only show when adding new, not editing */}
        {!editId && (
          <div className="flex border-b border-stone-200  shrink-0 bg-stone-50/50">
            {(['Course','Activity','Trip'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={!!editId}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === tab 
                    ?'border-slate-500 text-slate-600'
                    :'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab ==='Course'&&'📚 Course'}
                {tab ==='Activity'&&'⚽ Activity'}
                {tab ==='Trip'&&'✈️ Trip'}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LucideIcons.Loader2 className="animate-spin text-slate-600"size={32} />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50   p-3 rounded-md border border-red-100">
                  {error}
                </div>
              )}
          
          <form key={existingData?.id ||'new-form'} onSubmit={handleSubmit} className="space-y-4">
            
            {/* Select Subject */}
            {activeTab === 'Trip' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Subjects (Optional, select multiple)</label>
                <select name="subject_ids" multiple defaultValue={existingData?.trip_subjects?.map((ts:any) => ts.subject_id) || []} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 text-sm min-h-[80px]">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Subject {activeTab !=='Course'&&'(Optional)'}</label>
                <select name="subject_id"defaultValue={existingData?.subject_id ||""} required={activeTab ==='Course'} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm">
                  <option value="">Select a Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            
            {activeTab ==='Activity'&& (
              <div>
                <label className="block text-sm font-medium mb-1">Activity</label>
                <select name="activity_id"defaultValue={existingData?.activity_id ||""} required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm">
                  <option value="">Select an Activity...</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {/* Common: Notes / Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {activeTab ==='Trip'?'Trip Title':'Notes (Optional)'}
              </label>
              <input 
                type="text"
                name={activeTab ==='Trip'?'title':'notes'} 
                placeholder={activeTab ==='Trip'?"e.g. Hawaii Vacation":"e.g. Swim Practice or Lesson 4"} 
                required={activeTab ==='Trip'} 
                defaultValue={existingData?.notes || existingData?.title ||''}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"
              />
            </div>

            {/* Students Multi-Select (Tasks & Activities) */}
            <div>
              <label className="block text-sm font-medium mb-2">Assign to Students</label>
              <div className="space-y-2">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2 rounded border border-stone-200  cursor-pointer hover:bg-stone-50">
                    <input 
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                    />
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full"style={{ backgroundColor: s.display_color ||'#10B981'}}></span>
                      {s.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dates / Times */}
            {activeTab ==='Trip'? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input type="text"name="location"defaultValue={existingData?.location ||''} placeholder="e.g. Science Museum"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Theme (Optional)</label>
                    <input type="text"name="theme"defaultValue={existingData?.theme ||''} placeholder="e.g. Space Exploration"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input type="date"name="start_date"required defaultValue={existingData?.start_date || defaultDate} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input type="date"name="end_date"required defaultValue={existingData?.end_date || defaultDate} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Hours Credited</label>
                    <input type="number"name="hours_credited"min="0"step="1"defaultValue={existingData?.hours_credited || 0} placeholder="e.g. 5"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Color</label>
                    <input type="color"name="display_color"defaultValue={existingData?.display_color ||'#3B82F6'} className="h-10 w-16 p-1 rounded cursor-pointer border border-stone-300  bg-white"/>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input type="date"name="date"required defaultValue={existingData?.date || defaultDate} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time (Optional)</label>
                    <input type="time"name="time"defaultValue={existingData?.time_of_day ||""} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"/>
                  </div>
                </div>
                {editId && existingData?.recurring_group_id && (
                  <div className="flex items-center gap-2 mt-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                    <input 
                      type="checkbox" 
                      id="update_future" 
                      name="update_future" 
                      className="rounded border-stone-300 text-slate-600 focus:ring-slate-500 cursor-pointer" 
                    />
                    <label htmlFor="update_future" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Update this and all future uncompleted occurrences
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <select name="duration_minutes"defaultValue={existingData?.duration_minutes || 30} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm">
                      <option value="15">15 mins</option>
                      <option value="30">30 mins</option>
                      <option value="45">45 mins</option>
                      <option value="60">1 hr</option>
                      <option value="75">1 hr 15 mins</option>
                      <option value="90">1 hr 30 mins</option>
                      <option value="120">2 hrs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Attach File</label>
                    <input 
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100    cursor-pointer p-1 border border-stone-300  rounded-md bg-white"
                    />
                    {existingData?.file_url && !file && (
                      <a href={existingData.file_url} target="_blank"rel="noopener noreferrer"className="text-xs text-slate-600 hover:underline flex items-center gap-1 mt-1">
                        <LucideIcons.Paperclip size={12} /> Current file
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Recurring Rule (Course & Activity) */}
            {activeTab !=='Trip'&& !editId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <LucideIcons.Repeat size={14} /> Repeat
                  </label>
                  <select 
                    value={recurringRule}
                    onChange={(e) => setRecurringRule(e.target.value)}
                    className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                {recurringRule !=='none'&& (
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <LucideIcons.Hash size={14} /> Occurrences
                    </label>
                    <input 
                      type="number"
                      value={recurringCount}
                      onChange={(e) => setRecurringCount(parseInt(e.target.value) || 1)}
                      min="1"
                      max="365"
                      className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pt-6 flex gap-3">
              {editId && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-shrink-0 px-4 py-2 bg-red-100 hover:bg-red-200   text-red-600  rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  <LucideIcons.Trash2 size={20} />
                </button>
              )}
              <button type="button"onClick={onClose} className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200   text-stone-700  rounded-md font-medium transition-colors">
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || uploading || (activeTab !=='Trip'&& selectedStudents.length === 0)} 
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {uploading ?'Uploading...': isSubmitting ?'Saving...':'Save'}
              </button>
            </div>
            
            {activeTab ==='Activity'&& recurringRule !=='none'&& (
              <p className="text-xs text-stone-500 text-center mt-2">
                * Deleting this activity later will prompt you to delete all future instances.
              </p>
            )}

          </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
