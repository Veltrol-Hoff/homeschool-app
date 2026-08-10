'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addTranscript, deleteTranscript, updateTranscript } from './actions'
import TranscriptGenerator from '@/components/TranscriptGenerator'

type Student = { id: string; name: string }
type AcademicYear = { id: string; student_id: string; year_label: string; grade_level: string }
type Subject = { id: string; name: string }
type Log = { student_id: string; academic_year_id: string; subject_id: string; duration_minutes: number }
type WorkSample = { id: string; log_id: string; subject_id: string; confirmed_score: string; daily_logs: { student_id: string; academic_year_id: string } }
type Transcript = { id: string; student_id: string; academic_year_id: string; subject_id: string; credit_earned: number; grade_mark: string; confirmed_date: string; course_name?: string | null; subjects?: { name: string } }

export default function TranscriptClient({
  students,
  academicYears,
  subjects,
  logs,
  workSamples,
  initialTranscripts
}: {
  students: Student[]
  academicYears: AcademicYear[]
  subjects: Subject[]
  logs: Log[]
  workSamples: WorkSample[]
  initialTranscripts: Transcript[]
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '')
  
  const studentYears = academicYears.filter(y => y.student_id === selectedStudentId)
  const [selectedYearId, setSelectedYearId] = useState(studentYears[0]?.id || '')
  
  const router = useRouter()

  const [transcripts, setTranscripts] = useState<Transcript[]>(initialTranscripts)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingCustom, setIsAddingCustom] = useState(false)

  useEffect(() => {
    setTranscripts(initialTranscripts)
  }, [initialTranscripts])

  // Handle student change
  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value
    setSelectedStudentId(sId)
    const y = academicYears.filter(y => y.student_id === sId)
    setSelectedYearId(y[0]?.id || '')
  }

  const confirmedTranscripts = transcripts.filter(t => t.student_id === selectedStudentId && t.academic_year_id === selectedYearId)

  // Calculate Draft Projections for the selected year
  const projectedSubjects = subjects.map(subject => {
    // Check if it's already finalized (we hide draft if AT LEAST ONE transcript exists for this subject)
    const hasConfirmedTranscript = confirmedTranscripts.some(t => t.subject_id === subject.id)
    if (hasConfirmedTranscript) return null

    // 1. Calculate hours logged
    const subjectLogs = logs.filter(l => 
      l.student_id === selectedStudentId && 
      l.academic_year_id === selectedYearId && 
      l.subject_id === subject.id
    )
    
    const totalMinutes = subjectLogs.reduce((acc, l) => acc + l.duration_minutes, 0)
    const totalHours = totalMinutes / 60
    
    // Suggest 1 credit per 120 hours, half-credit intervals
    let suggestedCredits = Math.round(totalHours / 120 * 2) / 2
    if (suggestedCredits > 1.0) suggestedCredits = 1.0 // cap at 1 credit for standard course
    
    // Suggest grade based on work samples
    const subjectSamples = workSamples.filter(ws => 
      ws.subject_id === subject.id && 
      ws.daily_logs.student_id === selectedStudentId && 
      ws.daily_logs.academic_year_id === selectedYearId
    )
    
    let suggestedGrade = 'A' // default suggestion
    if (subjectSamples.length > 0) {
      suggestedGrade = subjectSamples[subjectSamples.length - 1].confirmed_score || 'A'
    }

    return {
      subject,
      totalHours,
      suggestedCredits,
      suggestedGrade
    }
  }).filter(Boolean) as { subject: Subject, totalHours: number, suggestedCredits: number, suggestedGrade: string }[]

  const handleFinalize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await addTranscript(formData)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to finalize transcript.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateTranscript(formData)
      setEditingId(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to update transcript.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this confirmed course from the transcript?")) return
    setIsSubmitting(true)
    try {
      await deleteTranscript(id)
      setTranscripts(prev => prev.filter(t => t.id !== id))
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to delete.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-stone-100">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-700 mb-1">Student</label>
          <select 
            className="w-full p-2 border border-stone-300 rounded-lg bg-stone-50"
            value={selectedStudentId}
            onChange={handleStudentChange}
          >
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-700 mb-1">Academic Year</label>
          <select 
            className="w-full p-2 border border-stone-300 rounded-lg bg-stone-50"
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
          >
            {studentYears.map(y => <option key={y.id} value={y.id}>{y.year_label} (Grade {y.grade_level})</option>)}
          </select>
        </div>
      </div>

      {!selectedYearId ? (
        <div className="text-center p-8 text-stone-500">No academic year found for this student.</div>
      ) : (
        <div className="space-y-6">
          {/* Confirmed Transcripts Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-stone-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-xl">✓</span> Confirmed Transcript
              </h2>
            </div>
            
            {confirmedTranscripts.length === 0 ? (
              <div className="p-8 text-center text-stone-500 italic">
                No courses have been finalized for this academic year yet.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 text-sm border-b border-stone-100">
                  <tr>
                    <th className="p-4 font-medium">Course / Subject</th>
                    <th className="p-4 font-medium text-center">Credit</th>
                    <th className="p-4 font-medium text-center">Grade</th>
                    <th className="p-4 font-medium text-right">Confirmed Date</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {confirmedTranscripts.map(t => (
                    editingId === t.id ? (
                      <tr key={t.id} className="hover:bg-stone-50">
                        <td colSpan={5} className="p-0">
                          <form onSubmit={handleEditSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-amber-50">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="subject_id" value={t.subject_id} />
                            <div className="flex-1 w-full">
                              <h3 className="font-semibold text-sm text-stone-800">{t.subjects?.name || 'Subject'}</h3>
                              <input 
                                type="text"
                                name="course_name"
                                placeholder="Course Name (Optional)"
                                defaultValue={t.course_name || ''}
                                className="w-full max-w-xs p-1.5 text-sm border border-stone-300 rounded bg-white mt-1"
                              />
                            </div>
                            <div className="flex gap-4 items-center">
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1">Credit</label>
                                <input 
                                  type="number" step="0.1" name="credit_earned" defaultValue={t.credit_earned} 
                                  className="w-20 p-2 border border-stone-300 rounded-lg bg-white font-bold" required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1">Grade</label>
                                <input 
                                  type="text" name="grade_mark" defaultValue={t.grade_mark} 
                                  className="w-24 p-2 border border-stone-300 rounded-lg bg-white font-bold" required
                                />
                              </div>
                              <div className="pt-5 flex gap-2">
                                <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 bg-stone-800 text-white rounded-lg font-medium text-sm">Save</button>
                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-stone-500 font-medium hover:text-stone-700 text-sm">Cancel</button>
                              </div>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={t.id} className="hover:bg-stone-50">
                        <td className="p-4 font-medium text-stone-800">
                          {t.course_name || t.subjects?.name}
                          {t.course_name && (
                            <div className="text-xs text-stone-500 font-normal">{t.subjects?.name}</div>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold">{t.credit_earned.toFixed(2)}</td>
                        <td className="p-4 text-center"><span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-bold">{t.grade_mark}</span></td>
                        <td className="p-4 text-right text-stone-500 text-sm">{new Date(t.confirmed_date).toLocaleDateString()}</td>
                        <td className="p-4 text-right flex justify-end gap-3">
                          <button 
                            onClick={() => setEditingId(t.id)}
                            disabled={isSubmitting}
                            className="text-stone-400 hover:text-blue-500 transition-colors"
                            title="Edit transcript entry"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            disabled={isSubmitting}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                            title="Remove from transcript"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Draft Previews Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                <span className="text-xl">✏️</span> Draft Projections (Not on Transcript)
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                These are "what-if" calculations based on logged hours (approx. 120 hrs = 1 credit). Review, edit, and click Finalize to add them to the official record.
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {projectedSubjects.length === 0 ? (
                <div className="p-8 text-center text-stone-500">
                  All active subjects have been finalized!
                </div>
              ) : (
                projectedSubjects.map(p => (
                  <form key={p.subject.id} onSubmit={handleFinalize} className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between hover:bg-stone-50 transition-colors">
                    <input type="hidden" name="student_id" value={selectedStudentId} />
                    <input type="hidden" name="academic_year_id" value={selectedYearId} />
                    <input type="hidden" name="subject_id" value={p.subject.id} />
                    
                    <div className="flex-1 w-full">
                      <h3 className="font-semibold text-lg text-stone-800">{p.subject.name}</h3>
                      <p className="text-sm text-stone-500 mb-2">
                        {p.totalHours.toFixed(1)} hours logged
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">Course Name (Optional Override)</label>
                        <input 
                          type="text"
                          name="course_name"
                          placeholder="e.g. Biology 101"
                          className="w-full max-w-xs p-1.5 text-sm border border-stone-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 items-center w-full md:w-auto">
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">Credit</label>
                        <input 
                          type="number"
                          step="0.1"
                          name="credit_earned"
                          defaultValue={p.suggestedCredits} 
                          className="w-20 p-2 border border-stone-300 rounded-lg bg-white font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">Grade</label>
                        <input 
                          type="text"
                          name="grade_mark"
                          defaultValue={p.suggestedGrade} 
                          className="w-24 p-2 border border-stone-300 rounded-lg bg-white font-bold"
                          required
                        />
                      </div>
                      <div className="pt-5">
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          Finalize
                        </button>
                      </div>
                    </div>
                  </form>
                ))
              )}
            </div>

            {/* Add Custom Course Form */}
            <div className="p-4 bg-white border-t border-stone-100">
              {!isAddingCustom ? (
                <div className="flex justify-center">
                  <button 
                    onClick={() => setIsAddingCustom(true)} 
                    className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg font-medium transition-colors"
                  >
                    ➕ Add Custom Course
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  await handleFinalize(e)
                  setIsAddingCustom(false)
                }} className="w-full flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <input type="hidden" name="student_id" value={selectedStudentId} />
                  <input type="hidden" name="academic_year_id" value={selectedYearId} />
                  
                  <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-stone-500 mb-1">Subject</label>
                      <select name="subject_id" className="w-full p-2 border border-stone-300 rounded bg-white" required>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-stone-500 mb-1">Course Name</label>
                      <input type="text" name="course_name" placeholder="e.g. Physics" className="w-full p-2 border border-stone-300 rounded bg-white" required />
                    </div>
                  </div>

                  <div className="flex gap-4 items-center w-full md:w-auto">
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Credit</label>
                      <input type="number" step="0.1" name="credit_earned" defaultValue="1.0" className="w-20 p-2 border border-stone-300 rounded-lg bg-white font-bold" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Grade</label>
                      <input type="text" name="grade_mark" defaultValue="A" className="w-24 p-2 border border-stone-300 rounded-lg bg-white font-bold" required />
                    </div>
                    <div className="pt-5 flex gap-2">
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-stone-800 text-white rounded-lg font-medium transition-colors">Save</button>
                      <button type="button" onClick={() => setIsAddingCustom(false)} className="px-4 py-2 text-stone-500 font-medium">Cancel</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedYearId && (
        <div className="mt-8">
          <TranscriptGenerator 
            student={students.find(s => s.id === selectedStudentId) as any}
            academicYears={academicYears.filter(y => y.student_id === selectedStudentId) as any}
            transcripts={transcripts.filter(t => t.student_id === selectedStudentId) as any}
          />
        </div>
      )}
    </div>
  )
}
