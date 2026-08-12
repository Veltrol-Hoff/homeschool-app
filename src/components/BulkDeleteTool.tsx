'use client'

import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { bulkDeleteCalendarItems } from '@/app/calendar/actions'
import { format, addDays } from 'date-fns'

export default function BulkDeleteTool({ subjects = [], activities = [] }: { subjects?: any[], activities?: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState('')
  const [clearCourses, setClearCourses] = useState(true)
  const [clearActivities, setClearActivities] = useState(true)
  const [clearTrips, setClearTrips] = useState(true)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [confirmText, setConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (confirmText !== 'DELETE') {
      setMessage({ text: 'You must type DELETE to confirm.', type: 'error' })
      return
    }

    if (!clearCourses && !clearActivities && !clearTrips) {
      setMessage({ text: 'Please select at least one type of item to clear.', type: 'error' })
      return
    }

    if (!startDate) {
      setMessage({ text: 'Start date is required.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await bulkDeleteCalendarItems({
        startDate,
        endDate: endDate || null,
        clearCourses,
        clearActivities,
        clearTrips,
        selectedSubjects,
        selectedActivities
      })
      
      setMessage({ text: 'Calendar items successfully cleared.', type: 'success' })
      setConfirmText('')
      
      // Close modal after success
      setTimeout(() => {
        setIsOpen(false)
        setMessage(null)
      }, 2000)
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden mt-8">
      <div className="p-4 border-b border-red-100 bg-red-50 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <h2 className="font-bold text-lg text-red-700 flex items-center gap-2">
            <LucideIcons.AlertTriangle size={20} />
            Calendar Clean-Up Tool
          </h2>
          <p className="text-sm text-red-600 mt-1">Bulk delete scheduled items from your calendar.</p>
        </div>
        <button className="text-red-500 hover:text-red-700 transition-transform duration-200">
          {isOpen ? <LucideIcons.ChevronUp /> : <LucideIcons.ChevronDown />}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 bg-white">
          {message && (
            <div className={`p-3 rounded-md mb-6 text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Start Date (Required)</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full p-2 border border-stone-300 rounded-md focus:ring-slate-500 focus:border-slate-500 text-sm"
                />
                <p className="text-xs text-stone-500 mt-1">All items on or after this date will be permanently deleted.</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">End Date (Optional)</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-md focus:ring-slate-500 focus:border-slate-500 text-sm"
                />
                <p className="text-xs text-stone-500 mt-1">Leave blank to delete forever into the future.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-3">What should we delete?</label>
              <div className="space-y-3 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={clearCourses}
                      onChange={(e) => setClearCourses(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                    />
                    <div>
                      <span className="block font-medium text-stone-900 group-hover:text-slate-700">Coursework</span>
                      <span className="block text-xs text-stone-500">Planned logs that are attached to a Subject.</span>
                    </div>
                  </label>
                  {clearCourses && subjects.length > 0 && (
                    <div className="ml-7 p-3 bg-white border border-stone-200 rounded-md max-h-48 overflow-y-auto">
                      <p className="text-xs font-medium text-stone-500 mb-2">Select specific subjects (leave all unchecked to delete ALL):</p>
                      {subjects.map(sub => (
                        <label key={sub.id} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedSubjects.includes(sub.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedSubjects([...selectedSubjects, sub.id])
                              else setSelectedSubjects(selectedSubjects.filter(id => id !== sub.id))
                            }}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                          />
                          <span className="text-sm text-stone-700">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={clearActivities}
                      onChange={(e) => setClearActivities(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                    />
                    <div>
                      <span className="block font-medium text-stone-900 group-hover:text-slate-700">Extracurricular Activities</span>
                      <span className="block text-xs text-stone-500">Planned logs that are attached to an Activity.</span>
                    </div>
                  </label>
                  {clearActivities && activities.length > 0 && (
                    <div className="ml-7 p-3 bg-white border border-stone-200 rounded-md max-h-48 overflow-y-auto">
                      <p className="text-xs font-medium text-stone-500 mb-2">Select specific activities (leave all unchecked to delete ALL):</p>
                      {activities.map(act => (
                        <label key={act.id} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedActivities.includes(act.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedActivities([...selectedActivities, act.id])
                              else setSelectedActivities(selectedActivities.filter(id => id !== act.id))
                            }}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                          />
                          <span className="text-sm text-stone-700">{act.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={clearTrips}
                    onChange={(e) => setClearTrips(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                  />
                  <div>
                    <span className="block font-medium text-stone-900 group-hover:text-slate-700">Field Trips & Vacations</span>
                    <span className="block text-xs text-stone-500">Deletes the trip and its auto-generated logs.</span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-stone-500 mt-2 flex items-center gap-1"><LucideIcons.Info size={14}/> Completed items and portfolio media will NEVER be deleted by this tool.</p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-bold text-red-900 mb-2">
                Type DELETE to confirm
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full p-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm font-mono"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || confirmText !== 'DELETE'}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LucideIcons.Trash2 size={18} />
              {isSubmitting ? 'Clearing Calendar...' : 'Permanently Clear Calendar'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
