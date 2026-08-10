'use client'

import { useRouter } from'next/navigation'
import { useState } from'react'
import GeneratePDFButton from'./GeneratePDFButton'
import SlideshowGenerator from'./SlideshowGenerator'

export default function ExportOptionsForm({ 
  students, 
  years, 
  selectedStudentId, 
  selectedYearId 
}: { 
  students: any[], 
  years: any[], 
  selectedStudentId: string, 
  selectedYearId: string 
}) {
  const router = useRouter()

  const [options, setOptions] = useState({
    hoursSummary: true,
    subjectChecklist: true,
    standardsCoverage: true,
    curriculumCompletion: true,
    portfolioPhotos: true,
    transcript: false
  })

  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/export?student=${e.target.value}`)
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/export?student=${selectedStudentId}&year=${e.target.value}`)
  }

  function toggleOption(key: keyof typeof options) {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden flex flex-col md:flex-row">
      
      {/* Left side: Configuration */}
      <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-stone-100  space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">Select Student</label>
            <select 
              value={selectedStudentId} 
              onChange={handleStudentChange}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">Academic Year</label>
            <select 
              value={selectedYearId} 
              onChange={handleYearChange}
              disabled={years.length === 0}
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500   p-2 disabled:opacity-50"
            >
              {years.length === 0 && <option value="">No years found</option>}
              {years.length > 0 && <option value="all">All Grades (Combined Portfolio)</option>}
              {years.map(y => (
                <option key={y.id} value={y.id}>{y.year_label} ({y.grade_level})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 border-b pb-2">Document Sections</h3>
          <div className="space-y-3">
            {[
              { id:'hoursSummary', label:'Hours Summary'},
              { id:'subjectChecklist', label:'6-Subject Checklist'},
              { id:'standardsCoverage', label:'Standards Coverage'},
              { id:'curriculumCompletion', label:'Curriculum Completion'},
              { id:'portfolioPhotos', label:'Portfolio Photos (Print)'},
              { id:'transcript', label:'Confirmed Grades / Transcript'}
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={options[opt.id as keyof typeof options]}
                  onChange={() => toggleOption(opt.id as keyof typeof options)}
                  className="rounded border-stone-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-sm text-stone-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Right side: Actions */}
      <div className="p-6 md:w-1/2 bg-stone-50  flex flex-col justify-center space-y-8">
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-1">Official Portfolio PDF</h3>
            <p className="text-sm text-stone-500">Generates a cleanly formatted, printable document containing the selected sections.</p>
          </div>
          <div className="flex justify-center">
            <GeneratePDFButton 
              student={selectedStudent} 
              yearId={selectedYearId} 
              options={options} 
            />
          </div>
        </div>

        <div className="border-t border-stone-200  pt-8 space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-1">Highlight Slideshow</h3>
            <p className="text-sm text-stone-500">Renders a video sequence of all media marked as"portfolio samples"this year.</p>
          </div>
          <div className="flex justify-center">
            <SlideshowGenerator studentId={selectedStudentId} yearId={selectedYearId} />
          </div>
        </div>

      </div>
    </div>
  )
}
