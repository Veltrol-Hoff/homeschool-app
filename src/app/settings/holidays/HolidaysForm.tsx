'use client'

import { useState } from 'react'
import { addHoliday, deleteHoliday, updateHoliday, bulkAddUSHolidays } from './actions'

export default function HolidaysForm({ academicYears, holidays }: { academicYears: any[], holidays: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedYearIds, setExpandedYearIds] = useState<Set<string>>(new Set(academicYears.length > 0 ? [academicYears[0].id] : []))

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    try {
      await addHoliday(formData)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleYear = (id: string) => {
    const newSet = new Set(expandedYearIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedYearIds(newSet)
  }

  // Group holidays by academic year
  const groupedHolidays = academicYears.map(ay => {
    return {
      ...ay,
      holidays: holidays.filter(h => h.academic_year_id === ay.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
  }).filter(group => group.holidays.length > 0)

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
        <h2 className="text-xl font-bold mb-4">Add Holiday / Break</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="academic_year_id" className="block text-sm font-medium mb-1">Academic Year</label>
              <select 
                id="academic_year_id" 
                name="academic_year_id" 
                required
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 p-2.5 border text-ellipsis"
              >
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Holiday Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required
                placeholder="e.g. Thanksgiving Break"
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 p-2.5 border"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
              <input 
                type="date" 
                id="date" 
                name="date" 
                required
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 p-2.5 border"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add Holiday'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100">
          <h3 className="font-semibold mb-2">Quick Add Standard US Holidays</h3>
          <p className="text-sm text-stone-500 mb-4">Automatically calculate and add federal holidays (Thanksgiving, MLK Day, etc.) for an academic year.</p>
          <form 
            onSubmit={async (e) => {
              e.preventDefault()
              setIsBulkAdding(true)
              const formData = new FormData(e.currentTarget)
              const yearId = formData.get('academic_year_id') as string
              try {
                const res = await bulkAddUSHolidays(yearId)
                alert(`Added ${res.count} US holidays!`)
              } catch (err: any) {
                alert(err.message)
              } finally {
                setIsBulkAdding(false)
              }
            }}
            className="flex gap-2"
          >
            <select name="academic_year_id" required className="rounded-md border-stone-300 shadow-sm p-2 text-sm border focus:ring-slate-500 bg-stone-50">
              {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
            <button type="submit" disabled={isBulkAdding} className="px-4 py-2 bg-stone-200 text-stone-800 text-sm font-medium rounded-md hover:bg-stone-300 disabled:opacity-50">
              {isBulkAdding ? 'Adding...' : 'Add US Holidays'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <h2 className="text-xl font-bold p-6 border-b border-stone-100 bg-stone-50">Existing Holidays</h2>
        
        {groupedHolidays.length === 0 ? (
          <div className="p-6 text-center text-stone-500">
            No holidays defined yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {groupedHolidays.map(group => (
              <div key={group.id} className="bg-white">
                <button 
                  onClick={() => toggleYear(group.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{group.name}</h3>
                    <p className="text-xs text-stone-500">{group.holidays.length} holidays defined</p>
                  </div>
                  <span className="text-slate-400">
                    {expandedYearIds.has(group.id) ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedYearIds.has(group.id) && (
                  <div className="border-t border-stone-100 bg-stone-50/50">
                    {group.holidays.map((holiday: any) => (
                      <div key={holiday.id} className="p-4 pl-8 border-b border-stone-100 last:border-0 hover:bg-white transition-colors">
                        {editingId === holiday.id ? (
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              try {
                                await updateHoliday(holiday.id, formData)
                                setEditingId(null)
                              } catch (err: any) {
                                alert(err.message)
                              }
                            }}
                            className="flex flex-wrap items-center gap-3"
                          >
                            <select 
                              name="academic_year_id" 
                              defaultValue={holiday.academic_year_id}
                              required
                              className="flex-1 min-w-[120px] rounded-md border-stone-300 shadow-sm p-2 text-sm border focus:ring-slate-500"
                            >
                              {academicYears.map(ay => (
                                <option key={ay.id} value={ay.id}>{ay.name}</option>
                              ))}
                            </select>
                            
                            <input 
                              type="text" 
                              name="name" 
                              defaultValue={holiday.name}
                              required
                              className="flex-[2] min-w-[150px] rounded-md border-stone-300 shadow-sm p-2 text-sm border focus:ring-slate-500"
                            />
                            
                            <input 
                              type="date" 
                              name="date" 
                              defaultValue={holiday.date}
                              required
                              className="flex-1 min-w-[130px] rounded-md border-stone-300 shadow-sm p-2 text-sm border focus:ring-slate-500"
                            />
                            
                            <div className="flex gap-1 ml-auto">
                              <button type="submit" className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700">Save</button>
                              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-stone-200 text-stone-800 text-sm rounded-md hover:bg-stone-300">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-slate-700">{holiday.name}</h4>
                              <p className="text-sm text-stone-500 font-mono mt-0.5">
                                {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditingId(holiday.id)}
                                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={async () => await deleteHoliday(holiday.id)}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
