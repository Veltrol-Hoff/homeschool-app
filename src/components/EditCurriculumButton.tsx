'use client'

import { useState } from'react'
import EditCurriculumModal from'./EditCurriculumModal'

export default function EditCurriculumButton({
  curriculum,
  subjects,
  students
}: {
  curriculum: any
  subjects: any[]
  students: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 text-stone-500 hover:text-slate-600   transition-colors"
        title="Edit Curriculum Details"
      >
        <svg xmlns="http://www.w3.org/2000/svg"width="20"height="20"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
      </button>

      {isOpen && (
        <EditCurriculumModal 
          curriculum={curriculum} 
          subjects={subjects} 
          students={students} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
