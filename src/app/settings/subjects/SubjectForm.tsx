'use client'

import { useState } from'react'
import { createSubject, updateSubject, deleteSubject } from'./actions'
import * as LucideIcons from'lucide-react'

const COLORS = ['#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981','#14B8A6','#06B6D4','#0EA5E9','#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E','#78716C']
const ICONS = ['Book','BookOpen','Library','GraduationCap','PenTool','Pencil','Palette','Paintbrush','Music','Monitor','Laptop','Code','Terminal','Microscope','TestTube','FlaskConical','Atom','Telescope','Calculator','Binary','Globe','Map','Compass','Landmark','Mountain','Trees','Leaf','Tent','Dumbbell','Bike','Crosshair','Target','Trophy','Medal','Star','Heart','Smile','Brain','Lightbulb','Puzzle','Users','Activity','Zap','Flame','Crown','Shield']

export default function SubjectForm({ 
  mode, 
  subject 
}: { 
  mode:'create'|'edit', 
  subject?: any 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedColor, setSelectedColor] = useState(subject?.color_hex || COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(subject?.icon_name || ICONS[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('color_hex', selectedColor)
    formData.append('icon_name', selectedIcon)
    
    try {
      if (mode ==='create') {
        await createSubject(formData)
        e.currentTarget.reset()
        setSelectedColor(COLORS[0])
        setSelectedIcon(ICONS[0])
      } else {
        await updateSubject(subject.id, formData)
        setIsOpen(false)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this subject? It may break existing logs.')) return
    setIsSubmitting(true)
    try {
      await deleteSubject(subject.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Subject Name</label>
        <input 
          type="text"
          name="name"
          required 
          defaultValue={subject?.name}
          className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
          placeholder="e.g. Mathematics"
        />
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox"
          id={`is_state_required_${subject?.id ||'new'}`}
          name="is_state_required"
          defaultChecked={subject ? subject.is_state_required : true}
          className="rounded border-stone-300 text-slate-600 focus:ring-slate-500 w-5 h-5"
        />
        <label htmlFor={`is_state_required_${subject?.id ||'new'}`} className="text-sm font-medium">
          State Required (Counts toward 875 hours)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox"
          id={`is_family_subject_${subject?.id ||'new'}`}
          name="is_family_subject"
          defaultChecked={subject ? subject.is_family_subject : false}
          className="rounded border-stone-300 text-slate-600 focus:ring-slate-500 w-5 h-5"
        />
        <label htmlFor={`is_family_subject_${subject?.id ||'new'}`} className="text-sm font-medium">
          Family Subject (Taught jointly)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`w-8 h-8 rounded-full transition-all ${selectedColor === c ?'ring-2 ring-offset-2 ring-stone-900  scale-110':''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(i => {
            const Icon = (LucideIcons as any)[i] || LucideIcons.Circle
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIcon(i)}
                className={`p-2 rounded-md transition-all ${selectedIcon === i ?'bg-stone-200  shadow-inner':'hover:bg-stone-100'}`}
              >
                <Icon size={20} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ?'Saving...': (mode ==='create'?'Create Subject':'Save Changes')}
        </button>
      </div>
    </form>
  )

  if (mode ==='create') {
    return formContent
  }

  return (
    <>
      <div className="flex gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className="text-xs font-medium px-3 py-1.5 bg-stone-100 hover:bg-stone-200   rounded-md transition-colors"
        >
          Edit
        </button>
        <button 
          onClick={handleDelete}
          disabled={isSubmitting}
          className="text-xs font-medium px-3 py-1.5 text-red-600 hover:bg-red-50  rounded-md transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-900">Edit Subject</h3>
              <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600">&times;</button>
            </div>
            {formContent}
          </div>
        </div>
      )}
    </>
  )
}
