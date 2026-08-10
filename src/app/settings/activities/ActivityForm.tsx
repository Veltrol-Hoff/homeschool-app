'use client'

import { useState } from'react'
import { createActivity, updateActivity, deleteActivity } from'./actions'
import * as LucideIcons from'lucide-react'

const AVAILABLE_ICONS = ['Book','BookOpen','Library','GraduationCap','PenTool','Pencil','Palette','Paintbrush','Music','Monitor','Laptop','Code','Terminal','Microscope','TestTube','FlaskConical','Atom','Telescope','Calculator','Binary','Globe','Map','Compass','Landmark','Mountain','Trees','Leaf','Tent','Dumbbell','Bike','Crosshair','Target','Trophy','Medal','Star','Heart','Smile','Brain','Lightbulb','Puzzle','Users','Activity','Zap','Flame','Crown','Shield']
const AVAILABLE_COLORS = ['#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981','#14B8A6','#06B6D4','#0EA5E9','#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E','#78716C']

export default function ActivityForm({ 
  mode ='create', 
  activity 
}: { 
  mode?:'create'|'edit', 
  activity?: any 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(activity?.icon ||'Dumbbell')
  const [selectedColor, setSelectedColor] = useState(activity?.color ||'#3B82F6')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('icon', selectedIcon)
    formData.set('color', selectedColor)

    try {
      if (mode ==='edit') {
        await updateActivity(activity.id, formData)
        setIsOpen(false)
      } else {
        await createActivity(formData)
        form.reset()
        setSelectedIcon('Dumbbell')
        setSelectedColor('#3B82F6')
      }
    } catch (err: any) {
      alert(`Error saving activity: ${err.message ||'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this activity?')) return
    setIsSubmitting(true)
    try {
      await deleteActivity(activity.id)
    } catch (err) {
      alert('Error deleting activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className={mode ==='create'?"bg-white  p-6 rounded-xl border border-stone-100  shadow-sm space-y-4":"space-y-4"}>
      {mode ==='create'&& <h3 className="font-bold text-lg mb-4">Create New Activity</h3>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Activity Name</label>
        <input 
          type="text"
          name="name"
          defaultValue={activity?.name ||''} 
          required 
          className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_ICONS.map(iconName => {
            const Icon = (LucideIcons as any)[iconName] || LucideIcons.Dumbbell
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                className={`p-2 rounded-md border transition-colors ${selectedIcon === iconName ?'bg-slate-100 border-slate-500 text-slate-700':'border-stone-200  hover:bg-stone-50'}`}
              >
                <Icon size={20} />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === color ?'scale-110 border-stone-900':'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-stone-900 hover:bg-stone-800   text-white rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ?'Saving...': (mode ==='edit'?'Save Changes':'Create Activity')}
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
              <h3 className="text-lg font-bold text-stone-900">Edit Activity</h3>
              <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600">&times;</button>
            </div>
            {formContent}
          </div>
        </div>
      )}
    </>
  )
}
