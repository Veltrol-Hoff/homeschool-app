'use client'

import { useState } from'react'
import { 
  updateStudentSettings, 
  addLivingBioEntry, 
  updateLivingBioEntry, 
  deleteLivingBioEntry, 
  addBioMedia,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from'./actions'
import { format } from'date-fns'
import * as LucideIcons from'lucide-react'

const GRADES = ['4K','5K','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade']

export default function StudentSettingsForm({ student, globalAcademicYears = [] }: { student: any, globalAcademicYears?: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingBio, setIsAddingBio] = useState(false)
  const [isAddingYear, setIsAddingYear] = useState(false)
  
  // Bio editing state
  const [editingBioId, setEditingBioId] = useState<string | null>(null)
  const [addingMediaBioId, setAddingMediaBioId] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState("")

  // Year editing state
  const [editingYearId, setEditingYearId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateStudentSettings(student.id, new FormData(e.currentTarget))
    } catch (err) {
      alert("Error saving settings")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Academic Year Handlers ---
  async function handleAddYear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsAddingYear(true)
    const form = e.currentTarget
    try {
      await createAcademicYear(student.id, new FormData(form))
      form.reset()
    } catch (err) {
      alert("Error adding academic year")
    } finally {
      setIsAddingYear(false)
    }
  }

  async function handleUpdateYear(e: React.FormEvent<HTMLFormElement>, yearId: string) {
    e.preventDefault()
    try {
      await updateAcademicYear(yearId, student.id, new FormData(e.currentTarget))
      setEditingYearId(null)
    } catch (err) {
      alert("Error updating academic year")
    }
  }

  async function handleDeleteYear(yearId: string) {
    if (!confirm("Are you sure you want to delete this academic year? All logs and transcripts associated with it will be deleted!")) return
    try {
      await deleteAcademicYear(yearId, student.id)
    } catch (err) {
      alert("Error deleting academic year")
    }
  }

  // --- Living Bio Handlers ---
  async function handleAddBio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsAddingBio(true)
    const form = e.currentTarget
    try {
      await addLivingBioEntry(student.id, new FormData(form))
      form.reset()
    } catch (err) {
      alert("Error adding bio entry")
    } finally {
      setIsAddingBio(false)
    }
  }

  async function handleUpdateBio(e: React.FormEvent<HTMLFormElement>, entryId: string) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      await updateLivingBioEntry(entryId, student.id, formData.get('entry_text') as string, formData.get('category') as string)
      setEditingBioId(null)
    } catch (err) {
      alert("Error updating bio entry")
    }
  }

  async function handleDeleteBio(entryId: string) {
    if (!confirm("Delete this bio entry?")) return
    try {
      await deleteLivingBioEntry(entryId, student.id)
    } catch (err) {
      alert("Error deleting bio entry")
    }
  }

  async function handleAddMedia(e: React.FormEvent, bioId: string) {
    e.preventDefault()
    if (!mediaUrl) return
    try {
      await addBioMedia(bioId, mediaUrl, student.id)
      setMediaUrl("")
      setAddingMediaBioId(null)
    } catch(err) {
      alert("Error adding media")
    }
  }

  const entries = student.living_bio_entries || []
  const years = student.student_academic_years || []

  // Sort years by start date descending
  years.sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  // Sort bio by created descending
  entries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="space-y-8">
      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <div className="flex gap-4 items-center">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt="Avatar"className="w-12 h-12 rounded-full object-cover border"/>
            ) : (
              <div className="w-12 h-12 rounded-full bg-stone-200  flex items-center justify-center">
                <LucideIcons.User className="text-stone-400"/>
              </div>
            )}
            <input 
              type="url"
              name="avatar_url"
              defaultValue={student.avatar_url ||''}
              placeholder="https://example.com/avatar.jpg"
              className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium mb-1">Current Grade Level</label>
          <select 
            name="current_grade_level"
            defaultValue={student.current_grade_level ||''}
            className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border text-sm"
          >
            <option value="">Select current grade...</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1 border-b pb-1">Calendar Accent Color</label>
            <div className="flex items-center gap-3 mt-2">
              <input 
                type="color"
                name="display_color"
                defaultValue={student.display_color ||'#10B981'}
                className="h-10 w-16 p-1 rounded cursor-pointer border border-stone-300  bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 border-b pb-1">Gamification Override</label>
            <input 
              type="number"
              name="reward_points"
              defaultValue={student.reward_points}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border text-sm mt-2"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium mb-2 border-b pb-1">Permissions</label>
          <div className="space-y-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox"
                name="can_view_grades"
                defaultChecked={student.can_view_grades}
                className="rounded border-stone-300 text-slate-600 focus:ring-slate-500"
              />
              Can view transcripts
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox"
                name="can_view_compliance"
                defaultChecked={student.can_view_compliance}
                className="rounded border-stone-300 text-slate-600 focus:ring-slate-500"
              />
              Can view compliance
            </label>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-stone-200 hover:bg-stone-300   text-stone-900  rounded-md font-medium transition-colors disabled:opacity-50 mt-4"
        >
          {isSubmitting ?'Saving...':'Save General Settings'}
        </button>
      </form>

      {/* Academic Years Management */}
      <div className="pt-8 border-t border-stone-200">
        <h3 className="text-lg font-bold mb-4">Academic Years & Transcript Grade</h3>
        
        <form onSubmit={handleAddYear} className="flex flex-wrap gap-2 mb-6 bg-stone-100 p-4 rounded-lg border border-stone-200">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Academic Year</label>
            <select name="academic_year_id" required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
              <option value="">Select a year...</option>
              {globalAcademicYears.map(y => <option key={y.id} value={y.id}>{y.name} ({y.start_date} to {y.end_date})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Grade Level</label>
            <select name="grade_level" required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={isAddingYear} className="w-full px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50">
              {isAddingYear ? 'Linking...' : 'Link to Year'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {years.length === 0 && <p className="text-sm text-stone-500 italic">No academic years added.</p>}
          {years.map((year: any) => (
            <div key={year.id} className="bg-white  border border-stone-100  p-4 rounded-lg shadow-sm">
              {editingYearId === year.id ? (
                <form onSubmit={(e) => handleUpdateYear(e, year.id)} className="flex flex-wrap gap-2">
                  <select name="academic_year_id" defaultValue={year.academic_year_id} required className="flex-1 min-w-[150px] rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
                    {globalAcademicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <select name="grade_level" defaultValue={year.grade_level} required className="flex-1 min-w-[100px] rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-2 bg-slate-600 text-white rounded-md text-sm hover:bg-slate-700"><LucideIcons.Check size={16} /></button>
                    <button type="button" onClick={() => setEditingYearId(null)} className="px-3 py-2 bg-stone-200 rounded-md text-sm"><LucideIcons.X size={16} /></button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{year.academic_years?.name} <span className="text-slate-600 ml-2 text-sm">{year.grade_level}</span></p>
                    <p className="text-xs text-stone-500">{year.academic_years?.start_date} to {year.academic_years?.end_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingYearId(year.id)} className="p-2 text-stone-500 hover:text-slate-600 rounded-md hover:bg-stone-100"><LucideIcons.Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteYear(year.id)} className="p-2 text-stone-500 hover:text-red-600 rounded-md hover:bg-stone-100"><LucideIcons.Trash2 size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Living Bio Timeline */}
      <div className="pt-8 border-t border-stone-200">
        <h3 className="text-lg font-bold mb-4">Living Bio Timeline</h3>
        
        <form onSubmit={handleAddBio} className="flex gap-2 mb-6">
          <select name="category"className="rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm">
            <option value="Milestone">Milestone</option>
            <option value="Interest">Interest</option>
            <option value="Goal">Goal</option>
          </select>
          <input 
            type="text"
            name="entry_text"
            required 
            placeholder="E.g. Started showing interest in coding..."
            className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"
          />
          <button type="submit"disabled={isAddingBio} className="px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50">
            {isAddingBio ?'Adding...':'Add Entry'}
          </button>
        </form>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-300  before:to-transparent">
          {entries.length === 0 && (
            <p className="text-sm text-stone-500 text-center italic mt-8 relative z-10">No living bio entries yet.</p>
          )}
          
          {entries.map((entry: any) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-stone-100 text-stone-500   shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {entry.category ==='Milestone'&& <LucideIcons.Star size={16} />}
                {entry.category ==='Interest'&& <LucideIcons.Heart size={16} />}
                {entry.category ==='Goal'&& <LucideIcons.Target size={16} />}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white  p-4 rounded-xl shadow border border-stone-200  group-hover:border-slate-200  transition-colors">
                {editingBioId === entry.id ? (
                  <form onSubmit={(e) => handleUpdateBio(e, entry.id)} className="space-y-2">
                    <select name="category"defaultValue={entry.category} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm">
                      <option value="Milestone">Milestone</option>
                      <option value="Interest">Interest</option>
                      <option value="Goal">Goal</option>
                    </select>
                    <textarea name="entry_text"defaultValue={entry.entry_text} required rows={3} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
                    <div className="flex justify-end gap-2">
                      <button type="button"onClick={() => setEditingBioId(null)} className="px-3 py-1 text-xs bg-stone-100 hover:bg-stone-200  rounded-md">Cancel</button>
                      <button type="submit"className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-700 text-white rounded-md">Save</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-stone-900">{entry.category}</div>
                      <div className="flex items-center gap-2">
                        <time className="text-xs text-stone-500">{format(new Date(entry.created_at),'MMM d, yyyy')}</time>
                        <button onClick={() => setEditingBioId(entry.id)} className="text-stone-400 hover:text-slate-600"><LucideIcons.Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteBio(entry.id)} className="text-stone-400 hover:text-red-600"><LucideIcons.Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="text-stone-600  text-sm">{entry.entry_text}</div>
                    
                    {/* Media Attachments */}
                    {entry.media_attachments && entry.media_attachments.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {entry.media_attachments.map((media: any) => (
                          <div key={media.id} className="relative group/media w-16 h-16 rounded-md overflow-hidden border border-stone-200">
                            <img src={media.file_url} alt="Bio media"className="w-full h-full object-cover"/>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {addingMediaBioId === entry.id ? (
                      <form onSubmit={(e) => handleAddMedia(e, entry.id)} className="mt-3 flex gap-2">
                        <input 
                          type="url"
                          placeholder="Paste image URL..."
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          required
                          className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-1.5 border text-xs"
                        />
                        <button type="submit"className="px-2 py-1 bg-slate-600 text-white text-xs rounded-md">Add</button>
                        <button type="button"onClick={() => setAddingMediaBioId(null)} className="px-2 py-1 bg-stone-200  text-xs rounded-md">Cancel</button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setAddingMediaBioId(entry.id)} 
                        className="mt-3 text-xs text-slate-600 flex items-center gap-1 hover:underline font-medium"
                      >
                        <LucideIcons.Plus size={12} /> Add Media
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
