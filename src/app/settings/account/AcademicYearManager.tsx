'use client'

import { useState } from 'react'
import { createAcademicYear, deleteAcademicYear, updateAcademicYear, setActiveAcademicYear } from './actions'

export default function AcademicYearManager({ academicYears }: { academicYears: any[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const now = new Date()
  let startYear = now.getFullYear()
  const defaultStart = `${startYear}-07-01`
  const defaultEnd = `${startYear + 1}-06-30`
  const defaultName = `${startYear} - ${startYear + 1}`

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
        <h2 className="font-bold text-stone-900">Global Academic Years</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded"
        >
          {isAdding ? 'Cancel' : 'Add Academic Year'}
        </button>
      </div>

      {isAdding && (
        <form action={async (formData) => {
          await createAcademicYear(formData)
          setIsAdding(false)
        }} className="p-4 bg-white border-b border-slate-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Name / Label</label>
              <input type="text" name="name" defaultValue={defaultName} required className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Start Date</label>
              <input type="date" name="start_date" defaultValue={defaultStart} required className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">End Date</label>
              <input type="date" name="end_date" defaultValue={defaultEnd} required className="w-full border rounded p-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium">Save Academic Year</button>
        </form>
      )}

      <div className="divide-y divide-stone-100">
        {academicYears.map((year) => (
          <div key={year.id}>
            {editingId === year.id ? (
              <form action={async (formData) => {
                await updateAcademicYear(year.id, formData)
                setEditingId(null)
              }} className="p-4 bg-stone-50 border-b border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Name / Label</label>
                    <input type="text" name="name" defaultValue={year.name} required className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Start Date</label>
                    <input type="date" name="start_date" defaultValue={year.start_date} required className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">End Date</label>
                    <input type="date" name="end_date" defaultValue={year.end_date} required className="w-full border rounded p-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium">Save Changes</button>
                  <button type="button" onClick={() => setEditingId(null)} className="bg-stone-200 hover:bg-stone-300 px-4 py-2 rounded text-sm font-medium">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div>
                  <div className="font-medium text-slate-800 flex items-center gap-2">
                    {year.name}
                    {year.is_active && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="text-sm text-stone-600">{year.start_date} to {year.end_date}</div>
                </div>
                <div className="flex gap-3 items-center">
                  {!year.is_active && (
                    <button 
                      onClick={async () => {
                        await setActiveAcademicYear(year.id)
                      }}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Set Active
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingId(year.id)}
                    className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm('Are you sure? This will delete this academic year globally.')) {
                        await deleteAcademicYear(year.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {academicYears.length === 0 && !isAdding && (
          <div className="p-4 text-sm text-stone-600">No academic years defined yet.</div>
        )}
      </div>
    </div>
  )
}
