'use client'

import { useState } from 'react'
import ScheduleCurriculumModal from './ScheduleCurriculumModal'

export default function ScheduleCurriculumButton({
  curriculumId,
  students
}: {
  curriculumId: string
  students: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors"
      >
        Schedule on Calendar
      </button>

      {isOpen && (
        <ScheduleCurriculumModal 
          curriculumId={curriculumId} 
          students={students} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
